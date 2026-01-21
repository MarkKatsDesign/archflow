import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { useArchitectureStore } from '../../store/useArchitectureStore';

export interface ObstacleRect {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

export interface PCBEdgeData {
  lane?: number;
  totalLanes?: number;
  obstacles?: ObstacleRect[];
  sourceNodeId?: string;
  targetNodeId?: string;
}

const LANE_SPACING = 18;
const CHAMFER_SIZE = 12;
const OBSTACLE_PADDING = 20;

type Point = { x: number; y: number };

/**
 * Check if a line segment (p1 to p2) intersects with a rectangle
 */
function segmentIntersectsRect(
  p1: Point,
  p2: Point,
  rect: ObstacleRect,
  padding: number = OBSTACLE_PADDING
): boolean {
  const left = rect.x - padding;
  const right = rect.x + rect.width + padding;
  const top = rect.y - padding;
  const bottom = rect.y + rect.height + padding;

  // Check if both points are on the same side of the rect (no intersection possible)
  if ((p1.x < left && p2.x < left) || (p1.x > right && p2.x > right)) return false;
  if ((p1.y < top && p2.y < top) || (p1.y > bottom && p2.y > bottom)) return false;

  // For axis-aligned segments (which is what we use), simplified check
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  // Check if segment's bounding box overlaps with rectangle
  if (maxX < left || minX > right) return false;
  if (maxY < top || minY > bottom) return false;

  return true;
}

/**
 * Find all obstacles that a segment passes through
 */
function findBlockingObstacles(
  p1: Point,
  p2: Point,
  obstacles: ObstacleRect[]
): ObstacleRect[] {
  return obstacles.filter(obs => segmentIntersectsRect(p1, p2, obs));
}

/**
 * Get combined bounds of obstacles with padding
 */
function getObstaclesBounds(obstacles: ObstacleRect[]): { left: number; right: number; top: number; bottom: number } {
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const obs of obstacles) {
    left = Math.min(left, obs.x - OBSTACLE_PADDING);
    right = Math.max(right, obs.x + obs.width + OBSTACLE_PADDING);
    top = Math.min(top, obs.y - OBSTACLE_PADDING);
    bottom = Math.max(bottom, obs.y + obs.height + OBSTACLE_PADDING);
  }
  return { left, right, top, bottom };
}

/**
 * Find a clear Y level to route around obstacles (checks that the crossing doesn't hit other obstacles)
 */
function findClearHorizontalRoute(
  startX: number,
  endX: number,
  currentY: number,
  bounds: { top: number; bottom: number },
  allObstacles: ObstacleRect[],
  preferUp: boolean
): number {
  // Try going up first, then down (or vice versa based on preference)
  const directions = preferUp ? [-1, 1] : [1, -1];

  for (const dir of directions) {
    const baseY = dir < 0 ? bounds.top - 10 : bounds.bottom + 10;

    // Check if this Y level is clear for the crossing
    const crossingStart: Point = { x: Math.min(startX, endX) - 10, y: baseY };
    const crossingEnd: Point = { x: Math.max(startX, endX) + 10, y: baseY };

    const crossingObstacles = findBlockingObstacles(crossingStart, crossingEnd, allObstacles);

    if (crossingObstacles.length === 0) {
      return baseY;
    }

    // If blocked, try a bit further
    const furtherY = dir < 0 ? baseY - 50 : baseY + 50;
    const furtherStart: Point = { x: crossingStart.x, y: furtherY };
    const furtherEnd: Point = { x: crossingEnd.x, y: furtherY };

    if (findBlockingObstacles(furtherStart, furtherEnd, allObstacles).length === 0) {
      return furtherY;
    }
  }

  // Fallback: just use the bounds
  return preferUp ? bounds.top - 30 : bounds.bottom + 30;
}

/**
 * Find a clear X level to route around obstacles
 */
