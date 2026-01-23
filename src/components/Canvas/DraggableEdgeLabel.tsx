import { useState, useCallback, useEffect, useRef } from 'react';
import { EdgeLabelRenderer, useReactFlow } from 'reactflow';
import type { Point } from '../../utils/pathUtils';

interface DraggableEdgeLabelProps {
  edgeId: string;
  label: React.ReactNode;
  labelX: number;
  labelY: number;
  labelStyle?: React.CSSProperties & { fill?: string };
  labelBgStyle?: React.CSSProperties & { fill?: string };
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  // Custom border and shadow for themed edges (like PCB)
  customBorder?: string;
  customBoxShadow?: string;
  // Function to find closest point on path given a screen position
  findClosestPoint: (screenX: number, screenY: number) => { t: number; x: number; y: number };
}

export function DraggableEdgeLabel({
  edgeId,
  label,
  labelX,
  labelY,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  customBorder,
  customBoxShadow,
  findClosestPoint,
}: DraggableEdgeLabelProps) {
  const { setEdges, getViewport } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Point | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      // Get the React Flow viewport for coordinate transformation
      const viewport = getViewport();

      // Get the canvas container
      const canvasElement = document.querySelector('.react-flow');
      if (!canvasElement) return;

      const rect = canvasElement.getBoundingClientRect();

      // Convert screen coordinates to flow coordinates
      const flowX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const flowY = (e.clientY - rect.top - viewport.y) / viewport.zoom;

      // Find closest point on path
      const closest = findClosestPoint(flowX, flowY);
      setCurrentPosition({ x: closest.x, y: closest.y });

      // Update edge data with new position
      setEdges((edges) =>
        edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  labelPosition: closest.t,
                },
              }
            : edge
        )
      );
    },
    [isDragging, edgeId, setEdges, findClosestPoint, getViewport]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setCurrentPosition(null);
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

  // Use current drag position or calculated position
  const displayX = currentPosition?.x ?? labelX;
  const displayY = currentPosition?.y ?? labelY;

  return (
    <EdgeLabelRenderer>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${displayX}px,${displayY}px)`,
          pointerEvents: 'all',
        }}
        className="nodrag nopan"
      >
        <div
          onMouseDown={handleMouseDown}
          style={{
            background: (labelBgStyle?.fill as string) || '#ffffff',
            padding: labelBgPadding
              ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px`
              : '4px 8px',
            borderRadius: labelBgBorderRadius || 4,
            fontSize: (labelStyle?.fontSize as number) || 12,
            fontWeight: (labelStyle?.fontWeight as number) || 600,
            color: (labelStyle?.fill as string) || '#1e293b',
            border: customBorder,
            boxShadow: isDragging
              ? '0 4px 12px rgba(0,0,0,0.3)'
              : customBoxShadow || '0 1px 3px rgba(0,0,0,0.1)',
            cursor: isDragging ? 'grabbing' : 'grab',
            transform: isDragging ? 'scale(1.05)' : 'scale(1)',
            transition: isDragging ? 'none' : 'transform 0.15s, box-shadow 0.15s',
            userSelect: 'none',
          }}
        >
          {label}
        </div>
      </div>
    </EdgeLabelRenderer>
  );
}

export default DraggableEdgeLabel;
