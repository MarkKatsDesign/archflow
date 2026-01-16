import React, { useCallback, useRef, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ConnectionLineType,
  Panel,
} from "reactflow";
import type { ReactFlowInstance, EdgeMouseHandler, Node } from "reactflow";
import "reactflow/dist/style.css";
import { MousePointer2, ArrowRight, Layers } from "lucide-react";

import CustomNode from "./CustomNode";
import GroupNode from "./GroupNode";
import AlignmentGuides from "./AlignmentGuides";
import { useArchitectureStore } from "../../store/useArchitectureStore";
import { useAlignmentGuides } from "../../hooks/useAlignmentGuides";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { useThemeStore } from "../../store/useThemeStore";
import type { Service } from "../../types/service";
import type { BoundaryZone } from "../../types/infrastructure";
import type {
  ServiceNodeData,
  GroupNodeData,
  ServiceNode,
  GroupNode as GroupNodeType,
  ArchNode,
} from "../../types/architecture";

// Empty state component
function EmptyCanvasState() {
  const { openWizard } = useOnboardingStore();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-center pointer-events-auto animate-fade-in">
        {/* Illustration */}
        <div className="w-32 h-32 mx-auto mb-6 relative">
          {/* Background pattern */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-indigo-900/50 empty-state-pattern opacity-50" />
          {/* Icon stack */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center transform -rotate-6">
                <Layers className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md flex items-center justify-center">
                <MousePointer2 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Start Building Your Architecture
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
          Drag services from the sidebar or use a template to get started quickly
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={openWizard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium btn-gradient-primary text-white shadow-md"
          >
            Use Template
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Hint */}
        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
          Or drag a component from the left sidebar
        </p>
      </div>
    </div>
  );
}

const nodeTypes = {
  service: CustomNode,
  group: GroupNode,
};

// Helper to find the innermost group at a given position
function findParentGroupAtPosition(
  nodes: ArchNode[],
  position: { x: number; y: number }
): GroupNodeType | null {
  // Filter to only group nodes
  const groupNodes = nodes.filter(
    (node): node is GroupNodeType => node.type === "group"
  );

  // Find the smallest group that contains the position
  // (handles nested groups - innermost takes priority)
  let bestMatch: GroupNodeType | null = null;
  let smallestArea = Infinity;

  for (const group of groupNodes) {
    const width = group.style?.width ?? 300;
    const height = group.style?.height ?? 200;

    const isInside =
      position.x >= group.position.x &&
      position.x <= group.position.x + width &&
      position.y >= group.position.y &&
      position.y <= group.position.y + height;

    if (isInside) {
      const area = width * height;
      if (area < smallestArea) {
        smallestArea = area;
        bestMatch = group;
      }
    }
  }

  return bestMatch;
}

function ArchitectureCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
  } = useArchitectureStore();

  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  // Smart alignment guides for smooth drag experience
  const { guides, isShiftPressed, onNodesChangeWithAlignment } =
    useAlignmentGuides(nodes);

  // Wrap onNodesChange with alignment logic
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChangeWithAlignment(changes, onNodesChange, nodes);
    },
    [onNodesChange, onNodesChangeWithAlignment, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Check for service data (existing behavior)
      const serviceData = event.dataTransfer.getData("application/reactflow");
      if (serviceData) {
        const service: Service = JSON.parse(serviceData);

        // Find if drop position is inside a group node
        const parentGroup = findParentGroupAtPosition(nodes, position);

        const newNode: ServiceNode = {
          id: `${service.id}-${Date.now()}`,
          type: "service",
          position: parentGroup
            ? {
                // Position relative to parent (with padding offset)
                x: position.x - parentGroup.position.x,
                y: position.y - parentGroup.position.y,
              }
            : position,
          data: {
            service,
            label: service.shortName,
          },
          // Parent relationship if dropped inside a group
          ...(parentGroup && {
            parentNode: parentGroup.id,
            extent: "parent" as const,
            expandParent: true,
          }),
        };

        addNode(newNode);
        return;
      }

      // Check for boundary zone data (new for Phase 9)
      const zoneData = event.dataTransfer.getData("application/reactflow-zone");
      if (zoneData) {
        const zone: BoundaryZone = JSON.parse(zoneData);

        // Groups can also be nested inside other groups
        const parentGroup = findParentGroupAtPosition(nodes, position);

        const newNode: GroupNodeType = {
          id: `${zone.id}-${Date.now()}`,
          type: "group",
          position: parentGroup
            ? {
                x: position.x - parentGroup.position.x,
                y: position.y - parentGroup.position.y,
              }
            : position,
          data: {
            zone,
            label: zone.shortName,
          },
          style: {
            width: 300,
            height: 200,
          },
          // Nested groups
          ...(parentGroup && {
            parentNode: parentGroup.id,
            extent: "parent" as const,
            expandParent: true,
          }),
        };

        addNode(newNode);
      }
    },
    [reactFlowInstance, addNode, nodes]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null); // Deselect any selected node
    },
    [setSelectedEdgeId, setSelectedNodeId]
  );

  // Sort nodes so groups render behind services (lower zIndex)
  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      // Groups should come first (rendered behind)
      const aIsGroup = a.type === "group" ? 0 : 1;
      const bIsGroup = b.type === "group" ? 0 : 1;
      return aIsGroup - bIsGroup;
    });
  }, [nodes]);

  // Apply dynamic styling to edges based on selection
  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isSelected = edge.id === selectedEdgeId;
      return {
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: isSelected ? 4 : 2,
          stroke: isSelected ? "#3b82f6" : edge.style?.stroke || "#64748b",
        },
        labelStyle: {
          ...edge.labelStyle,
          fill: isSelected ? "#1e40af" : "#1e293b",
          fontWeight: isSelected ? 700 : 600,
        },
        labelBgStyle: {
          ...edge.labelBgStyle,
          fill: isSelected ? "#dbeafe" : "#ffffff",
          fillOpacity: isSelected ? 1 : 0.9,
        },
      };
    });
  }, [edges, selectedEdgeId]);

  // Get node color for minimap (handles both service and group nodes)
  const getNodeColor = useCallback((node: Node) => {
    if (node.type === "group") {
      const data = node.data as GroupNodeData;
      return data.zone.color;
    }
    const data = node.data as ServiceNodeData;
    return data.service?.color || "#64748b";
  }, []);

  const isEmpty = nodes.length === 0;
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div ref={reactFlowWrapper} className="h-full w-full relative canvas-vignette">
      <ReactFlow
        nodes={sortedNodes}
        edges={styledEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: "default",
          style: {
            strokeWidth: 2,
            stroke: isDark ? "#94a3b8" : "#64748b",
          },
          labelStyle: {
            fill: isDark ? "#e2e8f0" : "#1e293b",
            fontWeight: 600,
            fontSize: 12,
          },
          labelBgStyle: {
            fill: isDark ? "#1e293b" : "#ffffff",
            fillOpacity: 0.9,
          },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
        }}
        connectionLineType={ConnectionLineType.Bezier}
        connectionLineStyle={{
          strokeWidth: 2,
          stroke: "#3b82f6",
          strokeDasharray: "5 5",
        }}
        fitView
        className={isDark
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50"
          : "bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/50"
        }
      >
        {/* Refined grid - larger spacing, lower opacity */}
        <Background color={isDark ? "#475569" : "#cbd5e1"} gap={24} size={1} />
        <Controls />

        {/* Smart alignment guides */}
        <AlignmentGuides guides={guides} />

        {/* Shift key indicator for grid snap mode */}
        {isShiftPressed && (
          <Panel position="top-center" className="pointer-events-none">
            <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-xs font-medium text-white shadow-lg">
              Grid Snap Mode (15px)
            </div>
          </Panel>
        )}

        {/* Canvas Overview - Bottom Right, above Smart Suggestions */}
        {!isEmpty && (
          <MiniMap
            nodeColor={getNodeColor}
            className="absolute! bottom-24! right-4! z-50!"
            style={{
              width: 200,
              height: 120,
              border: isDark ? "1px solid #334155" : "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              backgroundColor: isDark ? "#1e293b" : "white",
            }}
            maskColor={isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(240, 243, 248, 0.7)"}
            pannable
            zoomable
            ariaLabel="Canvas Overview"
          />
        )}
      </ReactFlow>

      {/* Empty state overlay */}
      {isEmpty && <EmptyCanvasState />}
    </div>
  );
}

export default function ArchitectureCanvas() {
  return (
    <ReactFlowProvider>
      <ArchitectureCanvasInner />
    </ReactFlowProvider>
  );
}