function findClearVerticalRoute(
  startY: number,
  endY: number,
  currentX: number,
  bounds: { left: number; right: number },
  allObstacles: ObstacleRect[],
  preferLeft: boolean
): number {
  const directions = preferLeft ? [-1, 1] : [1, -1];

  for (const dir of directions) {
    const baseX = dir < 0 ? bounds.left - 10 : bounds.right + 10;

    const crossingStart: Point = { x: baseX, y: Math.min(startY, endY) - 10 };
    const crossingEnd: Point = { x: baseX, y: Math.max(startY, endY) + 10 };

    const crossingObstacles = findBlockingObstacles(crossingStart, crossingEnd, allObstacles);

    if (crossingObstacles.length === 0) {
      return baseX;
    }

    const furtherX = dir < 0 ? baseX - 50 : baseX + 50;
    const furtherStart: Point = { x: furtherX, y: crossingStart.y };
    const furtherEnd: Point = { x: furtherX, y: crossingEnd.y };

    if (findBlockingObstacles(furtherStart, furtherEnd, allObstacles).length === 0) {
      return furtherX;
    }
  }

  return preferLeft ? bounds.left - 30 : bounds.right + 30;
}

/**
 * Generate path for Z-shape routing with proper midpoint
 */
function generateZPath(
  source: Point,
  target: Point,
  midValue: number,
  isHorizontalFirst: boolean,
  obstacles: ObstacleRect[]
): Point[] {
  const waypoints: Point[] = [source];

  if (isHorizontalFirst) {
    // Z-path: source → (midX, sourceY) → (midX, targetY) → target
    const corner1: Point = { x: midValue, y: source.y };
    const corner2: Point = { x: midValue, y: target.y };

    // Segment 1: source to corner1 (horizontal)
    const seg1Obstacles = findBlockingObstacles(source, corner1, obstacles);
    if (seg1Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg1Obstacles);
      const preferUp = source.y > (bounds.top + bounds.bottom) / 2;
      const routeY = findClearHorizontalRoute(source.x, corner1.x, source.y, bounds, obstacles, preferUp);

      const goingRight = corner1.x > source.x;
      const approachX = goingRight ? bounds.left - 5 : bounds.right + 5;
      const exitX = goingRight ? bounds.right + 5 : bounds.left - 5;

      waypoints.push({ x: approachX, y: source.y });
      waypoints.push({ x: approachX, y: routeY });
      waypoints.push({ x: exitX, y: routeY });
      waypoints.push({ x: exitX, y: source.y });
    }
    waypoints.push(corner1);

    // Segment 2: corner1 to corner2 (vertical)
    const seg2Obstacles = findBlockingObstacles(corner1, corner2, obstacles);
    if (seg2Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg2Obstacles);
      const preferLeft = corner1.x > (bounds.left + bounds.right) / 2;
      const routeX = findClearVerticalRoute(corner1.y, corner2.y, corner1.x, bounds, obstacles, preferLeft);

      const goingDown = corner2.y > corner1.y;
      const approachY = goingDown ? bounds.top - 5 : bounds.bottom + 5;
      const exitY = goingDown ? bounds.bottom + 5 : bounds.top - 5;

      waypoints.push({ x: corner1.x, y: approachY });
      waypoints.push({ x: routeX, y: approachY });
      waypoints.push({ x: routeX, y: exitY });
      waypoints.push({ x: corner1.x, y: exitY });
    }
    waypoints.push(corner2);

    // Segment 3: corner2 to target (horizontal)
    const seg3Obstacles = findBlockingObstacles(corner2, target, obstacles);
    if (seg3Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg3Obstacles);
      const preferUp = corner2.y > (bounds.top + bounds.bottom) / 2;
      const routeY = findClearHorizontalRoute(corner2.x, target.x, corner2.y, bounds, obstacles, preferUp);

      const goingRight = target.x > corner2.x;
      const approachX = goingRight ? bounds.left - 5 : bounds.right + 5;
      const exitX = goingRight ? bounds.right + 5 : bounds.left - 5;

      waypoints.push({ x: approachX, y: corner2.y });
      waypoints.push({ x: approachX, y: routeY });
      waypoints.push({ x: exitX, y: routeY });
      waypoints.push({ x: exitX, y: corner2.y });
    }
    waypoints.push(target);

  } else {
    // Z-path: source → (sourceX, midY) → (targetX, midY) → target
    const corner1: Point = { x: source.x, y: midValue };
    const corner2: Point = { x: target.x, y: midValue };

    // Segment 1: source to corner1 (vertical)
    const seg1Obstacles = findBlockingObstacles(source, corner1, obstacles);
    if (seg1Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg1Obstacles);
      const preferLeft = source.x > (bounds.left + bounds.right) / 2;
      const routeX = findClearVerticalRoute(source.y, corner1.y, source.x, bounds, obstacles, preferLeft);

      const goingDown = corner1.y > source.y;
      const approachY = goingDown ? bounds.top - 5 : bounds.bottom + 5;
      const exitY = goingDown ? bounds.bottom + 5 : bounds.top - 5;

      waypoints.push({ x: source.x, y: approachY });
      waypoints.push({ x: routeX, y: approachY });
      waypoints.push({ x: routeX, y: exitY });
      waypoints.push({ x: source.x, y: exitY });
    }
    waypoints.push(corner1);

    // Segment 2: corner1 to corner2 (horizontal)
    const seg2Obstacles = findBlockingObstacles(corner1, corner2, obstacles);
    if (seg2Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg2Obstacles);
      const preferUp = corner1.y > (bounds.top + bounds.bottom) / 2;
      const routeY = findClearHorizontalRoute(corner1.x, corner2.x, corner1.y, bounds, obstacles, preferUp);

      const goingRight = corner2.x > corner1.x;
      const approachX = goingRight ? bounds.left - 5 : bounds.right + 5;
      const exitX = goingRight ? bounds.right + 5 : bounds.left - 5;

      waypoints.push({ x: approachX, y: corner1.y });
      waypoints.push({ x: approachX, y: routeY });
      waypoints.push({ x: exitX, y: routeY });
      waypoints.push({ x: exitX, y: corner1.y });
    }
    waypoints.push(corner2);

    // Segment 3: corner2 to target (vertical)
    const seg3Obstacles = findBlockingObstacles(corner2, target, obstacles);
    if (seg3Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg3Obstacles);
      const preferLeft = corner2.x > (bounds.left + bounds.right) / 2;
      const routeX = findClearVerticalRoute(corner2.y, target.y, corner2.x, bounds, obstacles, preferLeft);

      const goingDown = target.y > corner2.y;
      const approachY = goingDown ? bounds.top - 5 : bounds.bottom + 5;
      const exitY = goingDown ? bounds.bottom + 5 : bounds.top - 5;

      waypoints.push({ x: corner2.x, y: approachY });
      waypoints.push({ x: routeX, y: approachY });
      waypoints.push({ x: routeX, y: exitY });
      waypoints.push({ x: corner2.x, y: exitY });
    }
    waypoints.push(target);
  }

  return waypoints;
}

