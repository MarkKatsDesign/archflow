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

// Debug flag for handle selection logging
const DEBUG_HANDLE_SELECTION = true;

function debugHandleLog(edgeLabel: string | undefined, ...args: unknown[]) {
  if (DEBUG_HANDLE_SELECTION && edgeLabel) {
    console.log(`[Handle:${edgeLabel}]`, ...args);
  }
}

/**
 * Calculate the estimated path cost for a given handle combination
 * Lower cost = better (shorter, more direct path)
 */
function estimatePathCost(
  sourceRect: { x: number; y: number; width: number; height: number },
  targetRect: { x: number; y: number; width: number; height: number },
  sourceSide: HandleSide,
  targetSide: HandleSide,
  obstacles: { x: number; y: number; width: number; height: number }[]
): number {
  const OBSTACLE_PADDING = 20;

  // Get handle positions (center of each side)
  const getHandlePos = (
    rect: { x: number; y: number; width: number; height: number },
    side: HandleSide
  ): { x: number; y: number } => {
    switch (side) {
      case 'top': return { x: rect.x + rect.width / 2, y: rect.y };
      case 'bottom': return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
      case 'left': return { x: rect.x, y: rect.y + rect.height / 2 };
      case 'right': return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
    }
  };

  const sourcePos = getHandlePos(sourceRect, sourceSide);
  const targetPos = getHandlePos(targetRect, targetSide);

  // Base cost: Manhattan distance
  let cost = Math.abs(targetPos.x - sourcePos.x) + Math.abs(targetPos.y - sourcePos.y);

  // Check for obstacles in the path corridor
  const minX = Math.min(sourcePos.x, targetPos.x);
  const maxX = Math.max(sourcePos.x, targetPos.x);
  const minY = Math.min(sourcePos.y, targetPos.y);
  const maxY = Math.max(sourcePos.y, targetPos.y);

  for (const obs of obstacles) {
    const obsLeft = obs.x - OBSTACLE_PADDING;
    const obsRight = obs.x + obs.width + OBSTACLE_PADDING;
    const obsTop = obs.y - OBSTACLE_PADDING;
    const obsBottom = obs.y + obs.height + OBSTACLE_PADDING;

    // Check if obstacle overlaps with path corridor
    const overlapsX = !(obsRight < minX || obsLeft > maxX);
    const overlapsY = !(obsBottom < minY || obsTop > maxY);

    if (overlapsX && overlapsY) {
      // Obstacle is in the way - estimate detour distance
      // The detour is roughly going around the obstacle
      const detourX = Math.max(0, Math.min(maxX, obsRight) - Math.max(minX, obsLeft));
      const detourY = Math.max(0, Math.min(maxY, obsBottom) - Math.max(minY, obsTop));
      cost += (detourX + detourY) * 2; // Double the blocked distance as penalty
    }
  }

  // Penalty for "wrong direction" initial movement
  // If handle faces away from target, add penalty
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  // Source handle direction penalty
  if (sourceSide === 'left' && dx > 0) cost += 100; // Handle faces left but target is right
  if (sourceSide === 'right' && dx < 0) cost += 100;
  if (sourceSide === 'top' && dy > 0) cost += 100; // Handle faces up but target is below
  if (sourceSide === 'bottom' && dy < 0) cost += 100;

  // Target handle direction penalty (target should face toward source)
  if (targetSide === 'left' && dx < 0) cost += 100;
  if (targetSide === 'right' && dx > 0) cost += 100;
  if (targetSide === 'top' && dy < 0) cost += 100;
  if (targetSide === 'bottom' && dy > 0) cost += 100;

  return cost;
}

/**
 * Determine the best side for connecting based on relative positions
 * Now considers obstacles to pick handles that result in shorter paths
 */
