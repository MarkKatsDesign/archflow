import { useCallback, useState, useRef, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from 'reactflow';
import { useArchitectureStore } from '../../store/useArchitectureStore';

export interface ControlPoint {
  x: number;
  y: number;
}

export interface EditableBezierEdgeData {
  controlPoints?: {
    source: ControlPoint;
    target: ControlPoint;
  };
}

export function EditableBezierEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  data,
  selected,
}: EdgeProps<EditableBezierEdgeData>) {
  const { setEdges } = useReactFlow();
  const { selectedEdgeId } = useArchitectureStore();
  const isSelected = selected || id === selectedEdgeId;

  const [isDragging, setIsDragging] = useState<'source' | 'target' | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const initialControlPoint = useRef<ControlPoint | null>(null);

  // Calculate default control points based on source/target positions
  const getDefaultControlPoints = useCallback(() => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const curvature = 0.5;

    // Default bezier control points (similar to React Flow's default)
    let sourceControlX = sourceX;
    let sourceControlY = sourceY;
    let targetControlX = targetX;
    let targetControlY = targetY;

    if (sourcePosition === 'left' || sourcePosition === 'right') {
      sourceControlX = sourceX + dx * curvature;
      targetControlX = targetX - dx * curvature;
    } else {
      sourceControlY = sourceY + dy * curvature;
      targetControlY = targetY - dy * curvature;
    }

    return {
      source: { x: sourceControlX, y: sourceControlY },
      target: { x: targetControlX, y: targetControlY },
    };
  }, [sourceX, sourceY, targetX, targetY, sourcePosition]);

  // Use custom control points from data, or fall back to defaults
  const controlPoints = data?.controlPoints || getDefaultControlPoints();

  // Build the bezier path manually with custom control points
  const path = `M ${sourceX},${sourceY} C ${controlPoints.source.x},${controlPoints.source.y} ${controlPoints.target.x},${controlPoints.target.y} ${targetX},${targetY}`;

  // Calculate midpoint for label positioning
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Handle control point drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: 'source' | 'target') => {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(type);
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      initialControlPoint.current = type === 'source' ? controlPoints.source : controlPoints.target;
    },
    [controlPoints]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStartPos.current || !initialControlPoint.current) return;

      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;

      const newControlPoint = {
        x: initialControlPoint.current.x + dx,
        y: initialControlPoint.current.y + dy,
      };

      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id === id) {
            const currentControlPoints = (edge.data as EditableBezierEdgeData)?.controlPoints ||
              getDefaultControlPoints();

            return {
              ...edge,
              data: {
                ...edge.data,
                controlPoints: {
                  ...currentControlPoints,
                  [isDragging]: newControlPoint,
                },
              },
            };
          }
          return edge;
        })
      );
    },
    [isDragging, id, setEdges, getDefaultControlPoints]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    dragStartPos.current = null;
    initialControlPoint.current = null;
  }, []);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset control points to default
  const handleResetControlPoints = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: {
                ...edge.data,
                controlPoints: undefined,
              },
            };
          }
          return edge;
        })
      );
    },
    [id, setEdges]
  );

  return (
    <>
      <BaseEdge
        path={data?.controlPoints ? path : edgePath}
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
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Control Point Handles - Only show when selected */}
      {isSelected && (
        <EdgeLabelRenderer>
          {/* Source Control Point */}
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${controlPoints.source.x}px,${controlPoints.source.y}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {/* Line from source to control point */}
            <svg
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              <line
                x1={0}
                y1={0}
                x2={sourceX - controlPoints.source.x}
                y2={sourceY - controlPoints.source.y}
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            </svg>
            <div
              onMouseDown={(e) => handleMouseDown(e, 'source')}
              className={`w-4 h-4 rounded-full border-2 cursor-move transition-all ${
                isDragging === 'source'
                  ? 'bg-blue-600 border-blue-700 scale-125'
                  : 'bg-blue-500 border-blue-600 hover:scale-110'
              }`}
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
              title="Drag to adjust curve (source control point)"
            />
          </div>

          {/* Target Control Point */}
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${controlPoints.target.x}px,${controlPoints.target.y}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {/* Line from target to control point */}
            <svg
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              <line
                x1={0}
                y1={0}
                x2={targetX - controlPoints.target.x}
                y2={targetY - controlPoints.target.y}
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            </svg>
            <div
              onMouseDown={(e) => handleMouseDown(e, 'target')}
              className={`w-4 h-4 rounded-full border-2 cursor-move transition-all ${
                isDragging === 'target'
                  ? 'bg-purple-600 border-purple-700 scale-125'
                  : 'bg-purple-500 border-purple-600 hover:scale-110'
              }`}
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
              title="Drag to adjust curve (target control point)"
            />
          </div>

          {/* Reset Button */}
          {data?.controlPoints && (
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 25}px)`,
                pointerEvents: 'all',
              }}
              className="nodrag nopan"
            >
              <button
                onClick={handleResetControlPoints}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors border border-gray-300 dark:border-slate-600"
              >
                Reset Curve
              </button>
            </div>
          )}
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default EditableBezierEdge;
