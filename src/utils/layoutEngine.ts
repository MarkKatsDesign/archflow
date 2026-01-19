import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge } from 'elkjs';
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

// Default node dimensions
const DEFAULT_SERVICE_WIDTH = 160;
const DEFAULT_SERVICE_HEIGHT = 100;
// Padding inside groups
const GROUP_PADDING_TOP = 45; // Extra top padding for group label
const GROUP_PADDING_SIDES = 20;
const GROUP_PADDING_BOTTOM = 20;
// Minimum group dimensions
const MIN_GROUP_WIDTH = 200;
const MIN_GROUP_HEIGHT = 150;

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
 * Get node dimensions - uses actual node dimensions when available
 */
function getNodeDimensions(node: ArchNode): { width: number; height: number } {
  if (node.type === 'group') {
    const groupNode = node as GroupNode;
    return {
      width: groupNode.style?.width ?? 300,
      height: groupNode.style?.height ?? 200,
    };
  }
  return {
    width: (node as { width?: number }).width ?? DEFAULT_SERVICE_WIDTH,
    height: (node as { height?: number }).height ?? DEFAULT_SERVICE_HEIGHT,
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
 * Build a simple ELK graph - let ELK handle sizing
 */
function buildElkGraph(
  nodes: ArchNode[],
  edges: ServiceEdge[],
  options: LayoutOptions
): ElkNode {
  const topLevelNodes = nodes.filter((n) => !n.parentNode);
  const childNodesByParent = new Map<string, ArchNode[]>();

  // Group children by parent
  for (const node of nodes) {
    if (node.parentNode) {
      const children = childNodesByParent.get(node.parentNode) || [];
      children.push(node);
      childNodesByParent.set(node.parentNode, children);
    }
  }

  // Convert node to ELK format
  function convertNode(node: ArchNode): ElkNode {
    const children = childNodesByParent.get(node.id) || [];
    const dims = getNodeDimensions(node);

    const elkNode: ElkNode = {
      id: node.id,
      width: dims.width,
      height: dims.height,
    };

    if (children.length > 0) {
      elkNode.children = children.map(convertNode);

      // Find edges within this group
      const childIds = new Set(children.map(c => c.id));
      const internalEdges: ElkExtendedEdge[] = edges
        .filter(e => childIds.has(e.source) && childIds.has(e.target))
        .map(e => ({
          id: e.id || `edge-${e.source}-${e.target}`,
          sources: [e.source],
          targets: [e.target],
        }));

      if (internalEdges.length > 0) {
        elkNode.edges = internalEdges;
      }

      elkNode.layoutOptions = {
        'elk.algorithm': 'layered',
        'elk.direction': getElkDirection(options.direction),
        'elk.spacing.nodeNode': String(options.nodeSpacing),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(options.layerSpacing),
        'elk.padding': `[top=${GROUP_PADDING_TOP},left=${GROUP_PADDING_SIDES},bottom=${GROUP_PADDING_BOTTOM},right=${GROUP_PADDING_SIDES}]`,
      };
    }

    return elkNode;
  }

  // Create top-level edges between different top-level nodes/groups
  const topLevelIds = new Set(topLevelNodes.map(n => n.id));

  function getTopLevelAncestor(nodeId: string): string {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.parentNode) return nodeId;
    return getTopLevelAncestor(node.parentNode);
  }

  const topLevelEdgeMap = new Map<string, ElkExtendedEdge>();
  for (const edge of edges) {
    const sourceTop = getTopLevelAncestor(edge.source);
    const targetTop = getTopLevelAncestor(edge.target);
    if (sourceTop !== targetTop && topLevelIds.has(sourceTop) && topLevelIds.has(targetTop)) {
      const key = `${sourceTop}->${targetTop}`;
      if (!topLevelEdgeMap.has(key)) {
        topLevelEdgeMap.set(key, {
          id: `top-${key}`,
          sources: [sourceTop],
          targets: [targetTop],
        });
      }
    }
  }

  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': getElkDirection(options.direction),
      'elk.spacing.nodeNode': String(options.nodeSpacing * 1.5),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(options.layerSpacing),
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    },
    children: topLevelNodes.map(convertNode),
    edges: Array.from(topLevelEdgeMap.values()),
  };
}