function getBestSide(
  sourceRect: { x: number; y: number; width: number; height: number },
  targetRect: { x: number; y: number; width: number; height: number },
  obstacles: { x: number; y: number; width: number; height: number }[] = [],
  edgeLabel?: string
): { sourceSide: HandleSide; targetSide: HandleSide } {
  const dx = (targetRect.x + targetRect.width / 2) - (sourceRect.x + sourceRect.width / 2);
  const dy = (targetRect.y + targetRect.height / 2) - (sourceRect.y + sourceRect.height / 2);

  debugHandleLog(edgeLabel, `=== Handle Selection ===`);
  debugHandleLog(edgeLabel, `  Source: (${sourceRect.x.toFixed(0)}, ${sourceRect.y.toFixed(0)}) ${sourceRect.width}x${sourceRect.height}`);
  debugHandleLog(edgeLabel, `  Target: (${targetRect.x.toFixed(0)}, ${targetRect.y.toFixed(0)}) ${targetRect.width}x${targetRect.height}`);
  debugHandleLog(edgeLabel, `  Delta: dx=${dx.toFixed(0)}, dy=${dy.toFixed(0)}`);
  debugHandleLog(edgeLabel, `  Obstacles count: ${obstacles.length}`);

  // Default sides based on relative position
  let defaultSourceSide: HandleSide;
  let defaultTargetSide: HandleSide;

  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical connection
    if (dy > 0) {
      defaultSourceSide = 'bottom';
      defaultTargetSide = 'top';
    } else {
      defaultSourceSide = 'top';
      defaultTargetSide = 'bottom';
    }
  } else {
    // Horizontal connection
    if (dx > 0) {
      defaultSourceSide = 'right';
      defaultTargetSide = 'left';
    } else {
      defaultSourceSide = 'left';
      defaultTargetSide = 'right';
    }
  }

  debugHandleLog(edgeLabel, `  Default sides: ${defaultSourceSide} → ${defaultTargetSide}`);

  // If no obstacles, use default
  if (obstacles.length === 0) {
    debugHandleLog(edgeLabel, `  No obstacles, using default`);
    return { sourceSide: defaultSourceSide, targetSide: defaultTargetSide };
  }

  // Try multiple handle combinations and pick the best one
  const candidates: { sourceSide: HandleSide; targetSide: HandleSide; cost: number }[] = [];

  // Primary candidates based on direction
  const primaryCombinations: [HandleSide, HandleSide][] = [
    [defaultSourceSide, defaultTargetSide], // Default
  ];

  // Alternative combinations for vertical connections
  if (defaultSourceSide === 'top' || defaultSourceSide === 'bottom') {
    // When going vertically, also consider horizontal sides if path goes sideways
    if (dx < -50) {
      // Target is significantly to the left
      primaryCombinations.push(['left', 'left']);
      primaryCombinations.push(['left', 'bottom']);
      primaryCombinations.push(['left', 'top']);
    }
    if (dx > 50) {
      // Target is significantly to the right
      primaryCombinations.push(['right', 'right']);
      primaryCombinations.push(['right', 'bottom']);
      primaryCombinations.push(['right', 'top']);
    }
  }

  // Alternative combinations for horizontal connections
  if (defaultSourceSide === 'left' || defaultSourceSide === 'right') {
    // When going horizontally, also consider vertical sides if path goes up/down
    if (dy < -50) {
      // Target is significantly above
      primaryCombinations.push(['top', 'top']);
      primaryCombinations.push(['top', 'left']);
      primaryCombinations.push(['top', 'right']);
    }
    if (dy > 50) {
      // Target is significantly below
      primaryCombinations.push(['bottom', 'bottom']);
      primaryCombinations.push(['bottom', 'left']);
      primaryCombinations.push(['bottom', 'right']);
    }
  }

  debugHandleLog(edgeLabel, `  Evaluating ${primaryCombinations.length} handle combinations:`);

  // Calculate cost for each combination
  for (const [srcSide, tgtSide] of primaryCombinations) {
    const cost = estimatePathCost(sourceRect, targetRect, srcSide, tgtSide, obstacles);
    candidates.push({ sourceSide: srcSide, targetSide: tgtSide, cost });
    debugHandleLog(edgeLabel, `    ${srcSide} → ${tgtSide}: cost=${cost.toFixed(0)}`);
  }

  // Sort by cost and pick the best
  candidates.sort((a, b) => a.cost - b.cost);

  const best = candidates[0];
  debugHandleLog(edgeLabel, `  ✓ Best: ${best.sourceSide} → ${best.targetSide} (cost=${best.cost.toFixed(0)})`);

  return {
    sourceSide: best.sourceSide,
    targetSide: best.targetSide,
  };
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

