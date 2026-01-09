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
  selectedEdgeId: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: ServiceNode) => void;
  updateEdge: (edgeId: string, updates: Partial<ServiceEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  setNodes: (nodes: ServiceNode[]) => void;
  setEdges: (edges: ServiceEdge[]) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  applyTemplate: (template: ArchitectureTemplate) => void;
}

export const useArchitectureStore = create<ArchitectureStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,

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
      edges: addEdge(
        {
          ...connection,
          animated: true,
        },
        get().edges
      ),
    });
  },

  addNode: (node: ServiceNode) => {
    set({ nodes: [...get().nodes, node] });
  },

  updateEdge: (edgeId: string, updates: Partial<ServiceEdge>) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      ),
    });
  },

  deleteEdge: (edgeId: string) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== edgeId),
      selectedEdgeId: null,
    });
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

  setSelectedEdgeId: (edgeId: string | null) => {
    set({ selectedEdgeId: edgeId });
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
        animated: templateEdge.animated ?? false,
        label: templateEdge.label,
      };
    });

    set({ nodes, edges, selectedNodeId: null });
  },
}));
