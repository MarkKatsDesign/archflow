import React, { useCallback, useRef, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  ConnectionLineType,
} from 'reactflow';
import type { ReactFlowInstance, EdgeMouseHandler } from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import { useArchitectureStore } from '../../store/useArchitectureStore';
import type { Service } from '../../types/service';
import type { ServiceNodeData, ServiceNode } from '../../types/architecture';

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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const serviceData = event.dataTransfer.getData('application/reactflow');
      if (!serviceData) return;

      const service: Service = JSON.parse(serviceData);
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: ServiceNode = {
        id: `${service.id}-${Date.now()}`,
        type: 'service',
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
          stroke: isSelected ? '#3b82f6' : edge.style?.stroke || '#64748b',
        },
        labelStyle: {
          ...edge.labelStyle,
          fill: isSelected ? '#1e40af' : '#1e293b',
          fontWeight: isSelected ? 700 : 600,
        },
        labelBgStyle: {
          ...edge.labelBgStyle,
          fill: isSelected ? '#dbeafe' : '#ffffff',
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
        onNodesChange={onNodesChange}
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
          type: 'smoothstep',
          style: {
            strokeWidth: 2,
            stroke: '#64748b',
          },
          labelStyle: {
            fill: '#1e293b',
            fontWeight: 600,
            fontSize: 12,
          },
          labelBgStyle: {
            fill: '#ffffff',
            fillOpacity: 0.9,
          },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          strokeWidth: 2,
          stroke: '#3b82f6',
          strokeDasharray: '5 5',
        }}
        snapToGrid={true}
        snapGrid={[15, 15]}
        fitView
        className="bg-gradient-to-br from-gray-50 to-blue-50"
      >
        <Background color="#94a3b8" gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as ServiceNodeData;
            return data.service.color;
          }}
          className="bg-white"
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
