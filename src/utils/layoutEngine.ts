import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge, LayoutOptions as ElkLayoutOptions } from 'elkjs';
import type { ArchNode, ServiceEdge, GroupNode } from '../types/architecture';

export interface LayoutOptions {
  direction: 'TB' | 'LR' | 'BT' | 'RL';
  nodeSpacing: number;
  layerSpacing: number;
  algorithm: 'layered';
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  nodeSpacing: 80,
  layerSpacing: 100,
  algorithm: 'layered',
};

// Default node dimensions (from CustomNode and GroupNode)
const DEFAULT_SERVICE_WIDTH = 120;
const DEFAULT_SERVICE_HEIGHT = 80;
const DEFAULT_GROUP_WIDTH = 300;
const DEFAULT_GROUP_HEIGHT = 200;
const GROUP_PADDING = 50;

/**
 * Map direction to ELK's direction property
 */
function getElkDirection(direction: LayoutOptions['direction']): string {
  switch (direction) {
    case 'TB': return 'DOWN';
    case 'BT': return 'UP';
    case 'LR': return 'RIGHT';
    case 'RL': return 'LEFT';
  }
}

/**
 * Get node dimensions
 */
function getNodeDimensions(node: ArchNode): { width: number; height: number } {
  if (node.type === 'group') {
    const groupNode = node as GroupNode;
    return {
      width: groupNode.style?.width ?? DEFAULT_GROUP_WIDTH,
      height: groupNode.style?.height ?? DEFAULT_GROUP_HEIGHT,
    };
  }
  return {
    width: DEFAULT_SERVICE_WIDTH,
    height: DEFAULT_SERVICE_HEIGHT,
  };
}

/**
 * Get absolute position of a node (handles nested nodes)
 */
function getAbsolutePosition(
  node: ArchNode,
  allNodes: ArchNode[]
): { x: number; y: number } {
  if (!node.parentNode) {
    return { x: node.position.x, y: node.position.y };
  }

  const parent = allNodes.find((n) => n.id === node.parentNode);
  if (!parent) {
    return { x: node.position.x, y: node.position.y };
  }

  const parentPos = getAbsolutePosition(parent, allNodes);
  return {
    x: parentPos.x + node.position.x,
    y: parentPos.y + node.position.y,
  };
}

/**
 * Build ELK graph from React Flow nodes and edges
 */
function buildElkGraph(
  nodes: ArchNode[],
  edges: ServiceEdge[],
  options: LayoutOptions
): ElkNode {
  // Separate top-level nodes from nested nodes
  const topLevelNodes = nodes.filter((n) => !n.parentNode);
  const childNodesByParent = new Map<string, ArchNode[]>();

  // Group children by their parent
  for (const node of nodes) {
    if (node.parentNode) {
      const children = childNodesByParent.get(node.parentNode) || [];
      children.push(node);
      childNodesByParent.set(node.parentNode, children);
    }
  }

  // Convert a node to ELK format (recursively handles children)
  function convertNode(node: ArchNode): ElkNode {
    const dims = getNodeDimensions(node);
    const children = childNodesByParent.get(node.id) || [];

    const elkNode: ElkNode = {
      id: node.id,
      width: dims.width,
      height: dims.height,
    };

    // If this node has children, add them and configure as compound node
    if (children.length > 0) {
      elkNode.children = children.map(convertNode);
      elkNode.layoutOptions = {
        'elk.algorithm': 'layered',
        'elk.direction': getElkDirection(options.direction),
        'elk.spacing.nodeNode': String(options.nodeSpacing),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(options.layerSpacing),
        'elk.padding': `[top=${GROUP_PADDING},left=${GROUP_PADDING},bottom=${GROUP_PADDING},right=${GROUP_PADDING}]`,
      };
    }

    return elkNode;
  }

  // Build top-level ELK graph
  const elkLayoutOptions: ElkLayoutOptions = {
    'elk.algorithm': 'layered',
    'elk.direction': getElkDirection(options.direction),
    'elk.spacing.nodeNode': String(options.nodeSpacing),
    'elk.layered.spacing.nodeNodeBetweenLayers': String(options.layerSpacing),
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  };

  // Convert edges to ELK format
  // ELK requires edges to be defined at the level of their common ancestor
  const elkEdges: ElkExtendedEdge[] = edges.map((edge, idx) => ({
    id: edge.id || `edge-${idx}`,
    sources: [edge.source],
    targets: [edge.target],
  }));

  return {
    id: 'root',
    layoutOptions: elkLayoutOptions,
    children: topLevelNodes.map(convertNode),
    edges: elkEdges,
  };
}

/**
 * Apply ELK positions back to React Flow nodes
 */
