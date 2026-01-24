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
  ReactFlowInstance,
} from 'reactflow';
import type { ServiceNode, ServiceEdge, ArchNode, GroupNode } from '../types/architecture';
import type { ArchitectureTemplate, TemplateNode } from '../types/template';
import { isTemplateGroupNode } from '../types/template';
import { services } from '../data/services';
import { boundaryZones } from '../data/infrastructure';

/**
 * Sort nodes so that parent nodes appear before their children.
 * React Flow requires this ordering to properly resolve parent relationships.
 */
function sortNodesParentsFirst(nodes: ArchNode[]): ArchNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const sorted: ArchNode[] = [];
  const visited = new Set<string>();

  // Get depth of a node (how many ancestors it has)
  function getDepth(nodeId: string): number {
    const node = nodeMap.get(nodeId);
    if (!node || !node.parentNode) return 0;
    return 1 + getDepth(node.parentNode);
  }

  // Sort by depth (parents first), then by type (groups before services)
  const sortedByDepth = [...nodes].sort((a, b) => {
    const depthA = getDepth(a.id);
    const depthB = getDepth(b.id);
    if (depthA !== depthB) return depthA - depthB;
    // Groups should come before services at the same depth
    const typeA = a.type === 'group' ? 0 : 1;
    const typeB = b.type === 'group' ? 0 : 1;
    return typeA - typeB;
  });

  // Add nodes ensuring parents are added before children
  function addNode(node: ArchNode) {
    if (visited.has(node.id)) return;

    // If this node has a parent, ensure parent is added first
    if (node.parentNode) {
      const parent = nodeMap.get(node.parentNode);
      if (parent && !visited.has(parent.id)) {
        addNode(parent);
      }
    }

    visited.add(node.id);
    sorted.push(node);
  }

  for (const node of sortedByDepth) {
    addNode(node);
  }

  return sorted;
}

/**
 * Calculates the optimal source and target handles based on node positions.
 * Returns handles that create the most direct and visually appealing connection.
 * Uses multi-handle naming convention (e.g., "bottom-4", "top-4")
 */
function calculateOptimalHandles(
  sourceNode: TemplateNode,
  targetNode: TemplateNode
): { sourceHandle: string; targetHandle: string } {
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;

  // Use absolute values to determine primary direction
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Default to middle handle (index 4 out of 0-9 for 10 handles per side)
  const handleIndex = 4;

  // If vertical distance is greater, prefer vertical connections (top/bottom)
  if (absDy > absDx) {
    if (dy > 0) {
      // Target is below source
      return { sourceHandle: `bottom-${handleIndex}`, targetHandle: `top-${handleIndex}` };
    } else {
      // Target is above source
      return { sourceHandle: `top-${handleIndex}`, targetHandle: `bottom-${handleIndex}` };
    }
  } else {
    // Horizontal distance is greater, prefer horizontal connections (left/right)
    if (dx > 0) {
      // Target is to the right of source
      return { sourceHandle: `right-${handleIndex}`, targetHandle: `left-${handleIndex}` };
    } else {
      // Target is to the left of source
      return { sourceHandle: `left-${handleIndex}`, targetHandle: `right-${handleIndex}` };
    }
  }
}

interface ArchitectureStore {
  nodes: ArchNode[];
  edges: ServiceEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  reactFlowInstance: ReactFlowInstance | null;
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
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;
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
  reactFlowInstance: null,

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
    // Sort nodes so parents come before children (React Flow requirement)
    set({ nodes: sortNodesParentsFirst(nodes) });
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

  setReactFlowInstance: (instance: ReactFlowInstance | null) => {
    set({ reactFlowInstance: instance });
  },

  applyTemplate: (template: ArchitectureTemplate) => {
    const timestamp = Date.now();

    // First pass: Generate IDs for all nodes
    // We need IDs before we can resolve parentIndex references
    const nodeIds: string[] = template.nodes.map((templateNode, idx) => {
      if (isTemplateGroupNode(templateNode)) {
        const zone = boundaryZones.find((z) => z.id === templateNode.data.zone.id);
        if (!zone) {
          throw new Error(`Zone not found: ${templateNode.data.zone.id}`);
        }
        return `${zone.id}-${timestamp}-${idx}`;
      } else {
        const service = services.find((s) => s.id === templateNode.data.service.id);
        if (!service) {
          throw new Error(`Service not found: ${templateNode.data.service.id}`);
        }
        return `${service.id}-${timestamp}-${idx}`;
      }
    });

    // Second pass: Create actual nodes with resolved parent references
    const nodes: ArchNode[] = template.nodes.map((templateNode, idx) => {
      const id = nodeIds[idx];

      // Resolve parent if specified
      const parentNode =
        templateNode.parentIndex !== undefined
          ? nodeIds[templateNode.parentIndex]
          : undefined;

      if (isTemplateGroupNode(templateNode)) {
        const zone = boundaryZones.find(
          (z) => z.id === templateNode.data.zone.id
        )!;

        return {
          id,
          type: 'group',
          position: templateNode.position,
          data: {
            zone,
            label: templateNode.data.label || zone.shortName,
          },
          style: {
            width: templateNode.style.width,
            height: templateNode.style.height,
          },
          // Parent relationship for nested groups
          ...(parentNode && {
            parentNode,
            extent: 'parent' as const,
            expandParent: true,
          }),
        } as GroupNode;
      } else {
        // Service node
        const service = services.find(
          (s) => s.id === templateNode.data.service.id
        )!;

        return {
          id,
          type: 'service',
          position: templateNode.position,
          data: {
            service,
            label: service.shortName,
          },
          // Parent relationship for services inside groups
          ...(parentNode && {
            parentNode,
            extent: 'parent' as const,
            expandParent: true,
          }),
        } as ServiceNode;
      }
    });

    // Sort nodes so parents come before children (React Flow requirement)
    const sortedNodes = sortNodesParentsFirst(nodes);

    // Map edges to actual node IDs
    const edges: ServiceEdge[] = template.edges.map((templateEdge, idx) => {
      const sourceNode = nodes[templateEdge.sourceIndex];
      const targetNode = nodes[templateEdge.targetIndex];

      // Calculate optimal handles if not explicitly specified in template
      const sourceTemplateNode = template.nodes[templateEdge.sourceIndex];
      const targetTemplateNode = template.nodes[templateEdge.targetIndex];
      const optimalHandles = calculateOptimalHandles(
        sourceTemplateNode,
        targetTemplateNode
      );

      return {
        id: `edge-${timestamp}-${idx}`,
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: templateEdge.sourceHandle ?? optimalHandles.sourceHandle,
        targetHandle: templateEdge.targetHandle ?? optimalHandles.targetHandle,
        animated: templateEdge.animated ?? false,
        label: templateEdge.label,
      };
    });

    set({ nodes: sortedNodes, edges, selectedNodeId: null, selectedEdgeId: null });
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
