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
 * Uses organic handle positioning for better edge distribution
 */
function recalculateEdgeHandles(
  nodes: ArchNode[],
  edges: ServiceEdge[]
): ServiceEdge[] {
  // Delegate to optimizeEdges which has the full organic positioning algorithm
  return optimizeEdges(nodes, edges);
}

/**
 * Check if a line segment intersects with a rectangle (node bounding box)
 */
function lineIntersectsRect(
  x1: number, y1: number,
  x2: number, y2: number,
  rect: { x: number; y: number; width: number; height: number },
  padding = 10
): boolean {
  const left = rect.x - padding;
  const right = rect.x + rect.width + padding;
  const top = rect.y - padding;
  const bottom = rect.y + rect.height + padding;

  // Check if line is completely outside the rectangle
  if ((x1 < left && x2 < left) || (x1 > right && x2 > right)) return false;
  if ((y1 < top && y2 < top) || (y1 > bottom && y2 > bottom)) return false;

  // Check each edge of the rectangle
  const rectEdges = [
    { x1: left, y1: top, x2: right, y2: top },     // top
    { x1: left, y1: bottom, x2: right, y2: bottom }, // bottom
    { x1: left, y1: top, x2: left, y2: bottom },   // left
    { x1: right, y1: top, x2: right, y2: bottom }, // right
  ];

  for (const edge of rectEdges) {
    if (linesIntersect(x1, y1, x2, y2, edge.x1, edge.y1, edge.x2, edge.y2)) {
      return true;
    }
  }

  // Check if line is completely inside rectangle
  if (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) return true;
  if (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom) return true;

  return false;
}

/**
 * Check if two line segments intersect
 */
function linesIntersect(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 0.0001) return false; // Parallel lines

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

// Number of handles per side (must match CustomNode.tsx)
const HANDLES_PER_SIDE = 10;

// Handle side types
type HandleSide = 'top' | 'bottom' | 'left' | 'right';

// Full handle ID (e.g., "top-0", "right-2")
type HandleId = string;

/**
 * Get handle position on a node for a specific handle ID
 * Handles are distributed along each side
 */
function getMultiHandlePosition(
  node: { x: number; y: number; width: number; height: number },
  handleId: HandleId
): { x: number; y: number } {
  const [side, indexStr] = handleId.split('-');
  const index = parseInt(indexStr, 10);
  const offset = (index + 1) / (HANDLES_PER_SIDE + 1);

  switch (side) {
    case 'top':
      return { x: node.x + node.width * offset, y: node.y };
    case 'bottom':
      return { x: node.x + node.width * offset, y: node.y + node.height };
    case 'left':
      return { x: node.x, y: node.y + node.height * offset };
    case 'right':
      return { x: node.x + node.width, y: node.y + node.height * offset };
    default:
      return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
  }
}

/**
 * Determine the best side for connecting based on relative positions
 */
function getBestSide(
  sourceRect: { x: number; y: number; width: number; height: number },
  targetRect: { x: number; y: number; width: number; height: number }
): { sourceSide: HandleSide; targetSide: HandleSide } {
  const dx = (targetRect.x + targetRect.width / 2) - (sourceRect.x + sourceRect.width / 2);
  const dy = (targetRect.y + targetRect.height / 2) - (sourceRect.y + sourceRect.height / 2);

  // Determine primary direction
  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical connection
    if (dy > 0) {
      return { sourceSide: 'bottom', targetSide: 'top' };
    } else {
      return { sourceSide: 'top', targetSide: 'bottom' };
    }
  } else {
    // Horizontal connection
    if (dx > 0) {
      return { sourceSide: 'right', targetSide: 'left' };
    } else {
      return { sourceSide: 'left', targetSide: 'right' };
    }
  }
}

/**
 * Get the sort key for ordering edges on a side
 * For horizontal sides (top/bottom): sort by target's X position
 * For vertical sides (left/right): sort by target's Y position
 */
function getEdgeSortKey(
  side: HandleSide,
  otherEndRect: { x: number; y: number; width: number; height: number }
): number {
  if (side === 'top' || side === 'bottom') {
    // Horizontal side: sort by X position of the other end
    return otherEndRect.x + otherEndRect.width / 2;
  } else {
    // Vertical side: sort by Y position of the other end
    return otherEndRect.y + otherEndRect.height / 2;
  }
}

/**
 * Optimize edge routing with organic handle positioning
 * - Prevents edge crossings by ordering handles based on target positions
 * - Distributes edges evenly across the available handle slots
 */
