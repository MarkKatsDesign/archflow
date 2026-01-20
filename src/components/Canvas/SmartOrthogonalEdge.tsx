import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { useArchitectureStore } from '../../store/useArchitectureStore';

export interface SmartOrthogonalEdgeData {
  lane?: number; // Lane offset for parallel edges (0 = center, positive/negative = offset)
  totalLanes?: number; // Total number of lanes in this group
}

const LANE_SPACING = 20; // Pixels between parallel lanes (increased for better visibility)
const MIN_SEGMENT_LENGTH = 40; // Minimum length before turning (increased for clearer orthogonal appearance)
const MIN_OFFSET = 25; // Minimum offset from straight line to ensure orthogonal appearance

/**
 * Calculate orthogonal path with lane offset
 * The path goes: source → perpendicular segment → middle segment (with lane offset) → perpendicular segment → target
 * ALWAYS creates a stepped/Z-shaped path to be visually distinct from bezier/smooth step
 */
function calculateOrthogonalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
  lane: number = 0,
  totalLanes: number = 1
): { path: string; labelX: number; labelY: number } {
  // Determine source and target sides from handles
  const sourceSide = sourceHandle?.split('-')[0] || 'right';
  const targetSide = targetHandle?.split('-')[0] || 'left';

  // Calculate lane offset (center lanes around 0)
  // Even single lanes get a slight offset for visual distinction
  const baseLaneOffset = totalLanes > 1
    ? (lane - (totalLanes - 1) / 2) * LANE_SPACING
    : 0;

  let path: string;
  let labelX: number;
  let labelY: number;

  // Calculate the lane offset, ensuring a minimum offset for visual distinction
  const laneOffset = baseLaneOffset;

  // Calculate path based on source/target sides
  if ((sourceSide === 'right' && targetSide === 'left') ||
      (sourceSide === 'left' && targetSide === 'right')) {
    // Horizontal connection (most common)
    const midX = (sourceX + targetX) / 2;
    const offsetMidX = midX + laneOffset;

    // Check if source and target are at similar Y positions
    const yDiff = Math.abs(sourceY - targetY);

    if (yDiff < 10) {
      // Nodes are horizontally aligned - create a stepped path to avoid straight line
      // This makes it visually distinct from bezier edges
      const stepOffset = MIN_OFFSET + Math.abs(laneOffset);
      const stepY = sourceY - stepOffset; // Go above by default

      path = `M ${sourceX} ${sourceY}
              L ${offsetMidX} ${sourceY}
              L ${offsetMidX} ${stepY}
              L ${offsetMidX} ${targetY}
              L ${targetX} ${targetY}`;
      labelX = offsetMidX;
      labelY = stepY;
    } else {
      path = `M ${sourceX} ${sourceY}
              L ${offsetMidX} ${sourceY}
              L ${offsetMidX} ${targetY}
              L ${targetX} ${targetY}`;
      labelX = offsetMidX;
      labelY = (sourceY + targetY) / 2;
    }
  }
  else if ((sourceSide === 'bottom' && targetSide === 'top') ||
           (sourceSide === 'top' && targetSide === 'bottom')) {
    // Vertical connection
    const midY = (sourceY + targetY) / 2;
    const offsetMidY = midY + laneOffset;

    // Check if source and target are at similar X positions
    const xDiff = Math.abs(sourceX - targetX);

    if (xDiff < 10) {
      // Nodes are vertically aligned - create a stepped path
      const stepOffset = MIN_OFFSET + Math.abs(laneOffset);
      const stepX = sourceX + stepOffset; // Go right by default

      path = `M ${sourceX} ${sourceY}
              L ${sourceX} ${offsetMidY}
              L ${stepX} ${offsetMidY}
              L ${targetX} ${offsetMidY}
              L ${targetX} ${targetY}`;
      labelX = stepX;
      labelY = offsetMidY;
    } else {
      path = `M ${sourceX} ${sourceY}
              L ${sourceX} ${offsetMidY}
              L ${targetX} ${offsetMidY}
              L ${targetX} ${targetY}`;
      labelX = (sourceX + targetX) / 2;
      labelY = offsetMidY;
    }
  }
  else if (sourceSide === 'right' && targetSide === 'top') {
    // Right to top - go right then up
    const turnX = Math.max(sourceX + MIN_SEGMENT_LENGTH, targetX) + laneOffset;
    const turnY = Math.min(sourceY, targetY - MIN_SEGMENT_LENGTH) + laneOffset;

    path = `M ${sourceX} ${sourceY}
            L ${turnX} ${sourceY}
            L ${turnX} ${turnY}
            L ${targetX} ${turnY}
            L ${targetX} ${targetY}`;
    labelX = turnX;
    labelY = (sourceY + turnY) / 2;
  }
  else if (sourceSide === 'right' && targetSide === 'bottom') {
    // Right to bottom - go right then down
    const turnX = Math.max(sourceX + MIN_SEGMENT_LENGTH, targetX) + laneOffset;
    const turnY = Math.max(sourceY, targetY + MIN_SEGMENT_LENGTH) - laneOffset;

    path = `M ${sourceX} ${sourceY}
            L ${turnX} ${sourceY}
            L ${turnX} ${turnY}
            L ${targetX} ${turnY}
            L ${targetX} ${targetY}`;
    labelX = turnX;
    labelY = (sourceY + turnY) / 2;
  }
  else if (sourceSide === 'left' && targetSide === 'top') {
    // Left to top
    const turnX = Math.min(sourceX - MIN_SEGMENT_LENGTH, targetX) - laneOffset;
    const turnY = Math.min(sourceY, targetY - MIN_SEGMENT_LENGTH) + laneOffset;

    path = `M ${sourceX} ${sourceY}
            L ${turnX} ${sourceY}
            L ${turnX} ${turnY}
            L ${targetX} ${turnY}
            L ${targetX} ${targetY}`;
    labelX = turnX;
    labelY = (sourceY + turnY) / 2;
  }
  else if (sourceSide === 'left' && targetSide === 'bottom') {
    // Left to bottom
    const turnX = Math.min(sourceX - MIN_SEGMENT_LENGTH, targetX) - laneOffset;
    const turnY = Math.max(sourceY, targetY + MIN_SEGMENT_LENGTH) - laneOffset;

    path = `M ${sourceX} ${sourceY}
            L ${turnX} ${sourceY}
            L ${turnX} ${turnY}
            L ${targetX} ${turnY}
            L ${targetX} ${targetY}`;
    labelX = turnX;
    labelY = (sourceY + turnY) / 2;
  }
  else if (sourceSide === 'bottom' && targetSide === 'left') {
    // Bottom to left
    const turnY = Math.max(sourceY + MIN_SEGMENT_LENGTH, targetY) + laneOffset;
    const turnX = Math.min(sourceX, targetX - MIN_SEGMENT_LENGTH) - laneOffset;

    path = `M ${sourceX} ${sourceY}
            L ${sourceX} ${turnY}
            L ${turnX} ${turnY}
            L ${turnX} ${targetY}
            L ${targetX} ${targetY}`;
    labelX = (sourceX + turnX) / 2;
    labelY = turnY;
  }
  else if (sourceSide === 'bottom' && targetSide === 'right') {
    // Bottom to right
    const turnY = Math.max(sourceY + MIN_SEGMENT_LENGTH, targetY) + laneOffset;
    const turnX = Math.max(sourceX, targetX + MIN_SEGMENT_LENGTH) + laneOffset;

    path = `M ${sourceX} ${sourceY}
            L ${sourceX} ${turnY}
            L ${turnX} ${turnY}
            L ${turnX} ${targetY}
            L ${targetX} ${targetY}`;
    labelX = (sourceX + turnX) / 2;
    labelY = turnY;
  }
  else if (sourceSide === 'top' && targetSide === 'left') {
    // Top to left
    const turnY = Math.min(sourceY - MIN_SEGMENT_LENGTH, targetY) - laneOffset;
    const turnX = Math.min(sourceX, targetX - MIN_SEGMENT_LENGTH) - laneOffset;

    path = `M ${sourceX} ${sourceY}
            L ${sourceX} ${turnY}
            L ${turnX} ${turnY}
            L ${turnX} ${targetY}
            L ${targetX} ${targetY}`;
    labelX = (sourceX + turnX) / 2;
    labelY = turnY;
  }
  else if (sourceSide === 'top' && targetSide === 'right') {
    // Top to right
    const turnY = Math.min(sourceY - MIN_SEGMENT_LENGTH, targetY) - laneOffset;
    const turnX = Math.max(sourceX, targetX + MIN_SEGMENT_LENGTH) + laneOffset;

    path = `M ${sourceX} ${sourceY}
            L ${sourceX} ${turnY}
            L ${turnX} ${turnY}
            L ${turnX} ${targetY}
            L ${targetX} ${targetY}`;
    labelX = (sourceX + turnX) / 2;
    labelY = turnY;
  }
  // Same side connections (U-shaped)
  else if (sourceSide === 'right' && targetSide === 'right') {
    const extendX = Math.max(sourceX, targetX) + MIN_SEGMENT_LENGTH + Math.abs(laneOffset);
    path = `M ${sourceX} ${sourceY}
            L ${extendX} ${sourceY}
            L ${extendX} ${targetY}
            L ${targetX} ${targetY}`;
    labelX = extendX;
    labelY = (sourceY + targetY) / 2;
  }
  else if (sourceSide === 'left' && targetSide === 'left') {
    const extendX = Math.min(sourceX, targetX) - MIN_SEGMENT_LENGTH - Math.abs(laneOffset);
    path = `M ${sourceX} ${sourceY}
            L ${extendX} ${sourceY}
            L ${extendX} ${targetY}
            L ${targetX} ${targetY}`;
    labelX = extendX;
    labelY = (sourceY + targetY) / 2;
  }
  else if (sourceSide === 'top' && targetSide === 'top') {
    const extendY = Math.min(sourceY, targetY) - MIN_SEGMENT_LENGTH - Math.abs(laneOffset);
    path = `M ${sourceX} ${sourceY}
            L ${sourceX} ${extendY}
            L ${targetX} ${extendY}
            L ${targetX} ${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = extendY;
  }
  else if (sourceSide === 'bottom' && targetSide === 'bottom') {
    const extendY = Math.max(sourceY, targetY) + MIN_SEGMENT_LENGTH + Math.abs(laneOffset);
    path = `M ${sourceX} ${sourceY}
            L ${sourceX} ${extendY}
            L ${targetX} ${extendY}
            L ${targetX} ${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = extendY;
  }
  else {
    // Fallback: simple L-shaped path
    const midX = (sourceX + targetX) / 2 + laneOffset;
    path = `M ${sourceX} ${sourceY}
            L ${midX} ${sourceY}
            L ${midX} ${targetY}
            L ${targetX} ${targetY}`;
    labelX = midX;
    labelY = (sourceY + targetY) / 2;
  }

  return { path, labelX, labelY };
}

function SmartOrthogonalEdge({
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
}: EdgeProps<SmartOrthogonalEdgeData>) {
  const { selectedEdgeId } = useArchitectureStore();
  const isSelected = selected || id === selectedEdgeId;

  const lane = data?.lane ?? 0;
  const totalLanes = data?.totalLanes ?? 1;

  const { path, labelX, labelY } = calculateOrthogonalPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceHandleId,
    targetHandleId,
    lane,
    totalLanes
  );

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isSelected ? 3 : (style.strokeWidth as number) || 2,
          stroke: isSelected ? '#3b82f6' : (style.stroke as string) || '#64748b',
        }}
      />

      {/* Label */}
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
                background: (labelBgStyle?.fill as string) || '#ffffff',
                padding: labelBgPadding ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px` : '4px 8px',
                borderRadius: labelBgBorderRadius || 4,
                fontSize: (labelStyle?.fontSize as number) || 12,
                fontWeight: (labelStyle?.fontWeight as number) || 600,
                color: (labelStyle?.fill as string) || '#1e293b',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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

export default memo(SmartOrthogonalEdge);