/**
 * Remove redundant waypoints
 */
function cleanupWaypoints(waypoints: Point[]): Point[] {
  if (waypoints.length <= 2) return waypoints;

  const result: Point[] = [waypoints[0]];

  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];

    // Skip if too close to previous point
    const dist = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
    if (dist < 3) continue;

    // Skip if collinear
    const cross = (curr.x - prev.x) * (next.y - prev.y) - (curr.y - prev.y) * (next.x - prev.x);
    if (Math.abs(cross) < 1) continue;

    result.push(curr);
  }

  result.push(waypoints[waypoints.length - 1]);
  return result;
}

/**
 * Generate PCB-style path with 45° chamfers
 */
function generateChamferedPath(waypoints: Point[], chamferSize: number = CHAMFER_SIZE): string {
  if (waypoints.length < 2) return '';
  if (waypoints.length === 2) {
    return `M ${waypoints[0].x} ${waypoints[0].y} L ${waypoints[1].x} ${waypoints[1].y}`;
  }

  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;

  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];

    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    const c = Math.min(chamferSize, len1 / 3, len2 / 3);

    if (c < 2 || len1 < 5 || len2 < 5) {
      path += ` L ${curr.x} ${curr.y}`;
    } else {
      const n1 = { x: v1.x / len1, y: v1.y / len1 };
      const n2 = { x: v2.x / len2, y: v2.y / len2 };
      const chamferStart = { x: curr.x - n1.x * c, y: curr.y - n1.y * c };
      const chamferEnd = { x: curr.x + n2.x * c, y: curr.y + n2.y * c };

      path += ` L ${chamferStart.x} ${chamferStart.y}`;
      path += ` L ${chamferEnd.x} ${chamferEnd.y}`;
    }
  }

  const last = waypoints[waypoints.length - 1];
  path += ` L ${last.x} ${last.y}`;

  return path;
}

