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
  currentY: number,
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
  currentX: number,
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
  isHorizontalFirst: boolean,
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
}

function findBestMidpoint(
  source: Point,
  target: Point,
  defaultMid: number,
  isHorizontalFirst: boolean,
  obstacles: ObstacleRect[],
  debugLabel?: string,
): MidpointResult {
  debugLog(
    debugLabel,
    `findBestMidpoint: source=(${source.x.toFixed(0)},${source.y.toFixed(0)}) target=(${target.x.toFixed(0)},${target.y.toFixed(0)}) defaultMid=${defaultMid.toFixed(0)} isHorizontalFirst=${isHorizontalFirst}`,
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

  // If switched orientation also didn't work, try GAP ROUTING
  // This finds gaps between obstacles and routes through them with an S-shaped path
  debugLog(debugLabel, `  Trying GAP ROUTING...`);

  if (isHorizontalFirst) {
    // For horizontal-first: find a Y gap to route through
    // We need to go: source.y → gapY → target.y
    const minY = Math.min(source.y, target.y);
    const maxY = Math.max(source.y, target.y);
    const minX = Math.min(source.x, target.x);
    const maxX = Math.max(source.x, target.x);

    // Find vertical gaps in the corridor between source and target
    const gaps = findVerticalGaps(
      obstacles,
      minX,
      maxX,
      minY - 200,
      maxY + 200,
    );
    debugLog(
      debugLabel,
      `  Found ${gaps.length} vertical gaps:`,
      gaps.map((g) => `[${g.start.toFixed(0)}-${g.end.toFixed(0)}]`),
    );

    // Find a gap that's BETWEEN source.y and target.y (or nearby)
    for (const gap of gaps) {
      const gapMidY = (gap.start + gap.end) / 2;
      const gapSize = gap.end - gap.start;

      // Only use gaps that are big enough and between source and target Y levels
      if (gapSize >= 40) {
        // Check if routing through this gap would work
        // For horizontal-first with gap: source → (source.x, gapY) → (target.x, gapY) → target
        const waypoint1: Point = { x: source.x, y: gapMidY };
        const waypoint2: Point = { x: target.x, y: gapMidY };

        const seg1Clear =
          findBlockingObstacles(source, waypoint1, obstacles).length === 0;
        const seg2Clear =
          findBlockingObstacles(waypoint1, waypoint2, obstacles).length === 0;
        const seg3Clear =
          findBlockingObstacles(waypoint2, target, obstacles).length === 0;

        debugLog(
          debugLabel,
          `  Trying gap at Y=${gapMidY.toFixed(0)} (size=${gapSize.toFixed(0)}): seg1=${seg1Clear}, seg2=${seg2Clear}, seg3=${seg3Clear}`,
        );

        if (seg1Clear && seg2Clear && seg3Clear) {
          debugLog(debugLabel, `  ✓ GAP ROUTING at Y=${gapMidY.toFixed(0)}`);
          return {
            midValue: defaultMid,
            switchOrientation: false,
            useGapRouting: true,
            gapY: gapMidY,
          };
        }
      }
    }
  } else {
    // For vertical-first: find an X gap to route through
    const minX = Math.min(source.x, target.x);
    const maxX = Math.max(source.x, target.x);
    const minY = Math.min(source.y, target.y);
    const maxY = Math.max(source.y, target.y);

    const gaps = findHorizontalGaps(
      obstacles,
      minY,
      maxY,
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
        const waypoint1: Point = { x: gapMidX, y: source.y };
        const waypoint2: Point = { x: gapMidX, y: target.y };

        const seg1Clear =
          findBlockingObstacles(source, waypoint1, obstacles).length === 0;
        const seg2Clear =
          findBlockingObstacles(waypoint1, waypoint2, obstacles).length === 0;
        const seg3Clear =
          findBlockingObstacles(waypoint2, target, obstacles).length === 0;

        debugLog(
          debugLabel,
          `  Trying gap at X=${gapMidX.toFixed(0)} (size=${gapSize.toFixed(0)}): seg1=${seg1Clear}, seg2=${seg2Clear}, seg3=${seg3Clear}`,
        );

        if (seg1Clear && seg2Clear && seg3Clear) {
          debugLog(debugLabel, `  ✓ GAP ROUTING at X=${gapMidX.toFixed(0)}`);
          return {
            midValue: defaultMid,
            switchOrientation: false,
            useGapRouting: true,
            gapX: gapMidX,
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
): Point[] {
  debugLog(
    debugLabel,
    `generateZPath: midValue=${midValue.toFixed(0)} isHorizontalFirst=${isHorizontalFirst}`,
  );

  // Try to find a better midpoint that avoids obstacles entirely
  const result = findBestMidpoint(
    source,
    target,
    midValue,
    isHorizontalFirst,
    obstacles,
    debugLabel,
  );
  const {
    midValue: optimizedMid,
    switchOrientation,
    useGapRouting,
    gapY,
    gapX,
  } = result;

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

  const source: Point = { x: sourceX, y: sourceY };
  const target: Point = { x: targetX, y: targetY };

  let waypoints: Point[];
  let connectionType: string;

  // Horizontal connections (right-left or left-right)
  if (
    (sourceSide === "right" && targetSide === "left") ||
    (sourceSide === "left" && targetSide === "right")
  ) {
    const midX = (sourceX + targetX) / 2 + laneOffset;
    connectionType = "HORIZONTAL (right-left)";
    debugLog(
      debugLabel,
      `  Connection type: ${connectionType}, midX=${midX.toFixed(0)}`,
    );
    waypoints = generateZPath(
      source,
      target,
      midX,
      true,
      obstacles,
      debugLabel,
    );
  }
  // Vertical connections (bottom-top or top-bottom)
  else if (
    (sourceSide === "bottom" && targetSide === "top") ||
    (sourceSide === "top" && targetSide === "bottom")
  ) {
    const midY = (sourceY + targetY) / 2 + laneOffset;
    connectionType = "VERTICAL (bottom-top)";
    debugLog(
      debugLabel,
      `  Connection type: ${connectionType}, midY=${midY.toFixed(0)}`,
    );
    waypoints = generateZPath(
      source,
      target,
      midY,
      false,
      obstacles,
      debugLabel,
    );
  }
  // L-shaped connections
  else if (sourceSide === "right" || sourceSide === "left") {
    connectionType = "L-SHAPE (horizontal first)";
    debugLog(debugLabel, `  Connection type: ${connectionType}`);
    waypoints = generateZPath(
      source,
      target,
      target.x + laneOffset,
      true,
      obstacles,
      debugLabel,
    );
  } else {
    connectionType = "L-SHAPE (vertical first)";
    debugLog(debugLabel, `  Connection type: ${connectionType}`);
    waypoints = generateZPath(
      source,
      target,
      target.y + laneOffset,
      false,
      obstacles,
      debugLabel,
    );
  }

  debugLog(
    debugLabel,
    `  Final waypoints: ${waypoints.length}`,
    waypoints.map((p) => `(${p.x.toFixed(0)},${p.y.toFixed(0)})`),
  );

  waypoints = cleanupWaypoints(waypoints);
  const path = generateChamferedPath(waypoints, CHAMFER_SIZE);

  const midIndex = Math.floor(waypoints.length / 2);
  const labelX =
    waypoints.length >= 2
      ? (waypoints[Math.max(0, midIndex - 1)].x + waypoints[midIndex].x) / 2
      : sourceX;
  const labelY =
    waypoints.length >= 2
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
