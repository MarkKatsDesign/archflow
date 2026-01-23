/**
 * Path interpolation utilities for edge label positioning
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Linear interpolation between two points
 */
export function lerp(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

/**
 * Get point at position t (0-1) along a cubic Bezier curve
 * p0 = start, p1 = control1, p2 = control2, p3 = end
 */
export function getPointOnBezier(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * Calculate total length of a polyline
 */
export function calculatePolylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distance(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Get point at position t (0-1) along a polyline (array of points)
 */
export function getPointOnPolyline(t: number, points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const totalLength = calculatePolylineLength(points);
  if (totalLength === 0) return points[0];

  const targetLength = t * totalLength;

  let accumulated = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const segmentLength = distance(points[i], points[i + 1]);
    if (accumulated + segmentLength >= targetLength) {
      const segmentT =
        segmentLength > 0 ? (targetLength - accumulated) / segmentLength : 0;
      return lerp(points[i], points[i + 1], segmentT);
    }
    accumulated += segmentLength;
  }

  return points[points.length - 1];
}

/**
 * Find closest t value on polyline to a given point
 * Returns the t value (0-1) and the closest point on the path
 */
export function findClosestPointOnPolyline(
  point: Point,
  points: Point[]
): { t: number; x: number; y: number } {
  if (points.length === 0) return { t: 0, x: 0, y: 0 };
  if (points.length === 1) return { t: 0, x: points[0].x, y: points[0].y };

  const totalLength = calculatePolylineLength(points);
  if (totalLength === 0) return { t: 0, x: points[0].x, y: points[0].y };

  let minDist = Infinity;
  let bestT = 0;
  let bestPoint = points[0];
  let accumulated = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const segmentLength = distance(points[i], points[i + 1]);

    // Find closest point on this segment
    const closest = closestPointOnSegment(point, points[i], points[i + 1]);
    const dist = distance(point, closest.point);

    if (dist < minDist) {
      minDist = dist;
      bestPoint = closest.point;
      // Calculate global t based on position within this segment
      const segmentStartT = accumulated / totalLength;
      const segmentEndT = (accumulated + segmentLength) / totalLength;
      bestT = segmentStartT + closest.t * (segmentEndT - segmentStartT);
    }

    accumulated += segmentLength;
  }

  return { t: bestT, x: bestPoint.x, y: bestPoint.y };
}

/**
 * Find closest point on a line segment
 */
function closestPointOnSegment(
  point: Point,
  segStart: Point,
  segEnd: Point
): { point: Point; t: number } {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return { point: segStart, t: 0 };
  }

  // Project point onto line, clamped to segment
  let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  return {
    point: {
      x: segStart.x + t * dx,
      y: segStart.y + t * dy,
    },
    t,
  };
}

/**
 * Find closest t value on a Bezier curve to a given point
 * Uses sampling approach for simplicity
 */
export function findClosestPointOnBezier(
  point: Point,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  samples: number = 50
): { t: number; x: number; y: number } {
  let minDist = Infinity;
  let bestT = 0.5;
  let bestPoint = getPointOnBezier(0.5, p0, p1, p2, p3);

  // Sample the curve
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const curvePoint = getPointOnBezier(t, p0, p1, p2, p3);
    const dist = distance(point, curvePoint);

    if (dist < minDist) {
      minDist = dist;
      bestT = t;
      bestPoint = curvePoint;
    }
  }

  // Refine with binary search around best t
  let low = Math.max(0, bestT - 1 / samples);
  let high = Math.min(1, bestT + 1 / samples);

  for (let i = 0; i < 10; i++) {
    const mid = (low + high) / 2;
    const leftT = (low + mid) / 2;
    const rightT = (mid + high) / 2;

    const leftPoint = getPointOnBezier(leftT, p0, p1, p2, p3);
    const rightPoint = getPointOnBezier(rightT, p0, p1, p2, p3);

    if (distance(point, leftPoint) < distance(point, rightPoint)) {
      high = mid;
    } else {
      low = mid;
    }
  }

  bestT = (low + high) / 2;
  bestPoint = getPointOnBezier(bestT, p0, p1, p2, p3);

  return { t: bestT, x: bestPoint.x, y: bestPoint.y };
}

/**
 * Parse an SVG path string into an array of points
 * Handles M (move) and L (line) commands
 */
export function parsePathToPoints(pathString: string): Point[] {
  const points: Point[] = [];
  const commands = pathString.match(/[ML]\s*-?[\d.]+\s*-?[\d.]+/gi) || [];

  for (const cmd of commands) {
    const parts = cmd.trim().split(/[\s,]+/);
    if (parts.length >= 3) {
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);
      if (!isNaN(x) && !isNaN(y)) {
        points.push({ x, y });
      }
    }
  }

  return points;
}
