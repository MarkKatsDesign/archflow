import { useViewport } from "reactflow";
import type { AlignmentGuide } from "../../hooks/useAlignmentGuides";

interface AlignmentGuidesProps {
  guides: AlignmentGuide[];
}

export default function AlignmentGuides({ guides }: AlignmentGuidesProps) {
  const { x, y, zoom } = useViewport();

  if (guides.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-1000 h-full w-full overflow-visible"
    >
      <defs>
        {/* Gradient for vertical guide lines */}
        <linearGradient id="guideGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="10%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="90%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        {/* Gradient for horizontal guide lines */}
        <linearGradient id="guideGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="10%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="90%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {guides.map((guide, index) => {
          if (guide.type === "vertical") {
            return (
              <line
                key={`v-${index}-${guide.position}`}
                x1={guide.position}
                y1={guide.start}
                x2={guide.position}
                y2={guide.end}
                stroke="url(#guideGradientV)"
                strokeWidth={1.5 / zoom}
                strokeDasharray={`${4 / zoom} ${2 / zoom}`}
              />
            );
          } else {
            return (
              <line
                key={`h-${index}-${guide.position}`}
                x1={guide.start}
                y1={guide.position}
                x2={guide.end}
                y2={guide.position}
                stroke="url(#guideGradientH)"
                strokeWidth={1.5 / zoom}
                strokeDasharray={`${4 / zoom} ${2 / zoom}`}
              />
            );
          }
        })}
      </g>
    </svg>
  );
}