/**
 * Calculate PCB-style path with obstacle avoidance
 */
function calculatePCBPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
  lane: number = 0,
  totalLanes: number = 1,
  obstacles: ObstacleRect[] = []
): { path: string; labelX: number; labelY: number } {
  const sourceSide = sourceHandle?.split('-')[0] || 'right';
  const targetSide = targetHandle?.split('-')[0] || 'left';

  const laneOffset = totalLanes > 1
    ? (lane - (totalLanes - 1) / 2) * LANE_SPACING
    : 0;

  const source: Point = { x: sourceX, y: sourceY };
  const target: Point = { x: targetX, y: targetY };

  let waypoints: Point[];

  // Horizontal connections (right-left or left-right)
  if ((sourceSide === 'right' && targetSide === 'left') ||
      (sourceSide === 'left' && targetSide === 'right')) {
    const midX = (sourceX + targetX) / 2 + laneOffset;
    waypoints = generateZPath(source, target, midX, true, obstacles);
  }
  // Vertical connections (bottom-top or top-bottom)
  else if ((sourceSide === 'bottom' && targetSide === 'top') ||
           (sourceSide === 'top' && targetSide === 'bottom')) {
    const midY = (sourceY + targetY) / 2 + laneOffset;
    waypoints = generateZPath(source, target, midY, false, obstacles);
  }
  // L-shaped connections
  else if (sourceSide === 'right' || sourceSide === 'left') {
    waypoints = generateZPath(source, target, target.x + laneOffset, true, obstacles);
  } else {
    waypoints = generateZPath(source, target, target.y + laneOffset, false, obstacles);
  }

  waypoints = cleanupWaypoints(waypoints);
  const path = generateChamferedPath(waypoints, CHAMFER_SIZE);

  const midIndex = Math.floor(waypoints.length / 2);
  const labelX = waypoints.length >= 2
    ? (waypoints[Math.max(0, midIndex - 1)].x + waypoints[midIndex].x) / 2
    : sourceX;
  const labelY = waypoints.length >= 2
    ? (waypoints[Math.max(0, midIndex - 1)].y + waypoints[midIndex].y) / 2
    : sourceY;

  return { path, labelX, labelY };
}

function PCBEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceHandleId,
  targetHandleId,
  style = {},
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  data,
  selected,
}: EdgeProps<PCBEdgeData>) {
  const { selectedEdgeId } = useArchitectureStore();
  const isSelected = selected || id === selectedEdgeId;

  const lane = data?.lane ?? 0;
  const totalLanes = data?.totalLanes ?? 1;
  const obstacles = data?.obstacles ?? [];

  const { path, labelX, labelY } = calculatePCBPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceHandleId,
    targetHandleId,
    lane,
    totalLanes,
    obstacles
  );

  const defaultColor = '#06b6d4';
  const selectedColor = '#22d3ee';

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isSelected ? 3 : (style.strokeWidth as number) || 2,
          stroke: isSelected ? selectedColor : (style.stroke as string) || defaultColor,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                background: (labelBgStyle?.fill as string) || '#0f172a',
                padding: labelBgPadding ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px` : '4px 8px',
                borderRadius: labelBgBorderRadius || 4,
                fontSize: (labelStyle?.fontSize as number) || 12,
                fontWeight: (labelStyle?.fontWeight as number) || 600,
                color: (labelStyle?.fill as string) || '#06b6d4',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(PCBEdge);
