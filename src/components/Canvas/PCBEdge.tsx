import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "reactflow";
import { useArchitectureStore } from "../../store/useArchitectureStore";

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
const DEBUG_ROUTING = true; // Set to false to disable logging

type Point = { x: number; y: number };

function debugLog(edgeLabel: string | undefined, ...args: unknown[]) {
  if (DEBUG_ROUTING && edgeLabel) {
    console.log(`[PCB:${edgeLabel}]`, ...args);
  }
}

/**
 * Check if a line segment (p1 to p2) intersects with a rectangle
 */
function segmentIntersectsRect(
  p1: Point,
  p2: Point,
  rect: ObstacleRect,
  padding: number = OBSTACLE_PADDING,
): boolean {
  const left = rect.x - padding;
  const right = rect.x + rect.width + padding;
  const top = rect.y - padding;
  const bottom = rect.y + rect.height + padding;

  // Check if both points are on the same side of the rect (no intersection possible)
  if ((p1.x < left && p2.x < left) || (p1.x > right && p2.x > right))
    return false;
  if ((p1.y < top && p2.y < top) || (p1.y > bottom && p2.y > bottom))
    return false;

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
  obstacles: ObstacleRect[],
): ObstacleRect[] {
  return obstacles.filter((obs) => segmentIntersectsRect(p1, p2, obs));
}

/**
 * Get combined bounds of obstacles with padding
 */
