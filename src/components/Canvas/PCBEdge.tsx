import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { useArchitectureStore } from '../../store/useArchitectureStore';

export interface PCBEdgeData {
  lane?: number;
  totalLanes?: number;
}

const LANE_SPACING = 18; // Pixels between parallel lanes
const CHAMFER_SIZE = 15; // Size of 45° chamfer corners

/**
 * Calculate PCB-style path with 45° angle chamfered corners
 * Creates a clean, technical look similar to printed circuit board traces
 */
function calculatePCBPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
  lane: number = 0,
  totalLanes: number = 1
): { path: string; labelX: number; labelY: number } {
  const sourceSide = sourceHandle?.split('-')[0] || 'right';
  const targetSide = targetHandle?.split('-')[0] || 'left';

  // Calculate lane offset
  const laneOffset = totalLanes > 1
    ? (lane - (totalLanes - 1) / 2) * LANE_SPACING
    : 0;

  // Determine actual direction of travel
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const goingRight = dx > 0;
  const goingDown = dy > 0;

  let path: string;
  let labelX: number;
  let labelY: number;

  // Calculate chamfer size based on available space
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const c = Math.min(CHAMFER_SIZE, absX / 4, absY / 4, 12);

  // Horizontal connections (right-left or left-right)
  if ((sourceSide === 'right' && targetSide === 'left') ||
      (sourceSide === 'left' && targetSide === 'right')) {
    const midX = (sourceX + targetX) / 2 + laneOffset;

    if (absY < 10) {
      // Nearly horizontal - create a small bump for visual interest
      const bumpHeight = 20 + Math.abs(laneOffset);
      const bumpDir = lane % 2 === 0 ? -1 : 1; // Alternate bump direction by lane

      if (goingRight) {
        path = `M ${sourceX} ${sourceY}
                L ${midX - c} ${sourceY}
                L ${midX} ${sourceY + bumpDir * c}
                L ${midX} ${sourceY + bumpDir * (bumpHeight - c)}
                L ${midX + c} ${sourceY + bumpDir * bumpHeight}
                L ${midX + c} ${sourceY + bumpDir * bumpHeight}
                L ${midX} ${sourceY + bumpDir * (bumpHeight - c)}
                L ${midX} ${sourceY + bumpDir * c}
                L ${midX + c} ${sourceY}
                L ${targetX} ${targetY}`;
      } else {
        path = `M ${sourceX} ${sourceY}
                L ${midX + c} ${sourceY}
                L ${midX} ${sourceY + bumpDir * c}
                L ${midX} ${sourceY + bumpDir * (bumpHeight - c)}
                L ${midX - c} ${sourceY + bumpDir * bumpHeight}
                L ${midX - c} ${sourceY + bumpDir * bumpHeight}
                L ${midX} ${sourceY + bumpDir * (bumpHeight - c)}
                L ${midX} ${sourceY + bumpDir * c}
                L ${midX - c} ${sourceY}
                L ${targetX} ${targetY}`;
      }
      labelX = midX;
      labelY = sourceY + bumpDir * bumpHeight / 2;
    } else {
      // Standard Z-path with chamfered corners
      if (goingRight) {
        if (goingDown) {
          // Right and down
          path = `M ${sourceX} ${sourceY}
                  L ${midX - c} ${sourceY}
                  L ${midX} ${sourceY + c}
                  L ${midX} ${targetY - c}
                  L ${midX + c} ${targetY}
                  L ${targetX} ${targetY}`;
        } else {
          // Right and up
          path = `M ${sourceX} ${sourceY}
                  L ${midX - c} ${sourceY}
                  L ${midX} ${sourceY - c}
                  L ${midX} ${targetY + c}
                  L ${midX + c} ${targetY}
                  L ${targetX} ${targetY}`;
        }
      } else {
        if (goingDown) {
          // Left and down
          path = `M ${sourceX} ${sourceY}
                  L ${midX + c} ${sourceY}
                  L ${midX} ${sourceY + c}
                  L ${midX} ${targetY - c}
                  L ${midX - c} ${targetY}
                  L ${targetX} ${targetY}`;
        } else {
          // Left and up
          path = `M ${sourceX} ${sourceY}
                  L ${midX + c} ${sourceY}
                  L ${midX} ${sourceY - c}
                  L ${midX} ${targetY + c}
                  L ${midX - c} ${targetY}
                  L ${targetX} ${targetY}`;
        }
      }
      labelX = midX;
      labelY = (sourceY + targetY) / 2;
    }
  }
  // Vertical connections (bottom-top or top-bottom)
  else if ((sourceSide === 'bottom' && targetSide === 'top') ||
           (sourceSide === 'top' && targetSide === 'bottom')) {
    const midY = (sourceY + targetY) / 2 + laneOffset;

    if (absX < 10) {
      // Nearly vertical - create a small bump
      const bumpWidth = 20 + Math.abs(laneOffset);
      const bumpDir = lane % 2 === 0 ? 1 : -1;

      if (goingDown) {
        path = `M ${sourceX} ${sourceY}
                L ${sourceX} ${midY - c}
                L ${sourceX + bumpDir * c} ${midY}
                L ${sourceX + bumpDir * (bumpWidth - c)} ${midY}
                L ${sourceX + bumpDir * bumpWidth} ${midY + c}
                L ${sourceX + bumpDir * bumpWidth} ${midY - c}
                L ${sourceX + bumpDir * (bumpWidth - c)} ${midY}
                L ${sourceX + bumpDir * c} ${midY}
                L ${sourceX} ${midY + c}
                L ${targetX} ${targetY}`;
      } else {
        path = `M ${sourceX} ${sourceY}
                L ${sourceX} ${midY + c}
                L ${sourceX + bumpDir * c} ${midY}
                L ${sourceX + bumpDir * (bumpWidth - c)} ${midY}
                L ${sourceX + bumpDir * bumpWidth} ${midY - c}
                L ${sourceX + bumpDir * bumpWidth} ${midY + c}
                L ${sourceX + bumpDir * (bumpWidth - c)} ${midY}
                L ${sourceX + bumpDir * c} ${midY}
                L ${sourceX} ${midY - c}
                L ${targetX} ${targetY}`;
      }
      labelX = sourceX + bumpDir * bumpWidth / 2;
      labelY = midY;
    } else {
      // Standard Z-path
      if (goingDown) {
        if (goingRight) {
          // Down and right
          path = `M ${sourceX} ${sourceY}
                  L ${sourceX} ${midY - c}
                  L ${sourceX + c} ${midY}
                  L ${targetX - c} ${midY}
                  L ${targetX} ${midY + c}
                  L ${targetX} ${targetY}`;
        } else {
          // Down and left
          path = `M ${sourceX} ${sourceY}
                  L ${sourceX} ${midY - c}
                  L ${sourceX - c} ${midY}
                  L ${targetX + c} ${midY}
                  L ${targetX} ${midY + c}
                  L ${targetX} ${targetY}`;
        }
      } else {
        if (goingRight) {
          // Up and right
          path = `M ${sourceX} ${sourceY}
                  L ${sourceX} ${midY + c}
                  L ${sourceX + c} ${midY}
                  L ${targetX - c} ${midY}
                  L ${targetX} ${midY - c}
                  L ${targetX} ${targetY}`;
        } else {
          // Up and left
          path = `M ${sourceX} ${sourceY}
                  L ${sourceX} ${midY + c}
                  L ${sourceX - c} ${midY}
                  L ${targetX + c} ${midY}
                  L ${targetX} ${midY - c}
                  L ${targetX} ${targetY}`;
        }
      }
      labelX = (sourceX + targetX) / 2;
      labelY = midY;
    }
  }
  // Diagonal connections - L-shaped paths with chamfers
  else {
    // Calculate turn point based on source and target sides
    let turnX: number;
    let turnY: number;

    // Determine the turn point based on which sides we're connecting
    if (sourceSide === 'right' || sourceSide === 'left') {
      // Source is horizontal, so we go horizontal first, then vertical
      turnX = targetX;
      turnY = sourceY;
    } else {
      // Source is vertical, so we go vertical first, then horizontal
      turnX = sourceX;
      turnY = targetY;
    }

    // Add lane offset
    if (sourceSide === 'right' || sourceSide === 'left') {
      turnY += laneOffset;
    } else {
      turnX += laneOffset;
    }

    // Calculate chamfer for the corner
    const cornerC = Math.min(c, Math.abs(turnX - sourceX) / 3, Math.abs(turnY - sourceY) / 3,
                              Math.abs(targetX - turnX) / 3, Math.abs(targetY - turnY) / 3);

    // Determine corner direction
    const hDir = turnX > sourceX ? 1 : -1; // Horizontal direction from source
    const vDir = turnY > sourceY ? 1 : -1; // Vertical direction from source
    const hDir2 = targetX > turnX ? 1 : -1; // Horizontal direction to target
    const vDir2 = targetY > turnY ? 1 : -1; // Vertical direction to target

    if (sourceSide === 'right' || sourceSide === 'left') {
      // Horizontal first, then vertical
      path = `M ${sourceX} ${sourceY}
              L ${turnX - hDir * cornerC} ${sourceY}
              L ${turnX} ${sourceY + vDir2 * cornerC}
              L ${turnX} ${targetY - vDir2 * cornerC}
              L ${turnX + hDir2 * cornerC} ${targetY}
              L ${targetX} ${targetY}`;
    } else {
      // Vertical first, then horizontal
      path = `M ${sourceX} ${sourceY}
              L ${sourceX} ${turnY - vDir * cornerC}
              L ${sourceX + hDir2 * cornerC} ${turnY}
              L ${targetX - hDir2 * cornerC} ${turnY}
              L ${targetX} ${turnY + vDir2 * cornerC}
              L ${targetX} ${targetY}`;
    }

    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  }

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

  const { path, labelX, labelY } = calculatePCBPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceHandleId,
    targetHandleId,
    lane,
    totalLanes
  );

  // PCB-style coloring - cyan/teal for that electronic look
  const defaultColor = '#06b6d4'; // Cyan-500
  const selectedColor = '#22d3ee'; // Cyan-400

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
