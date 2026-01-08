import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import type {
  Connection,
  EdgeChange,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import type { ServiceNode, ServiceEdge } from '../types/architecture';
import type { ArchitectureTemplate } from '../types/template';
import { services } from '../data/services';

interface ArchitectureStore {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
  selectedNodeId: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: ServiceNode) => void;
  setNodes: (nodes: ServiceNode[]) => void;
  setEdges: (edges: ServiceEdge[]) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  applyTemplate: (template: ArchitectureTemplate) => void;
}

export const useArchitectureStore = create<ArchitectureStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as ServiceNode[],
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addNode: (node: ServiceNode) => {
    set({ nodes: [...get().nodes, node] });
  },

  setNodes: (nodes: ServiceNode[]) => {
    set({ nodes });
  },

  setEdges: (edges: ServiceEdge[]) => {
    set({ edges });
  },

  setSelectedNodeId: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  applyTemplate: (template: ArchitectureTemplate) => {
    // Generate unique node IDs and populate with full service data
    const nodes: ServiceNode[] = template.nodes.map((templateNode, idx) => {
      const service = services.find((s) => s.id === templateNode.data.service.id);
      if (!service) {
        throw new Error(`Service not found: ${templateNode.data.service.id}`);
      }

      return {
        id: `${service.id}-${Date.now()}-${idx}`,
        type: 'service',
        position: templateNode.position,
        data: {
          service,
          label: service.shortName,
        },
      };
    });

    // Map edges to actual node IDs
    const edges: ServiceEdge[] = template.edges.map((templateEdge, idx) => {
      const sourceNode = nodes[templateEdge.sourceIndex];
      const targetNode = nodes[templateEdge.targetIndex];

      return {
        id: `edge-${Date.now()}-${idx}`,
        source: sourceNode.id,
        target: targetNode.id,
        type: templateEdge.type,
        animated: templateEdge.animated,
        label: templateEdge.label,
      };
    });

    set({ nodes, edges, selectedNodeId: null });
  },
}));