function applyElkPositions(
  elkGraph: ElkNode,
  originalNodes: ArchNode[]
): ArchNode[] {
  const positionMap = new Map<string, { x: number; y: number; width?: number; height?: number }>();

  // Recursively extract positions from ELK graph
  function extractPositions(elkNode: ElkNode, parentX = 0, parentY = 0) {
    if (elkNode.id !== 'root') {
      positionMap.set(elkNode.id, {
        x: (elkNode.x ?? 0) + parentX,
        y: (elkNode.y ?? 0) + parentY,
        width: elkNode.width,
        height: elkNode.height,
      });
    }

    const offsetX = elkNode.id === 'root' ? 0 : (elkNode.x ?? 0) + parentX;
    const offsetY = elkNode.id === 'root' ? 0 : (elkNode.y ?? 0) + parentY;

    for (const child of elkNode.children || []) {
      extractPositions(child, offsetX, offsetY);
    }
  }

  extractPositions(elkGraph);

  // Apply positions to nodes
  return originalNodes.map((node): ArchNode => {
    const elkPos = positionMap.get(node.id);
    if (!elkPos) return node;

    // For nodes with parents, convert absolute position to relative
    if (node.parentNode) {
      const parentPos = positionMap.get(node.parentNode);
      if (parentPos) {
        return {
          ...node,
          position: {
            x: elkPos.x - parentPos.x,
            y: elkPos.y - parentPos.y,
          },
        };
      }
    }

    // For group nodes, also update the size if ELK computed a new one
    if (node.type === 'group' && elkPos.width && elkPos.height) {
      return {
        ...node,
        position: { x: elkPos.x, y: elkPos.y },
        style: {
          ...node.style,
          width: elkPos.width,
          height: elkPos.height,
        },
      };
    }

    return {
      ...node,
      position: { x: elkPos.x, y: elkPos.y },
    };
  });
}

/**
 * Calculate optimal edge handles based on relative node positions
 */
function calculateOptimalHandle(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  sourceDims: { width: number; height: number },
  targetDims: { width: number; height: number }
): { sourceHandle: string; targetHandle: string } {
  // Calculate center points
  const sourceCenter = {
    x: sourcePos.x + sourceDims.width / 2,
    y: sourcePos.y + sourceDims.height / 2,
  };
  const targetCenter = {
    x: targetPos.x + targetDims.width / 2,
    y: targetPos.y + targetDims.height / 2,
  };

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Prefer vertical connections when vertical distance is greater
  if (absDy > absDx) {
    if (dy > 0) {
      return { sourceHandle: 'bottom', targetHandle: 'top' };
    } else {
      return { sourceHandle: 'top', targetHandle: 'bottom' };
    }
  } else {
    if (dx > 0) {
      return { sourceHandle: 'right', targetHandle: 'left' };
    } else {
      return { sourceHandle: 'left', targetHandle: 'right' };
    }
  }
}

/**
 * Sort nodes so that parent nodes appear before their children.
 * React Flow requires this ordering to properly resolve parent relationships.
 */
function sortNodesForReactFlow(nodes: ArchNode[]): ArchNode[] {
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
 * Recalculate edge handles after layout to minimize crossings
 */
function recalculateEdgeHandles(
  nodes: ArchNode[],
  edges: ServiceEdge[]
): ServiceEdge[] {
  return edges.map((edge): ServiceEdge => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return edge;

    // Get absolute positions for handle calculation
    const sourceAbsPos = getAbsolutePosition(sourceNode, nodes);
    const targetAbsPos = getAbsolutePosition(targetNode, nodes);
    const sourceDims = getNodeDimensions(sourceNode);
    const targetDims = getNodeDimensions(targetNode);

    const { sourceHandle, targetHandle } = calculateOptimalHandle(
      sourceAbsPos,
      targetAbsPos,
      sourceDims,
      targetDims
    );

    return {
      ...edge,
      sourceHandle,
      targetHandle,
    };
  });
}

/**
 * Main function to apply auto layout to nodes and edges
 */
export async function applyAutoLayout(
  nodes: ArchNode[],
  edges: ServiceEdge[],
  options: Partial<LayoutOptions> = {}
): Promise<{ nodes: ArchNode[]; edges: ServiceEdge[] }> {
  const mergedOptions: LayoutOptions = { ...DEFAULT_OPTIONS, ...options };

  // Handle empty or single node case
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  if (nodes.length === 1) {
    return { nodes, edges };
  }

  // Create ELK instance
  const elk = new ELK();

  // Build ELK graph
  const elkGraph = buildElkGraph(nodes, edges, mergedOptions);

  // Run layout
  const layoutedGraph = await elk.layout(elkGraph);

  // Apply new positions to nodes
  const layoutedNodes = applyElkPositions(layoutedGraph, nodes);

  // Sort nodes so parents come before children (React Flow requirement)
  const sortedNodes = sortNodesForReactFlow(layoutedNodes);

  // Recalculate optimal edge handles
  const layoutedEdges = recalculateEdgeHandles(sortedNodes, edges);

  return {
    nodes: sortedNodes,
    edges: layoutedEdges,
  };
}