export interface OptimizeEdgesOptions {
  /** Include obstacle data for PCB-style routing */
  includePcbObstacles?: boolean;
}

/**
 * Optimize edge routing with organic handle positioning
 * - Prevents edge crossings by ordering handles based on target positions
 * - Distributes edges evenly across the available handle slots
 * - Optionally includes obstacle data for PCB-style routing
 */
export function optimizeEdges(
  nodes: ArchNode[],
  edges: ServiceEdge[],
  options: OptimizeEdgesOptions = {}
): ServiceEdge[] {
  const { includePcbObstacles = false } = options;
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

  // Build obstacle list for path-aware handle selection
  // Only include service nodes (not groups) as obstacles
  const serviceNodeIds = new Set(
    nodes
      .filter(n => n.type === 'service')
      .map(n => n.id)
  );

  const allObstacles = Array.from(nodeRects.entries())
    .filter(([id]) => serviceNodeIds.has(id))
    .map(([, rect]) => rect);

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

    // Get obstacles excluding source and target nodes
    const edgeObstacles = allObstacles.filter(obs =>
      obs !== sourceRect && obs !== targetRect
    );

    // Get edge label for debugging
    const edgeLabel = edge.label as string | undefined;

    const { sourceSide, targetSide } = getBestSide(sourceRect, targetRect, edgeObstacles, edgeLabel);

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

  // Track used handles per node+side to prevent duplicates
  // UNIFIED MAP: tracks both source and target handle usage on each node
  // This prevents incoming and outgoing edges from sharing the same physical handle
  const usedHandles = new Map<string, Set<number>>(); // "nodeId:side" -> Set of used indices

  /**
   * Get the next available handle index, avoiding already used ones
   * Uses a unified map that tracks both incoming and outgoing edges
   */
  function getAvailableHandle(
    nodeId: string,
    side: HandleSide,
    preferredIndex: number
  ): number {
    const key = `${nodeId}:${side}`;
    if (!usedHandles.has(key)) {
      usedHandles.set(key, new Set());
    }
    const used = usedHandles.get(key)!;

    // If preferred is available, use it
    if (!used.has(preferredIndex)) {
      used.add(preferredIndex);
      return preferredIndex;
    }

    // Otherwise find the closest available handle
    for (let offset = 1; offset < HANDLES_PER_SIDE; offset++) {
      const above = preferredIndex + offset;
      const below = preferredIndex - offset;

      if (above < HANDLES_PER_SIDE && !used.has(above)) {
        used.add(above);
        return above;
      }
      if (below >= 0 && !used.has(below)) {
        used.add(below);
        return below;
      }
    }

    // Fallback (should never happen with 10 handles)
    return preferredIndex;
  }

  // Calculate source handle indices based on target positions
  const sourceHandleMap = new Map<string, number>(); // edge.id -> source handle index

  for (const [key, group] of sourceGroups) {
    const [nodeId, side] = key.split(':') as [string, HandleSide];

    // Sort edges by target position to prevent crossings
    const sorted = [...group].sort((a, b) => {
      const keyA = getEdgeSortKey(a.sourceSide, a.targetRect);
      const keyB = getEdgeSortKey(b.sourceSide, b.targetRect);
      return keyA - keyB;
    });

    // Calculate preferred indices, then assign with conflict resolution
    const count = sorted.length;
    sorted.forEach((info, idx) => {
      // Calculate preferred handle position
      let preferredIndex: number;
      if (count === 1) {
        preferredIndex = Math.floor(HANDLES_PER_SIDE / 2); // Center
      } else {
        // Spread across handles, leaving margin at edges
        const margin = 1;
        const availableSlots = HANDLES_PER_SIDE - 2 * margin;
        // Use floor to ensure unique indices when possible
        preferredIndex = margin + Math.floor((idx / count) * availableSlots);
      }

      // Get actual available handle (resolves conflicts using unified map)
      const actualIndex = getAvailableHandle(nodeId, side, preferredIndex);
      sourceHandleMap.set(info.edge.id, actualIndex);
    });
  }

  // Calculate target handle indices based on source positions
  const targetHandleMap = new Map<string, number>(); // edge.id -> target handle index

  for (const [key, group] of targetGroups) {
    const [nodeId, side] = key.split(':') as [string, HandleSide];

    // Sort edges by source position to prevent crossings
    const sorted = [...group].sort((a, b) => {
      const keyA = getEdgeSortKey(a.targetSide, a.sourceRect);
      const keyB = getEdgeSortKey(b.targetSide, b.sourceRect);
      return keyA - keyB;
    });

    // Calculate preferred indices with conflict resolution
    const count = sorted.length;
    sorted.forEach((info, idx) => {
      let preferredIndex: number;
      if (count === 1) {
        preferredIndex = Math.floor(HANDLES_PER_SIDE / 2);
      } else {
        const margin = 1;
        const availableSlots = HANDLES_PER_SIDE - 2 * margin;
        preferredIndex = margin + Math.floor((idx / count) * availableSlots);
      }

      // Get actual available handle (resolves conflicts using unified map)
      const actualIndex = getAvailableHandle(nodeId, side, preferredIndex);
      targetHandleMap.set(info.edge.id, actualIndex);
    });
  }

  // Detect overlapping paths and assign lanes
  // Group edges by their "path signature" - edges with similar paths need different lanes
  // We use multiple detection strategies to catch different overlap cases

  const BUCKET_SIZE = 40; // Reduced for finer detection of overlaps
  const quantize = (val: number) => Math.round(val / BUCKET_SIZE);

  /**
   * Calculate the middle segment position for an edge
   * This is where the orthogonal path makes its turn
   */
  const getMiddleSegment = (info: EdgeInfo): { x: number; y: number } => {
    const sourceCenter = {
      x: info.sourceRect.x + info.sourceRect.width / 2,
      y: info.sourceRect.y + info.sourceRect.height / 2,
    };
    const targetCenter = {
      x: info.targetRect.x + info.targetRect.width / 2,
      y: info.targetRect.y + info.targetRect.height / 2,
    };

    // For horizontal connections (right-left), middle is at X midpoint
    if ((info.sourceSide === 'right' && info.targetSide === 'left') ||
        (info.sourceSide === 'left' && info.targetSide === 'right')) {
      return {
        x: (sourceCenter.x + targetCenter.x) / 2,
        y: (sourceCenter.y + targetCenter.y) / 2,
      };
    }
    // For vertical connections (top-bottom), middle is at Y midpoint
    if ((info.sourceSide === 'top' && info.targetSide === 'bottom') ||
        (info.sourceSide === 'bottom' && info.targetSide === 'top')) {
      return {
        x: (sourceCenter.x + targetCenter.x) / 2,
        y: (sourceCenter.y + targetCenter.y) / 2,
      };
    }
    // For other connections, use the center
    return {
      x: (sourceCenter.x + targetCenter.x) / 2,
      y: (sourceCenter.y + targetCenter.y) / 2,
    };
  };

  /**
   * Generate a path signature that groups edges that would visually overlap
   * This considers:
   * 1. The source and target sides (connection direction)
   * 2. The middle segment position (where paths would overlap)
   * 3. Whether edges are going in the same general direction
   */
  const getPathSignature = (info: EdgeInfo): string => {
    const midSegment = getMiddleSegment(info);

    // For horizontal connections, group by Y positions (edges at similar heights overlap)
    if ((info.sourceSide === 'right' && info.targetSide === 'left') ||
        (info.sourceSide === 'left' && info.targetSide === 'right')) {
      // Group by: connection direction, midpoint X bucket, and source/target Y buckets
      const minY = Math.min(info.sourceRect.y, info.targetRect.y);
      const maxY = Math.max(info.sourceRect.y + info.sourceRect.height, info.targetRect.y + info.targetRect.height);
      return `H-${quantize(midSegment.x)}-${quantize(minY)}-${quantize(maxY)}`;
    }

    // For vertical connections, group by X positions (edges at similar widths overlap)
    if ((info.sourceSide === 'top' && info.targetSide === 'bottom') ||
        (info.sourceSide === 'bottom' && info.targetSide === 'top')) {
      const minX = Math.min(info.sourceRect.x, info.targetRect.x);
      const maxX = Math.max(info.sourceRect.x + info.sourceRect.width, info.targetRect.x + info.targetRect.width);
      return `V-${quantize(midSegment.y)}-${quantize(minX)}-${quantize(maxX)}`;
    }

    // For diagonal/corner connections, use more specific signature
    return `${info.sourceSide}-${info.targetSide}-${quantize(midSegment.x)}-${quantize(midSegment.y)}`;
  };

  // Group edges by path signature
  const pathGroups = new Map<string, EdgeInfo[]>();
  for (const info of edgeInfos) {
    const sig = getPathSignature(info);
    if (!pathGroups.has(sig)) {
      pathGroups.set(sig, []);
    }
    pathGroups.get(sig)!.push(info);
  }

  // Secondary overlap detection: check edges between groups for actual segment overlap
  // This catches cases where edges have different signatures but still visually overlap
  const OVERLAP_THRESHOLD = 30; // Edges within 30px are considered overlapping

  const doSegmentsOverlap = (info1: EdgeInfo, info2: EdgeInfo): boolean => {
    const mid1 = getMiddleSegment(info1);
    const mid2 = getMiddleSegment(info2);

    // Check if both edges use similar routing direction
    if (info1.sourceSide !== info2.sourceSide || info1.targetSide !== info2.targetSide) {
      return false;
    }

    // For horizontal edges, check if middle X positions are close
    if ((info1.sourceSide === 'right' && info1.targetSide === 'left') ||
        (info1.sourceSide === 'left' && info1.targetSide === 'right')) {
      const xClose = Math.abs(mid1.x - mid2.x) < OVERLAP_THRESHOLD;
      // Also check if Y ranges overlap (edges actually cross the same vertical space)
      const y1Range = [Math.min(info1.sourceRect.y, info1.targetRect.y),
                       Math.max(info1.sourceRect.y + info1.sourceRect.height, info1.targetRect.y + info1.targetRect.height)];
      const y2Range = [Math.min(info2.sourceRect.y, info2.targetRect.y),
                       Math.max(info2.sourceRect.y + info2.sourceRect.height, info2.targetRect.y + info2.targetRect.height)];
      const yOverlap = y1Range[0] < y2Range[1] && y2Range[0] < y1Range[1];
      return xClose && yOverlap;
    }

    // For vertical edges, check if middle Y positions are close
    if ((info1.sourceSide === 'bottom' && info1.targetSide === 'top') ||
        (info1.sourceSide === 'top' && info1.targetSide === 'bottom')) {
      const yClose = Math.abs(mid1.y - mid2.y) < OVERLAP_THRESHOLD;
      const x1Range = [Math.min(info1.sourceRect.x, info1.targetRect.x),
                       Math.max(info1.sourceRect.x + info1.sourceRect.width, info1.targetRect.x + info1.targetRect.width)];
      const x2Range = [Math.min(info2.sourceRect.x, info2.targetRect.x),
                       Math.max(info2.sourceRect.x + info2.sourceRect.width, info2.targetRect.x + info2.targetRect.width)];
      const xOverlap = x1Range[0] < x2Range[1] && x2Range[0] < x1Range[1];
      return yClose && xOverlap;
    }

    // For other connections, check proximity
    return Math.abs(mid1.x - mid2.x) < OVERLAP_THRESHOLD && Math.abs(mid1.y - mid2.y) < OVERLAP_THRESHOLD;
  };

  // Merge overlapping groups
  const mergedGroups: EdgeInfo[][] = [];
  const processedSignatures = new Set<string>();

  for (const [sig1, group1] of pathGroups) {
    if (processedSignatures.has(sig1)) continue;
    processedSignatures.add(sig1);

    const mergedGroup = [...group1];

    // Check against other groups for overlap
    for (const [sig2, group2] of pathGroups) {
      if (sig1 === sig2 || processedSignatures.has(sig2)) continue;

      // Check if any edge from group1 overlaps with any edge from group2
      let hasOverlap = false;
      for (const info1 of group1) {
        for (const info2 of group2) {
          if (doSegmentsOverlap(info1, info2)) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }

      if (hasOverlap) {
        mergedGroup.push(...group2);
        processedSignatures.add(sig2);
      }
    }

    mergedGroups.push(mergedGroup);
  }

  // Assign lane numbers to edges in each merged group
  const laneMap = new Map<string, { lane: number; totalLanes: number }>();

  for (const group of mergedGroups) {
    if (group.length === 1) {
      // Single edge, no lane needed
      laneMap.set(group[0].edge.id, { lane: 0, totalLanes: 1 });
    } else {
      // Multiple edges with similar paths - assign lanes
      // Sort by position to create consistent lane ordering (prevents edge crossings)
      const sorted = [...group].sort((a, b) => {
        const mid1 = getMiddleSegment(a);
        const mid2 = getMiddleSegment(b);

        // For horizontal edges, sort by source Y then target Y
        if ((a.sourceSide === 'right' && a.targetSide === 'left') ||
            (a.sourceSide === 'left' && a.targetSide === 'right')) {
          const yDiff = a.sourceRect.y - b.sourceRect.y;
          if (Math.abs(yDiff) > 10) return yDiff;
          return a.targetRect.y - b.targetRect.y;
        }

        // For vertical edges, sort by source X then target X
        if ((a.sourceSide === 'bottom' && a.targetSide === 'top') ||
            (a.sourceSide === 'top' && a.targetSide === 'bottom')) {
          const xDiff = a.sourceRect.x - b.sourceRect.x;
          if (Math.abs(xDiff) > 10) return xDiff;
          return a.targetRect.x - b.targetRect.x;
        }

        // Default: sort by midpoint position
        return mid1.x - mid2.x || mid1.y - mid2.y;
      });

      sorted.forEach((info, idx) => {
        laneMap.set(info.edge.id, { lane: idx, totalLanes: sorted.length });
      });
    }
  }

  // Build optimized edges with lane information
  const optimizedEdges: ServiceEdge[] = [];

  for (const info of edgeInfos) {
    const { edge, sourceRect, targetRect, sourceSide, targetSide } = info;

    const sourceIndex = sourceHandleMap.get(edge.id) ?? Math.floor(HANDLES_PER_SIDE / 2);
    const targetIndex = targetHandleMap.get(edge.id) ?? Math.floor(HANDLES_PER_SIDE / 2);

    const sourceHandle = `${sourceSide}-${sourceIndex}`;
    const targetHandle = `${targetSide}-${targetIndex}`;

    // Get lane assignment
    const laneInfo = laneMap.get(edge.id) ?? { lane: 0, totalLanes: 1 };

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

    // Use smartOrthogonal for edges that need routing (collision or multiple lanes)
    // Use default bezier for simple direct connections
    let edgeType: string;
    if (hasCollision || laneInfo.totalLanes > 1) {
      edgeType = 'smartOrthogonal';
    } else {
      edgeType = edge.type || 'default';
    }

    // Build edge data with optional obstacle information for PCB routing
    const edgeData: Record<string, unknown> = {
      ...edge.data,
      lane: laneInfo.lane,
      totalLanes: laneInfo.totalLanes,
    };

    // Include obstacle data for PCB-style routing
    if (includePcbObstacles) {
      // Convert node rectangles to obstacle format
      // Only include SERVICE nodes (not groups/zones) and exclude source/target
      const serviceNodeIds = new Set(
        nodes
          .filter(n => n.type === 'service')
          .map(n => n.id)
      );

      const obstacles = Array.from(nodeRects.entries())
        .filter(([id]) =>
          id !== edge.source &&
          id !== edge.target &&
          serviceNodeIds.has(id)
        )
        .map(([id, rect]) => ({
          id,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }));

      edgeData.obstacles = obstacles;
      edgeData.sourceNodeId = edge.source;
      edgeData.targetNodeId = edge.target;
    }

    optimizedEdges.push({
      ...edge,
      sourceHandle,
      targetHandle,
      type: edgeType,
      data: edgeData,
    });
  }

  // Handle edges that couldn't be processed (missing nodes)
  for (const edge of edges) {
    if (!optimizedEdges.find(e => e.id === edge.id)) {
      optimizedEdges.push(edge);
    }
  }

  // ============================================
  // VERIFICATION STEP: Detect and fix duplicate handle assignments
  // ============================================
  // This ensures no two edges share the same handle on the same node
  // Uses a UNIFIED approach - tracks all handle usage per node+side regardless of direction

  // Build unified handle groups: group all edges by node+handle (both source and target)
  // Key format: "nodeId:handleId" -> array of { edge, isSource: boolean }
  const unifiedHandleGroups = new Map<string, { edge: ServiceEdge; isSource: boolean }[]>();

  for (const edge of optimizedEdges) {
    // Track source handle usage
    if (edge.sourceHandle) {
      const key = `${edge.source}:${edge.sourceHandle}`;
      if (!unifiedHandleGroups.has(key)) {
        unifiedHandleGroups.set(key, []);
      }
      unifiedHandleGroups.get(key)!.push({ edge, isSource: true });
    }
    // Track target handle usage
    if (edge.targetHandle) {
      const key = `${edge.target}:${edge.targetHandle}`;
      if (!unifiedHandleGroups.has(key)) {
        unifiedHandleGroups.set(key, []);
      }
      unifiedHandleGroups.get(key)!.push({ edge, isSource: false });
    }
  }

  // Track which handles are used for reassignment (unified per node+side)
  const finalUsedHandles = new Map<string, Set<number>>(); // "nodeId:side" -> Set<handleIndex>

  // Initialize with all current assignments
  for (const edge of optimizedEdges) {
    if (edge.sourceHandle) {
      const [side, indexStr] = edge.sourceHandle.split('-');
      const key = `${edge.source}:${side}`;
      if (!finalUsedHandles.has(key)) {
        finalUsedHandles.set(key, new Set());
      }
      finalUsedHandles.get(key)!.add(parseInt(indexStr, 10));
    }
    if (edge.targetHandle) {
      const [side, indexStr] = edge.targetHandle.split('-');
      const key = `${edge.target}:${side}`;
      if (!finalUsedHandles.has(key)) {
        finalUsedHandles.set(key, new Set());
      }
      finalUsedHandles.get(key)!.add(parseInt(indexStr, 10));
    }
  }

  // Fix handle conflicts (unified - handles both source and target conflicts together)
  for (const [key, group] of unifiedHandleGroups) {
    if (group.length <= 1) continue; // No conflict

    // Multiple edges using same handle on same node - reassign all but the first
    const colonIdx = key.lastIndexOf(':');
    const nodeId = key.substring(0, colonIdx);
    const handleId = key.substring(colonIdx + 1);
    const [side, currentIndexStr] = handleId.split('-');
    const currentIndex = parseInt(currentIndexStr, 10);
    const usedKey = `${nodeId}:${side}`;

    // Keep first edge as-is, reassign others
    for (let i = 1; i < group.length; i++) {
      const { edge, isSource } = group[i];
      const usedSet = finalUsedHandles.get(usedKey) || new Set();

      // Find next available handle on this side
      let newIndex = -1;
      for (let offset = 1; offset < HANDLES_PER_SIDE; offset++) {
        const above = currentIndex + offset;
        const below = currentIndex - offset;

        if (above < HANDLES_PER_SIDE && !usedSet.has(above)) {
          newIndex = above;
          break;
        }
        if (below >= 0 && !usedSet.has(below)) {
          newIndex = below;
          break;
        }
      }

      if (newIndex >= 0) {
        // Update the appropriate handle based on whether this edge uses the node as source or target
        if (isSource) {
          edge.sourceHandle = `${side}-${newIndex}`;
        } else {
          edge.targetHandle = `${side}-${newIndex}`;
        }
        usedSet.add(newIndex);
        finalUsedHandles.set(usedKey, usedSet);
      }
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
