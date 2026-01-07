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
}));
