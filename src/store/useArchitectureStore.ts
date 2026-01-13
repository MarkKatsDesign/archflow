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
import type { ArchitectureTemplate, TemplateNode } from '../types/template';
import { services } from '../data/services';

/**
 * Calculates the optimal source and target handles based on node positions.
 * Returns handles that create the most direct and visually appealing connection.
 */
function calculateOptimalHandles(
  sourceNode: TemplateNode,
  targetNode: TemplateNode
): { sourceHandle: 'top' | 'bottom' | 'left' | 'right'; targetHandle: 'top' | 'bottom' | 'left' | 'right' } {
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;

  // Use absolute values to determine primary direction
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // If vertical distance is greater, prefer vertical connections (top/bottom)
  if (absDy > absDx) {
    if (dy > 0) {
      // Target is below source
      return { sourceHandle: 'bottom', targetHandle: 'top' };
    } else {
      // Target is above source
      return { sourceHandle: 'top', targetHandle: 'bottom' };
    }
  } else {
    // Horizontal distance is greater, prefer horizontal connections (left/right)
    if (dx > 0) {
      // Target is to the right of source
      return { sourceHandle: 'right', targetHandle: 'left' };
    } else {
      // Target is to the left of source
      return { sourceHandle: 'left', targetHandle: 'right' };
    }
  }
}

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

      // Calculate optimal handles if not explicitly specified in template
      const sourceTemplateNode = template.nodes[templateEdge.sourceIndex];
      const targetTemplateNode = template.nodes[templateEdge.targetIndex];
      const optimalHandles = calculateOptimalHandles(sourceTemplateNode, targetTemplateNode);

      return {
        id: `edge-${Date.now()}-${idx}`,
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: templateEdge.sourceHandle ?? optimalHandles.sourceHandle,
        targetHandle: templateEdge.targetHandle ?? optimalHandles.targetHandle,
        animated: templateEdge.animated ?? false,
        label: templateEdge.label,
      };
    });

    set({ nodes, edges, selectedNodeId: null });
  },
}));