/**
 * Extract positions from ELK layout result
 */
function extractElkPositions(
  elkGraph: ElkNode
): Map<string, { x: number; y: number; width: number; height: number }> {
  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();

  function extract(node: ElkNode, offsetX = 0, offsetY = 0) {
    if (node.id !== 'root') {
      positions.set(node.id, {
        x: (node.x ?? 0) + offsetX,
        y: (node.y ?? 0) + offsetY,
        width: node.width ?? 0,
        height: node.height ?? 0,
      });
    }

    const newOffsetX = node.id === 'root' ? 0 : (node.x ?? 0) + offsetX;
    const newOffsetY = node.id === 'root' ? 0 : (node.y ?? 0) + offsetY;

    for (const child of node.children || []) {
      extract(child, newOffsetX, newOffsetY);
    }
  }

  extract(elkGraph);
  return positions;
}

/**
 * Calculate group sizes to fit their children (post-layout adjustment)
 * This ensures all children are properly contained within their parent groups.
 */
function fitGroupsToChildren(
  nodes: ArchNode[],
  positions: Map<string, { x: number; y: number; width: number; height: number }>
): Map<string, { width: number; height: number }> {
  const groupSizes = new Map<string, { width: number; height: number }>();
  const childNodesByParent = new Map<string, ArchNode[]>();

  // Group children by parent
  for (const node of nodes) {
    if (node.parentNode) {
      const children = childNodesByParent.get(node.parentNode) || [];
      children.push(node);
      childNodesByParent.set(node.parentNode, children);
    }
  }

  // Get all groups sorted by depth (deepest first)
  const groups = nodes.filter(n => n.type === 'group');

  function getDepth(nodeId: string): number {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.parentNode) return 0;
    return 1 + getDepth(node.parentNode);
  }

  const sortedGroups = [...groups].sort((a, b) => getDepth(b.id) - getDepth(a.id));

  for (const group of sortedGroups) {
    const children = childNodesByParent.get(group.id) || [];
    const groupPos = positions.get(group.id);

    if (!groupPos) continue;

    if (children.length === 0) {
      groupSizes.set(group.id, {
        width: MIN_GROUP_WIDTH,
        height: MIN_GROUP_HEIGHT,
      });
      continue;
    }

    // Calculate bounding box of all children (relative to group)
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const child of children) {
      const childPos = positions.get(child.id);
      if (!childPos) continue;

      // Position relative to group
      const relX = childPos.x - groupPos.x;
      const relY = childPos.y - groupPos.y;

      // Get child size (use computed size for nested groups)
      let childWidth: number, childHeight: number;
      if (child.type === 'group' && groupSizes.has(child.id)) {
        const childSize = groupSizes.get(child.id)!;
        childWidth = childSize.width;
        childHeight = childSize.height;
      } else {
        childWidth = childPos.width || DEFAULT_SERVICE_WIDTH;
        childHeight = childPos.height || DEFAULT_SERVICE_HEIGHT;
      }

      minX = Math.min(minX, relX);
      minY = Math.min(minY, relY);
      maxX = Math.max(maxX, relX + childWidth);
      maxY = Math.max(maxY, relY + childHeight);
    }

    // Calculate required size with padding
    const requiredWidth = maxX + GROUP_PADDING_SIDES;
    const requiredHeight = maxY + GROUP_PADDING_BOTTOM;

    const finalWidth = Math.max(requiredWidth, MIN_GROUP_WIDTH);
    const finalHeight = Math.max(requiredHeight, MIN_GROUP_HEIGHT);

    groupSizes.set(group.id, {
      width: finalWidth,
      height: finalHeight,
    });
  }

  return groupSizes;
}

/**
 * Apply layout results to nodes
 */