export function optimizeEdges(
  nodes: ArchNode[],
  edges: ServiceEdge[]
): ServiceEdge[] {
  // Build a map of node rectangles with absolute positions
  const nodeRects = new Map<string, { x: number; y: number; width: number; height: number }>();

  for (const node of nodes) {
    const pos = getAbsolutePosition(node, nodes);
    const dims = getNodeDimensions(node);
    nodeRects.set(node.id, {
      x: pos.x,
      y: pos.y,
      width: dims.width,
      height: dims.height,
    });
  }

  // First pass: determine best sides for each edge
  interface EdgeInfo {
    edge: ServiceEdge;
    sourceRect: { x: number; y: number; width: number; height: number };
    targetRect: { x: number; y: number; width: number; height: number };
    sourceSide: HandleSide;
    targetSide: HandleSide;
  }

  const edgeInfos: EdgeInfo[] = [];

  for (const edge of edges) {
    const sourceRect = nodeRects.get(edge.source);
    const targetRect = nodeRects.get(edge.target);

    if (!sourceRect || !targetRect) continue;

    const { sourceSide, targetSide } = getBestSide(sourceRect, targetRect);

    edgeInfos.push({
      edge,
      sourceRect,
      targetRect,
      sourceSide,
      targetSide,
    });
  }

  // Group edges by source node + side
  const sourceGroups = new Map<string, EdgeInfo[]>();
  for (const info of edgeInfos) {
    const key = `${info.edge.source}:${info.sourceSide}`;
    if (!sourceGroups.has(key)) {
      sourceGroups.set(key, []);
    }
    sourceGroups.get(key)!.push(info);
  }

  // Group edges by target node + side
  const targetGroups = new Map<string, EdgeInfo[]>();
  for (const info of edgeInfos) {
    const key = `${info.edge.target}:${info.targetSide}`;
    if (!targetGroups.has(key)) {
      targetGroups.set(key, []);
    }
    targetGroups.get(key)!.push(info);
  }

  // Calculate source handle indices based on target positions
  const sourceHandleMap = new Map<string, number>(); // edge.id -> source handle index

  for (const [, group] of sourceGroups) {
    // Sort edges by target position to prevent crossings
    const sorted = [...group].sort((a, b) => {
      const keyA = getEdgeSortKey(a.sourceSide, a.targetRect);
      const keyB = getEdgeSortKey(b.sourceSide, b.targetRect);
      return keyA - keyB;
    });

    // Distribute handles evenly across the available slots
    const count = sorted.length;
    sorted.forEach((info, idx) => {
      // Map index to handle slot, spreading evenly across available handles
      // For 3 edges with 10 handles: use slots 2, 4, 7 (roughly evenly spaced)
      let handleIndex: number;
      if (count === 1) {
        handleIndex = Math.floor(HANDLES_PER_SIDE / 2); // Center
      } else {
        // Spread across handles, leaving some margin at edges
        const margin = 1; // Leave 1 handle margin on each end
        const availableSlots = HANDLES_PER_SIDE - 2 * margin;
        handleIndex = margin + Math.round((idx / (count - 1)) * (availableSlots - 1));
      }
      sourceHandleMap.set(info.edge.id, handleIndex);
    });
  }

  // Calculate target handle indices based on source positions
  const targetHandleMap = new Map<string, number>(); // edge.id -> target handle index

  for (const [, group] of targetGroups) {
    // Sort edges by source position to prevent crossings
    const sorted = [...group].sort((a, b) => {
      const keyA = getEdgeSortKey(a.targetSide, a.sourceRect);
      const keyB = getEdgeSortKey(b.targetSide, b.sourceRect);
      return keyA - keyB;
    });

    // Distribute handles evenly
    const count = sorted.length;
    sorted.forEach((info, idx) => {
      let handleIndex: number;
      if (count === 1) {
        handleIndex = Math.floor(HANDLES_PER_SIDE / 2);
      } else {
        const margin = 1;
        const availableSlots = HANDLES_PER_SIDE - 2 * margin;
        handleIndex = margin + Math.round((idx / (count - 1)) * (availableSlots - 1));
      }
      targetHandleMap.set(info.edge.id, handleIndex);
    });
  }

  // Build optimized edges
  const optimizedEdges: ServiceEdge[] = [];

  for (const info of edgeInfos) {
    const { edge, sourceRect, targetRect, sourceSide, targetSide } = info;

    const sourceIndex = sourceHandleMap.get(edge.id) ?? Math.floor(HANDLES_PER_SIDE / 2);
    const targetIndex = targetHandleMap.get(edge.id) ?? Math.floor(HANDLES_PER_SIDE / 2);

    const sourceHandle = `${sourceSide}-${sourceIndex}`;
    const targetHandle = `${targetSide}-${targetIndex}`;

    // Check for collisions with other nodes
    const sourcePos = getMultiHandlePosition(sourceRect, sourceHandle);
    const targetPos = getMultiHandlePosition(targetRect, targetHandle);

    const otherNodes = Array.from(nodeRects.entries())
      .filter(([id]) => id !== edge.source && id !== edge.target)
      .map(([, rect]) => rect);

    let hasCollision = false;
    for (const node of otherNodes) {
      if (lineIntersectsRect(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y, node)) {
        hasCollision = true;
        break;
      }
    }

    // Use smoothstep for edges with collisions (routes around better)
    const edgeType = hasCollision ? 'smoothstep' : (edge.type || 'default');

    optimizedEdges.push({
      ...edge,
      sourceHandle,
      targetHandle,
      type: edgeType,
    });
  }

  // Handle edges that couldn't be processed (missing nodes)
  for (const edge of edges) {
    if (!optimizedEdges.find(e => e.id === edge.id)) {
      optimizedEdges.push(edge);
    }
  }

  return optimizedEdges;
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