function getObstaclesBounds(obstacles: ObstacleRect[]): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  let left = Infinity,
    right = -Infinity,
    top = Infinity,
    bottom = -Infinity;
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
  _currentY: number,
  bounds: { top: number; bottom: number },
  allObstacles: ObstacleRect[],
  preferUp: boolean,
): number {
  // Try going up first, then down (or vice versa based on preference)
  const directions = preferUp ? [-1, 1] : [1, -1];

  for (const dir of directions) {
    const baseY = dir < 0 ? bounds.top - 10 : bounds.bottom + 10;

    // Check if this Y level is clear for the crossing
    const crossingStart: Point = { x: Math.min(startX, endX) - 10, y: baseY };
    const crossingEnd: Point = { x: Math.max(startX, endX) + 10, y: baseY };

    const crossingObstacles = findBlockingObstacles(
      crossingStart,
      crossingEnd,
      allObstacles,
    );

    if (crossingObstacles.length === 0) {
      return baseY;
    }

    // If blocked, try a bit further
    const furtherY = dir < 0 ? baseY - 50 : baseY + 50;
    const furtherStart: Point = { x: crossingStart.x, y: furtherY };
    const furtherEnd: Point = { x: crossingEnd.x, y: furtherY };

    if (
      findBlockingObstacles(furtherStart, furtherEnd, allObstacles).length === 0
    ) {
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
  _currentX: number,
  bounds: { left: number; right: number },
  allObstacles: ObstacleRect[],
  preferLeft: boolean,
): number {
  const directions = preferLeft ? [-1, 1] : [1, -1];

  for (const dir of directions) {
    const baseX = dir < 0 ? bounds.left - 10 : bounds.right + 10;

    const crossingStart: Point = { x: baseX, y: Math.min(startY, endY) - 10 };
    const crossingEnd: Point = { x: baseX, y: Math.max(startY, endY) + 10 };

    const crossingObstacles = findBlockingObstacles(
      crossingStart,
      crossingEnd,
      allObstacles,
    );

    if (crossingObstacles.length === 0) {
      return baseX;
    }

    const furtherX = dir < 0 ? baseX - 50 : baseX + 50;
    const furtherStart: Point = { x: furtherX, y: crossingStart.y };
    const furtherEnd: Point = { x: furtherX, y: crossingEnd.y };

    if (
      findBlockingObstacles(furtherStart, furtherEnd, allObstacles).length === 0
    ) {
      return furtherX;
    }
  }

  return preferLeft ? bounds.left - 30 : bounds.right + 30;
}

/**
 * Check if a Z-path with given midpoint is clear of obstacles
 */
function isZPathClear(
  source: Point,
  target: Point,
  midValue: number,
  isHorizontalFirst: boolean,
  obstacles: ObstacleRect[],
): boolean {
  if (isHorizontalFirst) {
    const corner1: Point = { x: midValue, y: source.y };
    const corner2: Point = { x: midValue, y: target.y };

    if (findBlockingObstacles(source, corner1, obstacles).length > 0)
      return false;
    if (findBlockingObstacles(corner1, corner2, obstacles).length > 0)
      return false;
    if (findBlockingObstacles(corner2, target, obstacles).length > 0)
      return false;
  } else {
    const corner1: Point = { x: source.x, y: midValue };
    const corner2: Point = { x: target.x, y: midValue };

    if (findBlockingObstacles(source, corner1, obstacles).length > 0)
      return false;
    if (findBlockingObstacles(corner1, corner2, obstacles).length > 0)
      return false;
    if (findBlockingObstacles(corner2, target, obstacles).length > 0)
      return false;
  }

  return true;
}

/**
 * Find obstacles that would block a Z-path's middle segment
 */
function findObstaclesInZPath(
  source: Point,
  target: Point,
  _isHorizontalFirst: boolean,
  obstacles: ObstacleRect[],
): ObstacleRect[] {
  // Find obstacles in the bounding box of source and target
  const minX = Math.min(source.x, target.x) - OBSTACLE_PADDING;
  const maxX = Math.max(source.x, target.x) + OBSTACLE_PADDING;
  const minY = Math.min(source.y, target.y) - OBSTACLE_PADDING;
  const maxY = Math.max(source.y, target.y) + OBSTACLE_PADDING;

  return obstacles.filter((obs) => {
    const obsRight = obs.x + obs.width + OBSTACLE_PADDING;
    const obsBottom = obs.y + obs.height + OBSTACLE_PADDING;
    const obsLeft = obs.x - OBSTACLE_PADDING;
    const obsTop = obs.y - OBSTACLE_PADDING;

    // Check if obstacle overlaps with the path's bounding box
    return !(
      obsRight < minX ||
      obsLeft > maxX ||
      obsBottom < minY ||
      obsTop > maxY
    );
  });
}

/**
 * Find gaps between obstacles where we can route through
 * Returns array of { start, end } ranges representing clear corridors
 */
function findVerticalGaps(
  obstacles: ObstacleRect[],
  xRangeStart: number,
  xRangeEnd: number,
  yMin: number,
  yMax: number,
): { start: number; end: number }[] {
  // Get all obstacles that overlap with the X range
  const relevantObstacles = obstacles.filter((obs) => {
    const obsLeft = obs.x - OBSTACLE_PADDING;
    const obsRight = obs.x + obs.width + OBSTACLE_PADDING;
    return !(obsRight < xRangeStart || obsLeft > xRangeEnd);
  });

  if (relevantObstacles.length === 0) {
    return [{ start: yMin, end: yMax }];
  }

  // Sort by top Y position
  const sorted = [...relevantObstacles].sort((a, b) => a.y - b.y);

  const gaps: { start: number; end: number }[] = [];
  let currentY = yMin;

  for (const obs of sorted) {
    const obsTop = obs.y - OBSTACLE_PADDING;
    const obsBottom = obs.y + obs.height + OBSTACLE_PADDING;

    if (obsTop > currentY) {
      // There's a gap before this obstacle
      gaps.push({ start: currentY, end: obsTop });
    }
    currentY = Math.max(currentY, obsBottom);
  }

  // Check for gap after last obstacle
  if (currentY < yMax) {
    gaps.push({ start: currentY, end: yMax });
  }

  return gaps;
}

/**
 * Find horizontal gaps between obstacles
 */
function findHorizontalGaps(
  obstacles: ObstacleRect[],
  yRangeStart: number,
  yRangeEnd: number,
  xMin: number,
  xMax: number,
): { start: number; end: number }[] {
  // Get all obstacles that overlap with the Y range
  const relevantObstacles = obstacles.filter((obs) => {
    const obsTop = obs.y - OBSTACLE_PADDING;
    const obsBottom = obs.y + obs.height + OBSTACLE_PADDING;
    return !(obsBottom < yRangeStart || obsTop > yRangeEnd);
  });

  if (relevantObstacles.length === 0) {
    return [{ start: xMin, end: xMax }];
  }

  // Sort by left X position
  const sorted = [...relevantObstacles].sort((a, b) => a.x - b.x);

  const gaps: { start: number; end: number }[] = [];
  let currentX = xMin;

  for (const obs of sorted) {
    const obsLeft = obs.x - OBSTACLE_PADDING;
    const obsRight = obs.x + obs.width + OBSTACLE_PADDING;

    if (obsLeft > currentX) {
      gaps.push({ start: currentX, end: obsLeft });
    }
    currentX = Math.max(currentX, obsRight);
  }

  if (currentX < xMax) {
    gaps.push({ start: currentX, end: xMax });
  }

  return gaps;
}

/**
 * Find the best midpoint for a Z-path that avoids obstacles
 * Strategically places the midpoint above, below, left, or right of obstacles
 * Returns { midValue, switchOrientation, useGapRouting, gapY/gapX }
 */
interface MidpointResult {
  midValue: number;
  switchOrientation: boolean;
  useGapRouting?: boolean;
  gapY?: number; // For horizontal-first: Y level to route through gap
  gapX?: number; // For vertical-first: X level to route through gap
  useUPath?: boolean; // Use 4-segment U-path routing
  uPathPoints?: Point[]; // Pre-computed U-path waypoints
}

function findBestMidpoint(
  source: Point,
  target: Point,
  defaultMid: number,
  isHorizontalFirst: boolean,
  obstacles: ObstacleRect[],
  debugLabel?: string,
  corridorOffset: number = 0,
): MidpointResult {
  debugLog(
    debugLabel,
    `findBestMidpoint: source=(${source.x.toFixed(0)},${source.y.toFixed(0)}) target=(${target.x.toFixed(0)},${target.y.toFixed(0)}) defaultMid=${defaultMid.toFixed(0)} isHorizontalFirst=${isHorizontalFirst} corridorOffset=${corridorOffset.toFixed(0)}`,
  );
  debugLog(debugLabel, `  Total obstacles: ${obstacles.length}`);

  // First, try the default midpoint
  if (isZPathClear(source, target, defaultMid, isHorizontalFirst, obstacles)) {
    debugLog(
      debugLabel,
      `  ✓ Default midpoint ${defaultMid.toFixed(0)} is CLEAR`,
    );
    return { midValue: defaultMid, switchOrientation: false };
  }
  debugLog(
    debugLabel,
    `  ✗ Default midpoint ${defaultMid.toFixed(0)} is BLOCKED`,
  );

  // Find obstacles that are in the way
  const blockingObstacles = findObstaclesInZPath(
    source,
    target,
    isHorizontalFirst,
    obstacles,
  );
  debugLog(
    debugLabel,
    `  Blocking obstacles in path: ${blockingObstacles.length}`,
    blockingObstacles.map(
      (o) => `id=${o.id} pos=(${o.x},${o.y}) size=${o.width}x${o.height}`,
    ),
  );

  if (blockingObstacles.length === 0) {
    debugLog(debugLabel, `  No blocking obstacles found, using default`);
    return { midValue: defaultMid, switchOrientation: false };
  }

  // Calculate the combined bounds of blocking obstacles
  const bounds = getObstaclesBounds(blockingObstacles);
  debugLog(
    debugLabel,
    `  Combined obstacle bounds: left=${bounds.left.toFixed(0)} right=${bounds.right.toFixed(0)} top=${bounds.top.toFixed(0)} bottom=${bounds.bottom.toFixed(0)}`,
  );

  // For horizontal-first paths (Z laying down), we need to find a clear X
  // For vertical-first paths (Z standing up), we need to find a clear Y
  if (isHorizontalFirst) {
    // IMPORTANT: Prefer the direction that matches travel direction
    // If going RIGHT (target.x > source.x), try RIGHT first
    // If going LEFT (target.x < source.x), try LEFT first
    const goingRight = target.x > source.x;
    debugLog(
      debugLabel,
      `  Travel direction: ${goingRight ? "RIGHT" : "LEFT"}`,
    );

    const tryLeft = bounds.left - 10;
    const tryRight = bounds.right + 10;

    const firstTry = goingRight ? tryRight : tryLeft;
    const secondTry = goingRight ? tryLeft : tryRight;
    const firstLabel = goingRight ? "RIGHT" : "LEFT";
    const secondLabel = goingRight ? "LEFT" : "RIGHT";

    debugLog(
      debugLabel,
      `  Trying ${firstLabel} of obstacles (preferred): X=${firstTry.toFixed(0)}`,
    );
    if (isZPathClear(source, target, firstTry, isHorizontalFirst, obstacles)) {
      debugLog(debugLabel, `  ✓ ${firstLabel} path is CLEAR`);
      return { midValue: firstTry, switchOrientation: false };
    }
    debugLog(debugLabel, `  ✗ ${firstLabel} path is BLOCKED`);

    debugLog(
      debugLabel,
      `  Trying ${secondLabel} of obstacles: X=${secondTry.toFixed(0)}`,
    );
    if (isZPathClear(source, target, secondTry, isHorizontalFirst, obstacles)) {
      debugLog(debugLabel, `  ✓ ${secondLabel} path is CLEAR`);
      return { midValue: secondTry, switchOrientation: false };
    }
    debugLog(debugLabel, `  ✗ ${secondLabel} path is BLOCKED`);
  } else {
    // Vertical-first: try going ABOVE or BELOW all obstacles
    // IMPORTANT: Prefer the direction that matches travel direction
    const goingDown = target.y > source.y;
    debugLog(debugLabel, `  Travel direction: ${goingDown ? "DOWN" : "UP"}`);

    const tryAbove = bounds.top - 10;
    const tryBelow = bounds.bottom + 10;

    // Check if ABOVE/BELOW would go against travel direction (suboptimal)
    const aboveGoesBackward = goingDown && tryAbove < source.y;
    const belowGoesBackward = !goingDown && tryBelow > source.y;

    // First, try GAP ROUTING if going around would be suboptimal
    // This finds a clear path BETWEEN source and target
    if (aboveGoesBackward || belowGoesBackward) {
      debugLog(
        debugLabel,
        `  Checking for gaps BETWEEN source and target first (avoid going backward)`,
      );
      const minY = Math.min(source.y, target.y);
      const maxY = Math.max(source.y, target.y);
      const minX = Math.min(source.x, target.x);
      const maxX = Math.max(source.x, target.x);

      const gaps = findVerticalGaps(obstacles, minX, maxX, minY, maxY);
      debugLog(
        debugLabel,
        `  Found ${gaps.length} vertical gaps between source/target:`,
        gaps.map((g) => `[${g.start.toFixed(0)}-${g.end.toFixed(0)}]`),
      );

      for (const gap of gaps) {
        const gapMidY = (gap.start + gap.end) / 2;
        const gapSize = gap.end - gap.start;

        if (gapSize >= 40 && gapMidY > minY && gapMidY < maxY) {
          // Check if this creates a clear Z-path
          if (
            isZPathClear(source, target, gapMidY, isHorizontalFirst, obstacles)
          ) {
            debugLog(
              debugLabel,
              `  ✓ Found clear gap at Y=${gapMidY.toFixed(0)} (size=${gapSize.toFixed(0)})`,
            );
            return { midValue: gapMidY, switchOrientation: false };
          }
        }
      }
      debugLog(debugLabel, `  No usable gaps found between source and target`);
    }

    // Try in order based on travel direction
    const firstTry = goingDown ? tryBelow : tryAbove;
    const secondTry = goingDown ? tryAbove : tryBelow;
    const firstLabel = goingDown ? "BELOW" : "ABOVE";
    const secondLabel = goingDown ? "ABOVE" : "BELOW";

    debugLog(
      debugLabel,
      `  Trying ${firstLabel} obstacles (preferred): Y=${firstTry.toFixed(0)}`,
    );
    if (isZPathClear(source, target, firstTry, isHorizontalFirst, obstacles)) {
      debugLog(debugLabel, `  ✓ ${firstLabel} path is CLEAR`);
      return { midValue: firstTry, switchOrientation: false };
    }
    debugLog(debugLabel, `  ✗ ${firstLabel} path is BLOCKED`);

    debugLog(
      debugLabel,
      `  Trying ${secondLabel} obstacles: Y=${secondTry.toFixed(0)}`,
    );
    if (isZPathClear(source, target, secondTry, isHorizontalFirst, obstacles)) {
      debugLog(debugLabel, `  ✓ ${secondLabel} path is CLEAR`);
      return { midValue: secondTry, switchOrientation: false };
    }
    debugLog(debugLabel, `  ✗ ${secondLabel} path is BLOCKED`);
  }

  // If standard positioning didn't work, try SWITCHING ORIENTATION
  // This handles cases where source/target are both inside obstacle bounds
  debugLog(
    debugLabel,
    `  Trying SWITCHED orientation (${isHorizontalFirst ? "vertical-first" : "horizontal-first"})`,
  );

  if (isHorizontalFirst) {
    // Was horizontal-first, try vertical-first: need a Y midpoint
    // Try above all obstacles
    const tryAbove = bounds.top - 10;
    if (isZPathClear(source, target, tryAbove, false, obstacles)) {
      debugLog(
        debugLabel,
        `  ✓ SWITCHED to vertical-first, ABOVE at Y=${tryAbove.toFixed(0)}`,
      );
      return { midValue: tryAbove, switchOrientation: true };
    }
    // Try below all obstacles
    const tryBelow = bounds.bottom + 10;
    if (isZPathClear(source, target, tryBelow, false, obstacles)) {
      debugLog(
        debugLabel,
        `  ✓ SWITCHED to vertical-first, BELOW at Y=${tryBelow.toFixed(0)}`,
      );
      return { midValue: tryBelow, switchOrientation: true };
    }
  } else {
    // Was vertical-first, try horizontal-first: need an X midpoint
    // Try left of all obstacles
    const tryLeft = bounds.left - 10;
    if (isZPathClear(source, target, tryLeft, true, obstacles)) {
      debugLog(
        debugLabel,
        `  ✓ SWITCHED to horizontal-first, LEFT at X=${tryLeft.toFixed(0)}`,
      );
      return { midValue: tryLeft, switchOrientation: true };
    }
    // Try right of all obstacles
    const tryRight = bounds.right + 10;
    if (isZPathClear(source, target, tryRight, true, obstacles)) {
      debugLog(
        debugLabel,
        `  ✓ SWITCHED to horizontal-first, RIGHT at X=${tryRight.toFixed(0)}`,
      );
      return { midValue: tryRight, switchOrientation: true };
    }
  }

  // If switched orientation also didn't work, try U-PATH ROUTING
  // This creates a 4-segment path that properly respects handle directions
  debugLog(debugLabel, `  Trying U-PATH ROUTING...`);

  // IMPORTANT: Use bounds of ALL obstacles, not just blocking ones
  // This ensures we route completely around everything
  const allObstacleBounds = getObstaclesBounds(obstacles);
  debugLog(
    debugLabel,
    `  ALL obstacle bounds: left=${allObstacleBounds.left.toFixed(0)} right=${allObstacleBounds.right.toFixed(0)} top=${allObstacleBounds.top.toFixed(0)} bottom=${allObstacleBounds.bottom.toFixed(0)}`,
  );

  if (isHorizontalFirst) {
    // For horizontal-first: source exits horizontally, need to escape that way first
    // U-path: source → (escapeX, source.y) → (escapeX, target.y) → (target.x, target.y) → target
    const goingRight = target.x > source.x;

    // Escape X should be past ALL obstacles in the travel direction
    // Add corridorOffset to spread edges across different corridors
    const escapeX = (goingRight ? allObstacleBounds.right + 20 : allObstacleBounds.left - 20) + corridorOffset;

    // For the vertical segment, we need to clear obstacles
    // Check if we can route: source → escapeX → target
    const waypoint1: Point = { x: escapeX, y: source.y };
    const waypoint2: Point = { x: escapeX, y: target.y };

    const seg1Clear =
      findBlockingObstacles(source, waypoint1, obstacles).length === 0;
    const seg2Clear =
      findBlockingObstacles(waypoint1, waypoint2, obstacles).length === 0;
    const seg3Clear =
      findBlockingObstacles(waypoint2, target, obstacles).length === 0;

    debugLog(
      debugLabel,
      `  U-PATH: escapeX=${escapeX.toFixed(0)}, seg1=${seg1Clear}, seg2=${seg2Clear}, seg3=${seg3Clear}`,
    );

    if (seg1Clear && seg2Clear && seg3Clear) {
      debugLog(
        debugLabel,
        `  ✓ U-PATH ROUTING via escapeX=${escapeX.toFixed(0)}`,
      );
      return {
        midValue: defaultMid,
        switchOrientation: false,
        useUPath: true,
        uPathPoints: [source, waypoint1, waypoint2, target],
      };
    }

    // If direct U-path is blocked, try routing AROUND all obstacles
    // Go further out to ensure clearance, add corridorOffset for separation
    const farEscapeX = (goingRight ? allObstacleBounds.right + 50 : allObstacleBounds.left - 50) + corridorOffset;
    const farWaypoint1: Point = { x: farEscapeX, y: source.y };
    const farWaypoint2: Point = { x: farEscapeX, y: target.y };

    const farSeg1Clear =
      findBlockingObstacles(source, farWaypoint1, obstacles).length === 0;
    const farSeg2Clear =
      findBlockingObstacles(farWaypoint1, farWaypoint2, obstacles).length === 0;
    const farSeg3Clear =
      findBlockingObstacles(farWaypoint2, target, obstacles).length === 0;

    debugLog(
      debugLabel,
      `  U-PATH (far): escapeX=${farEscapeX.toFixed(0)}, seg1=${farSeg1Clear}, seg2=${farSeg2Clear}, seg3=${farSeg3Clear}`,
    );

    if (farSeg1Clear && farSeg2Clear && farSeg3Clear) {
      debugLog(
        debugLabel,
        `  ✓ U-PATH ROUTING (far) via escapeX=${farEscapeX.toFixed(0)}`,
      );
      return {
        midValue: defaultMid,
        switchOrientation: false,
        useUPath: true,
        uPathPoints: [source, farWaypoint1, farWaypoint2, target],
      };
    }

    // Try the opposite direction if same direction is completely blocked
    const oppositeEscapeX = (goingRight ? allObstacleBounds.left - 50 : allObstacleBounds.right + 50) + corridorOffset;
    const oppWaypoint1: Point = { x: oppositeEscapeX, y: source.y };
    const oppWaypoint2: Point = { x: oppositeEscapeX, y: target.y };

    const oppSeg1Clear =
      findBlockingObstacles(source, oppWaypoint1, obstacles).length === 0;
    const oppSeg2Clear =
      findBlockingObstacles(oppWaypoint1, oppWaypoint2, obstacles).length === 0;
    const oppSeg3Clear =
      findBlockingObstacles(oppWaypoint2, target, obstacles).length === 0;

    debugLog(
      debugLabel,
      `  U-PATH (opposite): escapeX=${oppositeEscapeX.toFixed(0)}, seg1=${oppSeg1Clear}, seg2=${oppSeg2Clear}, seg3=${oppSeg3Clear}`,
    );

    if (oppSeg1Clear && oppSeg2Clear && oppSeg3Clear) {
      debugLog(
        debugLabel,
        `  ✓ U-PATH ROUTING (opposite) via escapeX=${oppositeEscapeX.toFixed(0)}`,
      );
      return {
        midValue: defaultMid,
        switchOrientation: false,
        useUPath: true,
        uPathPoints: [source, oppWaypoint1, oppWaypoint2, target],
      };
    }

    // If U-PATH failed because seg1 is blocked, try ESCAPE-FIRST routing
    // This adds an initial vertical escape before the horizontal movement
    // 5-segment path: source → (source.x, escapeY) → (escapeX, escapeY) → (escapeX, target.y) → target
    debugLog(debugLabel, `  Trying ESCAPE-FIRST routing (5-segment)...`);

    // Find obstacles blocking the immediate horizontal path from source
    const immediateBlockers = findBlockingObstacles(
      source,
      { x: goingRight ? allObstacleBounds.right + 50 : allObstacleBounds.left - 50, y: source.y },
      obstacles,
    );

    if (immediateBlockers.length > 0) {
      const blockerBounds = getObstaclesBounds(immediateBlockers);
      debugLog(
        debugLabel,
        `  Immediate blockers: ${immediateBlockers.length}, bounds: top=${blockerBounds.top.toFixed(0)} bottom=${blockerBounds.bottom.toFixed(0)}`,
      );

      // Try escaping DOWN first (below the blocking obstacles), then UP
      const escapeDirections = [
        { escapeY: blockerBounds.bottom + 15, label: "DOWN" },
        { escapeY: blockerBounds.top - 15, label: "UP" },
      ];

      for (const { escapeY, label } of escapeDirections) {
        // 5-segment: source → (source.x, escapeY) → (farEscapeX, escapeY) → (farEscapeX, target.y) → target
        const esc1: Point = { x: source.x, y: escapeY };
        const esc2: Point = { x: farEscapeX, y: escapeY };
        const esc3: Point = { x: farEscapeX, y: target.y };

        const escSeg1 =
          findBlockingObstacles(source, esc1, obstacles).length === 0;
        const escSeg2 =
          findBlockingObstacles(esc1, esc2, obstacles).length === 0;
        const escSeg3 =
          findBlockingObstacles(esc2, esc3, obstacles).length === 0;
        const escSeg4 =
          findBlockingObstacles(esc3, target, obstacles).length === 0;

        debugLog(
          debugLabel,
          `  ESCAPE-FIRST (${label}): escapeY=${escapeY.toFixed(0)}, escapeX=${farEscapeX.toFixed(0)}, seg1=${escSeg1}, seg2=${escSeg2}, seg3=${escSeg3}, seg4=${escSeg4}`,
        );

        if (escSeg1 && escSeg2 && escSeg3 && escSeg4) {
          debugLog(
            debugLabel,
            `  ✓ ESCAPE-FIRST ROUTING (${label}) via escapeY=${escapeY.toFixed(0)}`,
          );
          return {
            midValue: defaultMid,
            switchOrientation: false,
            useUPath: true,
            uPathPoints: [source, esc1, esc2, esc3, target],
          };
        }
      }

      // Try with even further escape X
      const veryFarEscapeX = (goingRight ? allObstacleBounds.right + 100 : allObstacleBounds.left - 100) + corridorOffset;
      for (const { escapeY, label } of escapeDirections) {
        const esc1: Point = { x: source.x, y: escapeY };
        const esc2: Point = { x: veryFarEscapeX, y: escapeY };
        const esc3: Point = { x: veryFarEscapeX, y: target.y };

        const escSeg1 =
          findBlockingObstacles(source, esc1, obstacles).length === 0;
        const escSeg2 =
          findBlockingObstacles(esc1, esc2, obstacles).length === 0;
        const escSeg3 =
          findBlockingObstacles(esc2, esc3, obstacles).length === 0;
        const escSeg4 =
          findBlockingObstacles(esc3, target, obstacles).length === 0;

        debugLog(
          debugLabel,
          `  ESCAPE-FIRST (${label}, far): escapeY=${escapeY.toFixed(0)}, escapeX=${veryFarEscapeX.toFixed(0)}, seg1=${escSeg1}, seg2=${escSeg2}, seg3=${escSeg3}, seg4=${escSeg4}`,
        );

        if (escSeg1 && escSeg2 && escSeg3 && escSeg4) {
          debugLog(
            debugLabel,
            `  ✓ ESCAPE-FIRST ROUTING (${label}, far)`,
          );
          return {
            midValue: defaultMid,
            switchOrientation: false,
            useUPath: true,
            uPathPoints: [source, esc1, esc2, esc3, target],
          };
        }
      }

      // If seg4 is blocked (horizontal approach to target), try 6-segment with vertical approach
      // This helps when target has obstacles at its Y level
      debugLog(debugLabel, `  Trying 6-SEGMENT routing with vertical target approach...`);

      for (const { escapeY, label } of escapeDirections) {
        // Find a clear Y level to approach the target from
        // Try approaching from above (for top handles) or below (for bottom handles)
        const approachOffsets = [
          { approachY: target.y - 50, approachLabel: "from-above" },
          { approachY: target.y + 50, approachLabel: "from-below" },
          { approachY: target.y - 100, approachLabel: "from-above-far" },
          { approachY: target.y + 100, approachLabel: "from-below-far" },
        ];

        for (const { approachY, approachLabel } of approachOffsets) {
          // 6-segment: source → esc1 → esc2 → esc3 → esc4 → target
          // source → (source.x, escapeY) → (escapeX, escapeY) → (escapeX, approachY) → (target.x, approachY) → target
          const esc1: Point = { x: source.x, y: escapeY };
          const esc2: Point = { x: veryFarEscapeX, y: escapeY };
          const esc3: Point = { x: veryFarEscapeX, y: approachY };
          const esc4: Point = { x: target.x, y: approachY };

          const seg1Clear =
            findBlockingObstacles(source, esc1, obstacles).length === 0;
          const seg2Clear =
            findBlockingObstacles(esc1, esc2, obstacles).length === 0;
          const seg3Clear =
            findBlockingObstacles(esc2, esc3, obstacles).length === 0;
          const seg4Clear =
            findBlockingObstacles(esc3, esc4, obstacles).length === 0;
          const seg5Clear =
            findBlockingObstacles(esc4, target, obstacles).length === 0;

          debugLog(
            debugLabel,
            `  6-SEG (${label}, ${approachLabel}): escapeY=${escapeY.toFixed(0)}, approachY=${approachY.toFixed(0)}, segs=${seg1Clear},${seg2Clear},${seg3Clear},${seg4Clear},${seg5Clear}`,
          );

          if (seg1Clear && seg2Clear && seg3Clear && seg4Clear && seg5Clear) {
            debugLog(
              debugLabel,
              `  ✓ 6-SEGMENT ROUTING (${label}, ${approachLabel})`,
            );
            return {
              midValue: defaultMid,
              switchOrientation: false,
              useUPath: true,
              uPathPoints: [source, esc1, esc2, esc3, esc4, target],
            };
          }
        }
      }
    }
  } else {
    // For vertical-first: source exits vertically, need to escape that way first
    // U-path: source → (source.x, escapeY) → (target.x, escapeY) → target
    const goingDown = target.y > source.y;

    const escapeY = (goingDown ? allObstacleBounds.bottom + 20 : allObstacleBounds.top - 20) + corridorOffset;

    const waypoint1: Point = { x: source.x, y: escapeY };
    const waypoint2: Point = { x: target.x, y: escapeY };

    const seg1Clear =
      findBlockingObstacles(source, waypoint1, obstacles).length === 0;
    const seg2Clear =
      findBlockingObstacles(waypoint1, waypoint2, obstacles).length === 0;
    const seg3Clear =
      findBlockingObstacles(waypoint2, target, obstacles).length === 0;

    debugLog(
      debugLabel,
      `  U-PATH: escapeY=${escapeY.toFixed(0)}, seg1=${seg1Clear}, seg2=${seg2Clear}, seg3=${seg3Clear}`,
    );

    if (seg1Clear && seg2Clear && seg3Clear) {
      debugLog(
        debugLabel,
        `  ✓ U-PATH ROUTING via escapeY=${escapeY.toFixed(0)}`,
      );
      return {
        midValue: defaultMid,
        switchOrientation: false,
        useUPath: true,
        uPathPoints: [source, waypoint1, waypoint2, target],
      };
    }

    // Try further out
    const farEscapeY = (goingDown ? allObstacleBounds.bottom + 50 : allObstacleBounds.top - 50) + corridorOffset;
    const farWaypoint1: Point = { x: source.x, y: farEscapeY };
    const farWaypoint2: Point = { x: target.x, y: farEscapeY };

    const farSeg1Clear =
      findBlockingObstacles(source, farWaypoint1, obstacles).length === 0;
    const farSeg2Clear =
      findBlockingObstacles(farWaypoint1, farWaypoint2, obstacles).length === 0;
    const farSeg3Clear =
      findBlockingObstacles(farWaypoint2, target, obstacles).length === 0;

    debugLog(
      debugLabel,
      `  U-PATH (far): escapeY=${farEscapeY.toFixed(0)}, seg1=${farSeg1Clear}, seg2=${farSeg2Clear}, seg3=${farSeg3Clear}`,
    );

    if (farSeg1Clear && farSeg2Clear && farSeg3Clear) {
      debugLog(
        debugLabel,
        `  ✓ U-PATH ROUTING (far) via escapeY=${farEscapeY.toFixed(0)}`,
      );
      return {
        midValue: defaultMid,
        switchOrientation: false,
        useUPath: true,
        uPathPoints: [source, farWaypoint1, farWaypoint2, target],
      };
    }

    // Try opposite direction
    const oppositeEscapeY = (goingDown ? allObstacleBounds.top - 50 : allObstacleBounds.bottom + 50) + corridorOffset;
    const oppWaypoint1: Point = { x: source.x, y: oppositeEscapeY };
    const oppWaypoint2: Point = { x: target.x, y: oppositeEscapeY };

    const oppSeg1Clear =
      findBlockingObstacles(source, oppWaypoint1, obstacles).length === 0;
    const oppSeg2Clear =
      findBlockingObstacles(oppWaypoint1, oppWaypoint2, obstacles).length === 0;
    const oppSeg3Clear =
      findBlockingObstacles(oppWaypoint2, target, obstacles).length === 0;

    debugLog(
      debugLabel,
      `  U-PATH (opposite): escapeY=${oppositeEscapeY.toFixed(0)}, seg1=${oppSeg1Clear}, seg2=${oppSeg2Clear}, seg3=${oppSeg3Clear}`,
    );

    if (oppSeg1Clear && oppSeg2Clear && oppSeg3Clear) {
      debugLog(
        debugLabel,
        `  ✓ U-PATH ROUTING (opposite) via escapeY=${oppositeEscapeY.toFixed(0)}`,
      );
      return {
        midValue: defaultMid,
        switchOrientation: false,
        useUPath: true,
        uPathPoints: [source, oppWaypoint1, oppWaypoint2, target],
      };
    }

    // If U-PATH failed because seg1 is blocked, try ESCAPE-FIRST routing for vertical-first
    // 5-segment path: source → (escapeX, source.y) → (escapeX, escapeY) → (target.x, escapeY) → target
    debugLog(debugLabel, `  Trying ESCAPE-FIRST routing (5-segment) for vertical-first...`);

    const immediateBlockers = findBlockingObstacles(
      source,
      { x: source.x, y: goingDown ? allObstacleBounds.bottom + 50 : allObstacleBounds.top - 50 },
      obstacles,
    );

    if (immediateBlockers.length > 0) {
      const blockerBounds = getObstaclesBounds(immediateBlockers);
      debugLog(
        debugLabel,
        `  Immediate blockers: ${immediateBlockers.length}, bounds: left=${blockerBounds.left.toFixed(0)} right=${blockerBounds.right.toFixed(0)}`,
      );

      const escapeDirections = [
        { escapeX: blockerBounds.right + 15, label: "RIGHT" },
        { escapeX: blockerBounds.left - 15, label: "LEFT" },
      ];

      for (const { escapeX, label } of escapeDirections) {
        const esc1: Point = { x: escapeX, y: source.y };
        const esc2: Point = { x: escapeX, y: farEscapeY };
        const esc3: Point = { x: target.x, y: farEscapeY };

        const escSeg1 =
          findBlockingObstacles(source, esc1, obstacles).length === 0;
        const escSeg2 =
          findBlockingObstacles(esc1, esc2, obstacles).length === 0;
        const escSeg3 =
          findBlockingObstacles(esc2, esc3, obstacles).length === 0;
        const escSeg4 =
          findBlockingObstacles(esc3, target, obstacles).length === 0;

        debugLog(
          debugLabel,
          `  ESCAPE-FIRST (${label}): escapeX=${escapeX.toFixed(0)}, escapeY=${farEscapeY.toFixed(0)}, seg1=${escSeg1}, seg2=${escSeg2}, seg3=${escSeg3}, seg4=${escSeg4}`,
        );

        if (escSeg1 && escSeg2 && escSeg3 && escSeg4) {
          debugLog(
            debugLabel,
            `  ✓ ESCAPE-FIRST ROUTING (${label})`,
          );
          return {
            midValue: defaultMid,
            switchOrientation: false,
            useUPath: true,
            uPathPoints: [source, esc1, esc2, esc3, target],
          };
        }
      }

      // Try 6-segment routing with horizontal target approach for vertical-first
      debugLog(debugLabel, `  Trying 6-SEGMENT routing with horizontal target approach...`);

      for (const { escapeX, label } of escapeDirections) {
        const approachOffsets = [
          { approachX: target.x - 50, approachLabel: "from-left" },
          { approachX: target.x + 50, approachLabel: "from-right" },
          { approachX: target.x - 100, approachLabel: "from-left-far" },
          { approachX: target.x + 100, approachLabel: "from-right-far" },
        ];

        for (const { approachX, approachLabel } of approachOffsets) {
          const esc1: Point = { x: escapeX, y: source.y };
          const esc2: Point = { x: escapeX, y: farEscapeY };
          const esc3: Point = { x: approachX, y: farEscapeY };
          const esc4: Point = { x: approachX, y: target.y };

          const seg1Clear =
            findBlockingObstacles(source, esc1, obstacles).length === 0;
          const seg2Clear =
            findBlockingObstacles(esc1, esc2, obstacles).length === 0;
          const seg3Clear =
            findBlockingObstacles(esc2, esc3, obstacles).length === 0;
          const seg4Clear =
            findBlockingObstacles(esc3, esc4, obstacles).length === 0;
          const seg5Clear =
            findBlockingObstacles(esc4, target, obstacles).length === 0;

          debugLog(
            debugLabel,
            `  6-SEG (${label}, ${approachLabel}): escapeX=${escapeX.toFixed(0)}, approachX=${approachX.toFixed(0)}, segs=${seg1Clear},${seg2Clear},${seg3Clear},${seg4Clear},${seg5Clear}`,
          );

          if (seg1Clear && seg2Clear && seg3Clear && seg4Clear && seg5Clear) {
            debugLog(
              debugLabel,
              `  ✓ 6-SEGMENT ROUTING (${label}, ${approachLabel})`,
            );
            return {
              midValue: defaultMid,
              switchOrientation: false,
              useUPath: true,
              uPathPoints: [source, esc1, esc2, esc3, esc4, target],
            };
          }
        }
      }
    }
  }

  debugLog(debugLabel, `  ✗ U-PATH ROUTING failed, trying GAP ROUTING...`);

  // If U-path also didn't work, try GAP ROUTING
  // This finds gaps between obstacles and routes through them with an S-shaped path

  if (isHorizontalFirst) {
    // For horizontal-first: need to escape HORIZONTALLY first, then use a gap
    // Correct path: source → (escapeX, source.y) → (escapeX, gapY) → (target.x, gapY) → target
    const minY = Math.min(source.y, target.y);
    const maxY = Math.max(source.y, target.y);
    const goingRight = target.x > source.x;

    // Find vertical gaps in the corridor
    const gaps = findVerticalGaps(
      obstacles,
      Math.min(source.x, target.x),
      Math.max(source.x, target.x),
      minY - 200,
      maxY + 200,
    );
    debugLog(
      debugLabel,
      `  Found ${gaps.length} vertical gaps:`,
      gaps.map((g) => `[${g.start.toFixed(0)}-${g.end.toFixed(0)}]`),
    );

    // Try each gap with a proper horizontal-first 4-segment path
    for (const gap of gaps) {
      const gapMidY = (gap.start + gap.end) / 2;
      const gapSize = gap.end - gap.start;

      if (gapSize >= 40) {
        // Try routing with an escape X past obstacles
        // Use ALL obstacle bounds to find escape point, add corridorOffset for separation
        const escapeX = (goingRight ? allObstacleBounds.right + 30 : allObstacleBounds.left - 30) + corridorOffset;

        // 4-segment path: source → (escapeX, source.y) → (escapeX, gapY) → (target.x, gapY) → target
        const wp1: Point = { x: escapeX, y: source.y };
        const wp2: Point = { x: escapeX, y: gapMidY };
        const wp3: Point = { x: target.x, y: gapMidY };

        const seg1Clear =
          findBlockingObstacles(source, wp1, obstacles).length === 0;
        const seg2Clear =
          findBlockingObstacles(wp1, wp2, obstacles).length === 0;
        const seg3Clear =
          findBlockingObstacles(wp2, wp3, obstacles).length === 0;
        const seg4Clear =
          findBlockingObstacles(wp3, target, obstacles).length === 0;

        debugLog(
          debugLabel,
          `  Trying gap at Y=${gapMidY.toFixed(0)} with escapeX=${escapeX.toFixed(0)}: seg1=${seg1Clear}, seg2=${seg2Clear}, seg3=${seg3Clear}, seg4=${seg4Clear}`,
        );

        if (seg1Clear && seg2Clear && seg3Clear && seg4Clear) {
          debugLog(
            debugLabel,
            `  ✓ GAP ROUTING (4-seg) at Y=${gapMidY.toFixed(0)}`,
          );
          return {
            midValue: defaultMid,
            switchOrientation: false,
            useUPath: true,
            uPathPoints: [source, wp1, wp2, wp3, target],
          };
        }
      }
    }
  } else {
    // For vertical-first: need to escape VERTICALLY first, then use a gap
    // Correct path: source → (source.x, escapeY) → (gapX, escapeY) → (gapX, target.y) → target
    const minX = Math.min(source.x, target.x);
    const maxX = Math.max(source.x, target.x);
    const goingDown = target.y > source.y;

    const gaps = findHorizontalGaps(
      obstacles,
      Math.min(source.y, target.y),
      Math.max(source.y, target.y),
      minX - 200,
      maxX + 200,
    );
    debugLog(
      debugLabel,
      `  Found ${gaps.length} horizontal gaps:`,
      gaps.map((g) => `[${g.start.toFixed(0)}-${g.end.toFixed(0)}]`),
    );

    for (const gap of gaps) {
      const gapMidX = (gap.start + gap.end) / 2;
      const gapSize = gap.end - gap.start;

      if (gapSize >= 40) {
        // Try routing with an escape Y past obstacles, add corridorOffset for separation
        const escapeY = (goingDown ? allObstacleBounds.bottom + 30 : allObstacleBounds.top - 30) + corridorOffset;

        // 4-segment path: source → (source.x, escapeY) → (gapX, escapeY) → (gapX, target.y) → target
        const wp1: Point = { x: source.x, y: escapeY };
        const wp2: Point = { x: gapMidX, y: escapeY };
        const wp3: Point = { x: gapMidX, y: target.y };

        const seg1Clear =
          findBlockingObstacles(source, wp1, obstacles).length === 0;
        const seg2Clear =
          findBlockingObstacles(wp1, wp2, obstacles).length === 0;
        const seg3Clear =
          findBlockingObstacles(wp2, wp3, obstacles).length === 0;
        const seg4Clear =
          findBlockingObstacles(wp3, target, obstacles).length === 0;

        debugLog(
          debugLabel,
          `  Trying gap at X=${gapMidX.toFixed(0)} with escapeY=${escapeY.toFixed(0)}: seg1=${seg1Clear}, seg2=${seg2Clear}, seg3=${seg3Clear}, seg4=${seg4Clear}`,
        );

        if (seg1Clear && seg2Clear && seg3Clear && seg4Clear) {
          debugLog(
            debugLabel,
            `  ✓ GAP ROUTING (4-seg) at X=${gapMidX.toFixed(0)}`,
          );
          return {
            midValue: defaultMid,
            switchOrientation: false,
            useUPath: true,
            uPathPoints: [source, wp1, wp2, wp3, target],
          };
        }
      }
    }
  }

  // If gap routing also didn't work, try systematic search in original orientation
  const minVal = isHorizontalFirst
    ? Math.min(source.x, target.x)
    : Math.min(source.y, target.y);
  const maxVal = isHorizontalFirst
    ? Math.max(source.x, target.x)
    : Math.max(source.y, target.y);
  debugLog(
    debugLabel,
    `  Systematic search in range [${minVal.toFixed(0)}, ${maxVal.toFixed(0)}]`,
  );

  // Try positions closer to source (shorter first segment)
  for (let offset = 30; offset < 300; offset += 30) {
    const tryNearSource = isHorizontalFirst
      ? source.x + (target.x > source.x ? offset : -offset)
      : source.y + (target.y > source.y ? offset : -offset);

    if (tryNearSource > minVal && tryNearSource < maxVal) {
      if (
        isZPathClear(
          source,
          target,
          tryNearSource,
          isHorizontalFirst,
          obstacles,
        )
      ) {
        debugLog(
          debugLabel,
          `  ✓ Found clear path near source at ${tryNearSource.toFixed(0)}`,
        );
        return { midValue: tryNearSource, switchOrientation: false };
      }
    }
  }

  // Try positions closer to target (shorter last segment)
  for (let offset = 30; offset < 300; offset += 30) {
    const tryNearTarget = isHorizontalFirst
      ? target.x + (source.x > target.x ? offset : -offset)
      : target.y + (source.y > target.y ? offset : -offset);

    if (tryNearTarget > minVal && tryNearTarget < maxVal) {
      if (
        isZPathClear(
          source,
          target,
          tryNearTarget,
          isHorizontalFirst,
          obstacles,
        )
      ) {
        debugLog(
          debugLabel,
          `  ✓ Found clear path near target at ${tryNearTarget.toFixed(0)}`,
        );
        return { midValue: tryNearTarget, switchOrientation: false };
      }
    }
  }

  // Fallback to default if nothing works
  debugLog(
    debugLabel,
    `  ⚠ No clear path found, falling back to default ${defaultMid.toFixed(0)}`,
  );
  return { midValue: defaultMid, switchOrientation: false };
}

/**
 * Generate path for Z-shape routing with proper midpoint
 */
function generateZPath(
  source: Point,
  target: Point,
  midValue: number,
  isHorizontalFirst: boolean,
  obstacles: ObstacleRect[],
  debugLabel?: string,
  corridorOffset: number = 0,
): Point[] {
  debugLog(
    debugLabel,
    `generateZPath: midValue=${midValue.toFixed(0)} isHorizontalFirst=${isHorizontalFirst} corridorOffset=${corridorOffset.toFixed(0)}`,
  );

  // Try to find a better midpoint that avoids obstacles entirely
  const result = findBestMidpoint(
    source,
    target,
    midValue,
    isHorizontalFirst,
    obstacles,
    debugLabel,
    corridorOffset,
  );
  const {
    midValue: optimizedMid,
    switchOrientation,
    useGapRouting,
    gapY,
    gapX,
    useUPath,
    uPathPoints,
  } = result;

  // If U-path routing is enabled, use the pre-computed waypoints
  if (useUPath && uPathPoints) {
    debugLog(
      debugLabel,
      `  Using U-PATH ROUTING with ${uPathPoints.length} waypoints`,
    );
    return uPathPoints;
  }

  // If gap routing is enabled, generate a simple S-shaped path through the gap
  if (useGapRouting) {
    if (gapY !== undefined) {
      // Horizontal connection routing through a Y gap
      // Path: source → down to gap → across → up/down to target
      debugLog(debugLabel, `  Using GAP ROUTING through Y=${gapY.toFixed(0)}`);
      return [
        source,
        { x: source.x, y: gapY },
        { x: target.x, y: gapY },
        target,
      ];
    } else if (gapX !== undefined) {
      // Vertical connection routing through an X gap
      debugLog(debugLabel, `  Using GAP ROUTING through X=${gapX.toFixed(0)}`);
      return [
        source,
        { x: gapX, y: source.y },
        { x: gapX, y: target.y },
        target,
      ];
    }
  }

  // If we need to switch orientation, flip the flag
  const actualHorizontalFirst = switchOrientation
    ? !isHorizontalFirst
    : isHorizontalFirst;
  debugLog(
    debugLabel,
    `  Using optimizedMid=${optimizedMid.toFixed(0)} (was ${midValue.toFixed(0)}), orientation=${actualHorizontalFirst ? "horizontal-first" : "vertical-first"}${switchOrientation ? " (SWITCHED)" : ""}`,
  );
  const waypoints: Point[] = [source];

  if (actualHorizontalFirst) {
    // Z-path: source → (midX, sourceY) → (midX, targetY) → target
    const corner1: Point = { x: optimizedMid, y: source.y };
    const corner2: Point = { x: optimizedMid, y: target.y };
    debugLog(
      debugLabel,
      `  Z-path corners: corner1=(${corner1.x.toFixed(0)},${corner1.y.toFixed(0)}) corner2=(${corner2.x.toFixed(0)},${corner2.y.toFixed(0)})`,
    );

    // Segment 1: source to corner1 (horizontal)
    const seg1Obstacles = findBlockingObstacles(source, corner1, obstacles);
    debugLog(
      debugLabel,
      `  Seg1 (horiz): source→corner1, blocking=${seg1Obstacles.length}`,
      seg1Obstacles.map((o) => o.id),
    );
    if (seg1Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg1Obstacles);
      const preferUp = source.y > (bounds.top + bounds.bottom) / 2;
      const routeY = findClearHorizontalRoute(
        source.x,
        corner1.x,
        source.y,
        bounds,
        obstacles,
        preferUp,
      );

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
    debugLog(
      debugLabel,
      `  Seg2 (vert): corner1→corner2, blocking=${seg2Obstacles.length}`,
      seg2Obstacles.map((o) => o.id),
    );
    if (seg2Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg2Obstacles);
      const preferLeft = corner1.x > (bounds.left + bounds.right) / 2;
      const routeX = findClearVerticalRoute(
        corner1.y,
        corner2.y,
        corner1.x,
        bounds,
        obstacles,
        preferLeft,
      );

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
    debugLog(
      debugLabel,
      `  Seg3 (horiz): corner2→target, blocking=${seg3Obstacles.length}`,
      seg3Obstacles.map((o) => o.id),
    );
    if (seg3Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg3Obstacles);
      const preferUp = corner2.y > (bounds.top + bounds.bottom) / 2;
      const routeY = findClearHorizontalRoute(
        corner2.x,
        target.x,
        corner2.y,
        bounds,
        obstacles,
        preferUp,
      );

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
    const corner1: Point = { x: source.x, y: optimizedMid };
    const corner2: Point = { x: target.x, y: optimizedMid };
    debugLog(
      debugLabel,
      `  Z-path corners: corner1=(${corner1.x.toFixed(0)},${corner1.y.toFixed(0)}) corner2=(${corner2.x.toFixed(0)},${corner2.y.toFixed(0)})`,
    );

    // Segment 1: source to corner1 (vertical)
    const seg1Obstacles = findBlockingObstacles(source, corner1, obstacles);
    debugLog(
      debugLabel,
      `  Seg1 (vert): source→corner1, blocking=${seg1Obstacles.length}`,
      seg1Obstacles.map((o) => o.id),
    );
    if (seg1Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg1Obstacles);
      const preferLeft = source.x > (bounds.left + bounds.right) / 2;
      const routeX = findClearVerticalRoute(
        source.y,
        corner1.y,
        source.x,
        bounds,
        obstacles,
        preferLeft,
      );

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
    debugLog(
      debugLabel,
      `  Seg2 (horiz): corner1→corner2, blocking=${seg2Obstacles.length}`,
      seg2Obstacles.map((o) => o.id),
    );
    if (seg2Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg2Obstacles);
      const preferUp = corner1.y > (bounds.top + bounds.bottom) / 2;
      const routeY = findClearHorizontalRoute(
        corner1.x,
        corner2.x,
        corner1.y,
        bounds,
        obstacles,
        preferUp,
      );

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
    debugLog(
      debugLabel,
      `  Seg3 (vert): corner2→target, blocking=${seg3Obstacles.length}`,
      seg3Obstacles.map((o) => o.id),
    );
    if (seg3Obstacles.length > 0) {
      const bounds = getObstaclesBounds(seg3Obstacles);
      const preferLeft = corner2.x > (bounds.left + bounds.right) / 2;
      const routeX = findClearVerticalRoute(
        corner2.y,
        target.y,
        corner2.x,
        bounds,
        obstacles,
        preferLeft,
      );

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
    const dist = Math.sqrt(
      Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2),
    );
    if (dist < 3) continue;

    // Skip if collinear
    const cross =
      (curr.x - prev.x) * (next.y - prev.y) -
      (curr.y - prev.y) * (next.x - prev.x);
    if (Math.abs(cross) < 1) continue;

    result.push(curr);
  }

  result.push(waypoints[waypoints.length - 1]);
  return result;
}

/**
 * Generate PCB-style path with 45° chamfers
 */
function generateChamferedPath(
  waypoints: Point[],
  chamferSize: number = CHAMFER_SIZE,
): string {
  if (waypoints.length < 2) return "";
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
  obstacles: ObstacleRect[] = [],
  debugLabel?: string,
): { path: string; labelX: number; labelY: number } {
  const sourceSide = sourceHandle?.split("-")[0] || "right";
  const targetSide = targetHandle?.split("-")[0] || "left";

  debugLog(debugLabel, `=== calculatePCBPath ===`);
  debugLog(
    debugLabel,
    `  Source: (${sourceX.toFixed(0)}, ${sourceY.toFixed(0)}) side=${sourceSide}`,
  );
  debugLog(
    debugLabel,
    `  Target: (${targetX.toFixed(0)}, ${targetY.toFixed(0)}) side=${targetSide}`,
  );
  debugLog(debugLabel, `  Obstacles count: ${obstacles.length}`);

  const laneOffset =
    totalLanes > 1 ? (lane - (totalLanes - 1) / 2) * LANE_SPACING : 0;

  // Calculate corridor offset to spread edges across different routing corridors
  const corridorOffset = calculateCorridorOffset(
    lane,
    totalLanes,
    debugLabel,
    sourceX,
    sourceY,
    targetX,
    targetY,
  );

  const source: Point = { x: sourceX, y: sourceY };
  const target: Point = { x: targetX, y: targetY };

  let waypoints: Point[];
  let connectionType: string;

  // Horizontal connections (right-left or left-right)
  if (
    (sourceSide === "right" && targetSide === "left") ||
    (sourceSide === "left" && targetSide === "right")
  ) {
    const midX = (sourceX + targetX) / 2 + laneOffset + corridorOffset;
    connectionType = "HORIZONTAL (right-left)";
    debugLog(
      debugLabel,
      `  Connection type: ${connectionType}, midX=${midX.toFixed(0)}, corridorOffset=${corridorOffset.toFixed(0)}`,
    );
    waypoints = generateZPath(
      source,
      target,
      midX,
      true,
      obstacles,
      debugLabel,
      corridorOffset,
    );
  }
  // Vertical connections (bottom-top or top-bottom)
  else if (
    (sourceSide === "bottom" && targetSide === "top") ||
    (sourceSide === "top" && targetSide === "bottom")
  ) {
    const midY = (sourceY + targetY) / 2 + laneOffset + corridorOffset;
    connectionType = "VERTICAL (bottom-top)";
    debugLog(
      debugLabel,
      `  Connection type: ${connectionType}, midY=${midY.toFixed(0)}, corridorOffset=${corridorOffset.toFixed(0)}`,
    );
    waypoints = generateZPath(
      source,
      target,
      midY,
      false,
      obstacles,
      debugLabel,
      corridorOffset,
    );
  }
  // L-shaped connections
  else if (sourceSide === "right" || sourceSide === "left") {
    connectionType = "L-SHAPE (horizontal first)";
    debugLog(debugLabel, `  Connection type: ${connectionType}, corridorOffset=${corridorOffset.toFixed(0)}`);
    waypoints = generateZPath(
      source,
      target,
      target.x + laneOffset + corridorOffset,
      true,
      obstacles,
      debugLabel,
      corridorOffset,
    );
  } else {
    connectionType = "L-SHAPE (vertical first)";
    debugLog(debugLabel, `  Connection type: ${connectionType}, corridorOffset=${corridorOffset.toFixed(0)}`);
    waypoints = generateZPath(
      source,
      target,
      target.y + laneOffset + corridorOffset,
      false,
      obstacles,
      debugLabel,
      corridorOffset,
    );
  }

  debugLog(
    debugLabel,
    `  Final waypoints: ${waypoints.length}`,
    waypoints.map((p) => `(${p.x.toFixed(0)},${p.y.toFixed(0)})`),
  );

  waypoints = cleanupWaypoints(waypoints);
  const path = generateChamferedPath(waypoints, CHAMFER_SIZE);

  // Smart label positioning to reduce overlaps
  const { labelX, labelY } = calculateSmartLabelPosition(
    waypoints,
    lane,
    totalLanes,
    sourceX,
    sourceY,
    debugLabel,
  );

  return { path, labelX, labelY };
}

/**
 * Calculate a unique corridor offset for an edge based on its characteristics
 * This helps spread edges across different routing corridors to prevent overlap
 */
const CORRIDOR_SPREAD = 15; // Pixels between different routing corridors

function calculateCorridorOffset(
  lane: number,
  totalLanes: number,
  debugLabel?: string,
  sourceX?: number,
  sourceY?: number,
  targetX?: number,
  targetY?: number,
): number {
  // For multi-lane edges, use lane-based offset
  if (totalLanes > 1) {
    return (lane - (totalLanes - 1) / 2) * CORRIDOR_SPREAD;
  }

  // For single-lane edges, calculate hash-based offset
  let hash = 0;
  if (debugLabel) {
    for (let i = 0; i < debugLabel.length; i++) {
      hash = ((hash << 5) - hash) + debugLabel.charCodeAt(i);
      hash |= 0;
    }
  }
  // Add position info for more uniqueness
  if (sourceX !== undefined) hash ^= Math.floor(sourceX * 7);
  if (sourceY !== undefined) hash ^= Math.floor(sourceY * 11);
  if (targetX !== undefined) hash ^= Math.floor(targetX * 13);
  if (targetY !== undefined) hash ^= Math.floor(targetY * 17);

  // Convert to offset in range [-2, 2] * CORRIDOR_SPREAD (5 possible corridors)
  const offsetIndex = ((hash % 5) + 5) % 5 - 2;
  return offsetIndex * CORRIDOR_SPREAD;
}

/**
 * Calculate smart label position to reduce overlaps
 * - Prefers middle segments over first/last (away from connection points)
 * - Uses lane offset to spread labels along the path
 * - Adds perpendicular offset for multi-lane edges
 * - Keeps labels away from segment endpoints
 */
function calculateSmartLabelPosition(
  waypoints: Point[],
  lane: number,
  totalLanes: number,
  fallbackX: number,
  fallbackY: number,
  debugLabel?: string,
): { labelX: number; labelY: number } {
  if (waypoints.length < 2) {
    return { labelX: fallbackX, labelY: fallbackY };
  }

  // Find all segments with their lengths and whether they're near endpoints
  const segments: {
    index: number;
    length: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isHorizontal: boolean;
    isFirstSegment: boolean;
    isLastSegment: boolean;
    priority: number; // Higher = better for label placement
  }[] = [];

  const totalSegments = waypoints.length - 1;

  for (let i = 0; i < totalSegments; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Only consider segments long enough for a label (at least 80px for good spacing)
    if (length >= 80) {
      const isFirst = i === 0;
      const isLast = i === totalSegments - 1;

      // Calculate priority: prefer middle segments, longer segments
      // Middle segments get +10, longer segments get up to +5
      let priority = length / 100; // Base priority from length
      if (!isFirst && !isLast) {
        priority += 10; // Strong preference for middle segments
      }
      // Slight preference for segments in the middle of the path
      const distFromMiddle = Math.abs(i - totalSegments / 2) / totalSegments;
      priority += (1 - distFromMiddle) * 3;

      segments.push({
        index: i,
        length,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        isHorizontal: Math.abs(dx) > Math.abs(dy),
        isFirstSegment: isFirst,
        isLastSegment: isLast,
        priority,
      });
    }
  }

  // If no suitable segments found, try with smaller minimum length
  if (segments.length === 0) {
    for (let i = 0; i < totalSegments; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length >= 40) {
        const isFirst = i === 0;
        const isLast = i === totalSegments - 1;

        segments.push({
          index: i,
          length,
          startX: start.x,
          startY: start.y,
          endX: end.x,
          endY: end.y,
          isHorizontal: Math.abs(dx) > Math.abs(dy),
          isFirstSegment: isFirst,
          isLastSegment: isLast,
          priority: isFirst || isLast ? 0 : 5,
        });
      }
    }
  }

  // If still no suitable segments, fall back to middle of path
  if (segments.length === 0) {
    const midIndex = Math.floor(waypoints.length / 2);
    return {
      labelX: (waypoints[Math.max(0, midIndex - 1)].x + waypoints[midIndex].x) / 2,
      labelY: (waypoints[Math.max(0, midIndex - 1)].y + waypoints[midIndex].y) / 2,
    };
  }

  // Sort segments by priority (highest first)
  segments.sort((a, b) => b.priority - a.priority);

  // Pick segment based on label hash, but prefer higher priority segments
  let segmentIndex = 0;
  if (debugLabel && segments.length > 1) {
    let hash = 0;
    for (let i = 0; i < debugLabel.length; i++) {
      hash = ((hash << 5) - hash) + debugLabel.charCodeAt(i);
      hash |= 0;
    }
    // Only consider top half of segments (higher priority)
    const topSegments = Math.max(1, Math.ceil(segments.length / 2));
    segmentIndex = Math.abs(hash) % topSegments;
  }

  // If there are multiple segments and multiple lanes, spread across segments
  if (segments.length > 1 && totalLanes > 1) {
    const topSegments = Math.max(1, Math.ceil(segments.length / 2));
    segmentIndex = (segmentIndex + lane) % topSegments;
  }

  const segment = segments[segmentIndex];

  // Calculate position along the segment
  // Keep labels away from endpoints - use 35% to 65% range
  // For first/last segments, push even more towards the middle
  let minT = 0.35;
  let maxT = 0.65;

  if (segment.isFirstSegment) {
    // For first segment, push label towards the end (away from source)
    minT = 0.5;
    maxT = 0.75;
  } else if (segment.isLastSegment) {
    // For last segment, push label towards the start (away from target)
    minT = 0.25;
    maxT = 0.5;
  }

  let t = (minT + maxT) / 2; // Default to middle of allowed range

  if (totalLanes > 1) {
    // Spread within the allowed range based on lane
    t = minT + (lane / Math.max(1, totalLanes - 1)) * (maxT - minT);
  } else if (debugLabel) {
    // For single lane, use hash to vary position within allowed range
    let hash = 0;
    for (let i = 0; i < debugLabel.length; i++) {
      hash = ((hash << 3) - hash) + debugLabel.charCodeAt(i);
      hash |= 0;
    }
    t = minT + (Math.abs(hash) % 100) / 100 * (maxT - minT);
  }

  let labelX = segment.startX + (segment.endX - segment.startX) * t;
  let labelY = segment.startY + (segment.endY - segment.startY) * t;

  // Add small perpendicular offset for multi-lane edges to prevent exact overlaps
  if (totalLanes > 1) {
    const perpOffset = (lane - (totalLanes - 1) / 2) * 12;
    if (segment.isHorizontal) {
      labelY += perpOffset;
    } else {
      labelX += perpOffset;
    }
  }

  return { labelX, labelY };
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

  const edgeLabel = typeof label === "string" ? label : undefined;

  const { path, labelX, labelY } = calculatePCBPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceHandleId,
    targetHandleId,
    lane,
    totalLanes,
    obstacles,
    edgeLabel,
  );

  const defaultColor = "#06b6d4";
  const selectedColor = "#22d3ee";

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isSelected ? 3 : (style.strokeWidth as number) || 2,
          stroke: isSelected
            ? selectedColor
            : (style.stroke as string) || defaultColor,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                background: (labelBgStyle?.fill as string) || "#0f172a",
                padding: labelBgPadding
                  ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px`
                  : "4px 8px",
                borderRadius: labelBgBorderRadius || 4,
                fontSize: (labelStyle?.fontSize as number) || 12,
                fontWeight: (labelStyle?.fontWeight as number) || 600,
                color: (labelStyle?.fill as string) || "#06b6d4",
                boxShadow: "0 0 10px rgba(6, 182, 212, 0.3)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
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
