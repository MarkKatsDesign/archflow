import React, { useCallback, useRef, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ConnectionLineType,
  Panel,
} from "reactflow";
import type { ReactFlowInstance, EdgeMouseHandler } from "reactflow";
import "reactflow/dist/style.css";

import CustomNode from "./CustomNode";
import AlignmentGuides from "./AlignmentGuides";
import { useArchitectureStore } from "../../store/useArchitectureStore";
import { useAlignmentGuides } from "../../hooks/useAlignmentGuides";
import type { Service } from "../../types/service";
import type { ServiceNodeData, ServiceNode } from "../../types/architecture";

const nodeTypes = {
  service: CustomNode,
};

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

      const serviceData = event.dataTransfer.getData("application/reactflow");
      if (!serviceData) return;

      const service: Service = JSON.parse(serviceData);
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: ServiceNode = {
        id: `${service.id}-${Date.now()}`,
        type: "service",
        position,
        data: {
          service,
          label: service.shortName,
        },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: ServiceNode) => {
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

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
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
            stroke: "#64748b",
          },
          labelStyle: {
            fill: "#1e293b",
            fontWeight: 600,
            fontSize: 12,
          },
          labelBgStyle: {
            fill: "#ffffff",
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
        className="bg-linear-to-br from-gray-50 to-blue-50"
      >
        <Background color="#94a3b8" gap={16} size={1} />
        <Controls />

        {/* Smart alignment guides */}
        <AlignmentGuides guides={guides} />

        {/* Shift key indicator for grid snap mode */}
        {isShiftPressed && (
          <Panel position="top-center" className="pointer-events-none">
            <div className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
              Grid Snap Mode (15px)
            </div>
          </Panel>
        )}

        {/* Canvas Overview - Bottom Right, above Smart Suggestions */}
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as ServiceNodeData;
            return data.service.color;
          }}
          className="absolute! bottom-24! right-4! z-50!"
          style={{
            width: 200,
            height: 120,
            border: "2px solid #d1d5db",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            backgroundColor: "white",
          }}
          maskColor="rgba(240, 243, 248, 0.7)"
          pannable
          zoomable
          ariaLabel="Canvas Overview"
        />
      </ReactFlow>
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
