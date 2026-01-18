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
  Node,
} from 'reactflow';
import type { ServiceNode, ServiceEdge, ArchNode } from '../types/architecture';
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
  nodes: ArchNode[];
  edges: ServiceEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: ArchNode) => void;
  updateEdge: (edgeId: string, updates: Partial<ServiceEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  deleteNode: (nodeId: string) => void;
  setNodes: (nodes: ArchNode[]) => void;
  setEdges: (edges: ServiceEdge[]) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  applyTemplate: (template: ArchitectureTemplate) => void;
  // Group operations
  addNodeToGroup: (nodeId: string, groupId: string) => void;
  removeNodeFromGroup: (nodeId: string) => void;
  // Label editing
  updateNodeLabel: (nodeId: string, label: string) => void;
}

export const useArchitectureStore = create<ArchitectureStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes as Node[]) as ArchNode[],
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

  addNode: (node: ArchNode) => {
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

  deleteNode: (nodeId: string) => {
    const { nodes, edges } = get();
    const nodeToDelete = nodes.find((n) => n.id === nodeId);

    if (!nodeToDelete) return;

    // If deleting a group, unparent all children (don't delete them)
    if (nodeToDelete.type === 'group') {
      const updatedNodes = nodes.map((n) => {
        if (n.parentNode === nodeId) {
          // Convert child position from relative to absolute
          const absolutePosition = {
            x: n.position.x + nodeToDelete.position.x,
            y: n.position.y + nodeToDelete.position.y,
          };
          return {
            ...n,
            parentNode: undefined,
            extent: undefined,
            position: absolutePosition,
          };
        }
        return n;
      });

      set({
        nodes: updatedNodes.filter((n) => n.id !== nodeId) as ArchNode[],
        edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        selectedNodeId: null,
      });
    } else {
      set({
        nodes: nodes.filter((n) => n.id !== nodeId) as ArchNode[],
        edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        selectedNodeId: null,
      });
    }
  },

  setNodes: (nodes: ArchNode[]) => {
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

  // Add a node to a group
  addNodeToGroup: (nodeId: string, groupId: string) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);
    const group = nodes.find((n) => n.id === groupId);

    if (!node || !group || group.type !== 'group') return;

    // Convert position from absolute to relative
    const relativePosition = {
      x: node.position.x - group.position.x,
      y: node.position.y - group.position.y,
    };

    set({
      nodes: nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              parentNode: groupId,
              extent: 'parent' as const,
              position: relativePosition,
            }
          : n
      ) as ArchNode[],
    });
  },

  // Remove a node from its parent group
  removeNodeFromGroup: (nodeId: string) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);

    if (!node || !node.parentNode) return;

    const parentGroup = nodes.find((n) => n.id === node.parentNode);
    if (!parentGroup) return;

    // Convert position from relative to absolute
    const absolutePosition = {
      x: node.position.x + parentGroup.position.x,
      y: node.position.y + parentGroup.position.y,
    };

    set({
      nodes: nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              parentNode: undefined,
              extent: undefined,
              position: absolutePosition,
            }
          : n
      ) as ArchNode[],
    });
  },

  // Update a node's display label
  updateNodeLabel: (nodeId: string, label: string) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label,
              },
            }
          : node
      ) as ArchNode[],
    });
  },
}));