function applyLayout(
  originalNodes: ArchNode[],
  positions: Map<string, { x: number; y: number; width: number; height: number }>,
  groupSizes: Map<string, { width: number; height: number }>
): ArchNode[] {
  return originalNodes.map((node): ArchNode => {
    const pos = positions.get(node.id);
    if (!pos) return node;

    // Calculate position (relative for nested nodes)
    let newPosition: { x: number; y: number };
    if (node.parentNode) {
      const parentPos = positions.get(node.parentNode);
      if (parentPos) {
        newPosition = {
          x: pos.x - parentPos.x,
          y: pos.y - parentPos.y,
        };
      } else {
        newPosition = { x: pos.x, y: pos.y };
      }
    } else {
      newPosition = { x: pos.x, y: pos.y };
    }

    // For groups, apply the fitted size
    if (node.type === 'group') {
      const size = groupSizes.get(node.id) || { width: MIN_GROUP_WIDTH, height: MIN_GROUP_HEIGHT };

      return {
        ...node,
        position: newPosition,
        style: {
          ...node.style,
          width: size.width,
          height: size.height,
        },
      };
    }

    return {
      ...node,
      position: newPosition,
    };
  });
}

/**
 * Sort nodes so parents appear before children (React Flow requirement)
 */
function sortNodesForReactFlow(nodes: ArchNode[]): ArchNode[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const sorted: ArchNode[] = [];
  const visited = new Set<string>();

  function getDepth(nodeId: string): number {
    const node = nodeMap.get(nodeId);
    if (!node || !node.parentNode) return 0;
    return 1 + getDepth(node.parentNode);
  }

  const byDepth = [...nodes].sort((a, b) => {
    const depthDiff = getDepth(a.id) - getDepth(b.id);
    if (depthDiff !== 0) return depthDiff;
    return (a.type === 'group' ? 0 : 1) - (b.type === 'group' ? 0 : 1);
  });

  function addNode(node: ArchNode) {
    if (visited.has(node.id)) return;
    if (node.parentNode) {
      const parent = nodeMap.get(node.parentNode);
      if (parent && !visited.has(parent.id)) addNode(parent);
    }
    visited.add(node.id);
    sorted.push(node);
  }

  for (const node of byDepth) addNode(node);
  return sorted;
}

/**
 * Calculate optimal edge handles based on node positions
 */
function recalculateEdgeHandles(
  nodes: ArchNode[],
  edges: ServiceEdge[]
): ServiceEdge[] {
  return edges.map((edge): ServiceEdge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return edge;

    const sourcePos = getAbsolutePosition(sourceNode, nodes);
    const targetPos = getAbsolutePosition(targetNode, nodes);
    const sourceDims = getNodeDimensions(sourceNode);
    const targetDims = getNodeDimensions(targetNode);

    const sourceCenterX = sourcePos.x + sourceDims.width / 2;
    const sourceCenterY = sourcePos.y + sourceDims.height / 2;
    const targetCenterX = targetPos.x + targetDims.width / 2;
    const targetCenterY = targetPos.y + targetDims.height / 2;

    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;

    let sourceHandle: string, targetHandle: string;
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy > 0) {
        sourceHandle = 'bottom';
        targetHandle = 'top';
      } else {
        sourceHandle = 'top';
        targetHandle = 'bottom';
      }
    } else {
      if (dx > 0) {
        sourceHandle = 'right';
        targetHandle = 'left';
      } else {
        sourceHandle = 'left';
        targetHandle = 'right';
      }
    }

    return { ...edge, sourceHandle, targetHandle };
  });
}

/**
 * Main function to apply auto layout
 */
export async function applyAutoLayout(
  nodes: ArchNode[],
  edges: ServiceEdge[],
  options: Partial<LayoutOptions> = {}
): Promise<{ nodes: ArchNode[]; edges: ServiceEdge[] }> {
  const opts: LayoutOptions = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length <= 1) {
    return { nodes, edges };
  }

  // Step 1: Build ELK graph
  const elkGraph = buildElkGraph(nodes, edges, opts);

  // Step 2: Run ELK layout
  const elk = new ELK();
  const layoutedGraph = await elk.layout(elkGraph);

  // Step 3: Extract positions from ELK result
  const positions = extractElkPositions(layoutedGraph);

  // Step 4: Fit groups to their children (post-layout adjustment)
  const groupSizes = fitGroupsToChildren(nodes, positions);

  // Step 5: Apply layout to nodes
  const layoutedNodes = applyLayout(nodes, positions, groupSizes);

  // Step 6: Sort for React Flow
  const sortedNodes = sortNodesForReactFlow(layoutedNodes);

  // Step 7: Recalculate edge handles
  const layoutedEdges = recalculateEdgeHandles(sortedNodes, edges);

  return {
    nodes: sortedNodes,
    edges: layoutedEdges,
  };
}
