import { memo, useState } from "react";
import { Handle, Position } from "reactflow";
import { DollarSign, CheckCircle2 } from "lucide-react";
import type { NodeProps } from "reactflow";
import type { ServiceNodeData } from "../../types/architecture";
import { useThemeStore } from "../../store/useThemeStore";

// Number of handles per side for organic edge distribution
// More handles = finer granularity for positioning
const HANDLES_PER_SIDE = 10;

// Generate handle positions as percentages
// For 10 handles: ~9%, 18%, 27%, ... 91% (avoiding edges)
const getHandleOffsets = (count: number): number[] => {
  const offsets: number[] = [];
  for (let i = 1; i <= count; i++) {
    offsets.push((i / (count + 1)) * 100);
  }
  return offsets;
};

const handleOffsets = getHandleOffsets(HANDLES_PER_SIDE);

const CustomNode = ({ data, selected }: NodeProps<ServiceNodeData>) => {
  const { service, label } = data;
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [isHovered, setIsHovered] = useState(false);

  // Check for badges
  const hasFreeTier = service.costModel?.freeTierAvailable;
  const isFullyManaged = service.managedLevel === "fully";

  // Determine shadow based on state: selected > hovered > default
  const getBoxShadow = () => {
    if (selected) {
      return isDark
        // Dark mode selected: prominent shadow + strong colored glow + ring
        ? `0 20px 40px -8px rgba(0, 0, 0, 0.5),
           0 8px 16px -4px rgba(0, 0, 0, 0.4),
           0 0 20px 2px ${service.color}40,
           0 0 0 2px ${service.color}60`
        // Light mode selected: softer shadow + colored glow + ring
        : `0 20px 40px -8px rgba(0, 0, 0, 0.15),
           0 8px 16px -4px rgba(0, 0, 0, 0.1),
           0 0 20px 2px ${service.color}30,
           0 0 0 2px ${service.color}50`;
    }
    if (isHovered) {
      return isDark
        // Dark mode hover: enhanced shadow + stronger colored glow
        ? `0 12px 32px -4px rgba(0, 0, 0, 0.5),
           0 6px 12px -2px rgba(0, 0, 0, 0.4),
           0 0 16px 1px ${service.color}35`
        // Light mode hover: lifted shadow + colored glow
        : `0 8px 24px -4px rgba(0, 0, 0, 0.12),
           0 4px 10px -2px rgba(0, 0, 0, 0.08),
           0 0 12px 1px ${service.color}25`;
    }
    // Default state
    return isDark
      // Dark mode default: visible shadow + subtle colored glow
      ? `0 8px 24px -4px rgba(0, 0, 0, 0.5),
         0 4px 8px -2px rgba(0, 0, 0, 0.4),
         0 0 12px 0px ${service.color}20`
      // Light mode default: clean shadow + hint of color
      : `0 4px 16px -2px rgba(0, 0, 0, 0.1),
         0 2px 6px -1px rgba(0, 0, 0, 0.08),
         0 0 8px 0px ${service.color}15`;
  };

  // Create subtle gradient based on service color and theme
  // Enhanced shadows with colored glow for better visibility
  const gradientStyle = {
    background: isDark
      ? `linear-gradient(145deg, #1e293b 0%, ${service.color}15 100%)`
      : `linear-gradient(160deg, white 0%, ${service.color}08 100%)`,
    borderColor: service.color,
    boxShadow: getBoxShadow(),
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-xl min-w-40 max-w-50
        border-2 transition-all duration-200 ease-out
        hover:border-opacity-80
        ${selected ? "scale-105 ring-2 ring-blue-400/50" : ""}
      `}
      style={gradientStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Multiple connection handles on each side for edge distribution */}
      {/* IMPORTANT: Target handles must render FIRST so source handles are on top */}
      {/* This allows drag-to-connect to work correctly (source → target) */}

      {/* Top handles - target first, then source on top */}
      {handleOffsets.map((offset, idx) => (
        <Handle
          key={`top-target-${idx}`}
          type="target"
          position={Position.Top}
          id={`top-t-${idx}`}
          className="w-2! h-2! transition-all hover:scale-150! opacity-40! hover:opacity-100! border-0!"
          style={{
            background: service.color,
            left: `${offset}%`,
          }}
        />
      ))}
      {handleOffsets.map((offset, idx) => (
        <Handle
          key={`top-source-${idx}`}
          type="source"
          position={Position.Top}
          id={`top-s-${idx}`}
          className="w-2! h-2! transition-all hover:scale-150! opacity-40! hover:opacity-100! border-0!"
          style={{
            background: service.color,
            left: `${offset}%`,
          }}
        />
      ))}

      {/* Left handles - target first, then source on top */}
      {handleOffsets.map((offset, idx) => (
        <Handle
          key={`left-target-${idx}`}
          type="target"
          position={Position.Left}
          id={`left-t-${idx}`}
          className="w-2! h-2! transition-all hover:scale-150! opacity-40! hover:opacity-100! border-0!"
          style={{
            background: service.color,
            top: `${offset}%`,
          }}
        />
      ))}
      {handleOffsets.map((offset, idx) => (
        <Handle
          key={`left-source-${idx}`}
          type="source"
          position={Position.Left}
          id={`left-s-${idx}`}
          className="w-2! h-2! transition-all hover:scale-150! opacity-40! hover:opacity-100! border-0!"
          style={{
            background: service.color,
            top: `${offset}%`,
          }}
        />
      ))}

      {/* Right handles - target first, then source on top */}
      {handleOffsets.map((offset, idx) => (
        <Handle
          key={`right-target-${idx}`}
          type="target"
          position={Position.Right}
          id={`right-t-${idx}`}
          className="w-2! h-2! transition-all hover:scale-150! opacity-40! hover:opacity-100! border-0!"
          style={{
            background: service.color,
            top: `${offset}%`,
          }}
        />
      ))}
      {handleOffsets.map((offset, idx) => (
        <Handle
          key={`right-source-${idx}`}
          type="source"
          position={Position.Right}
          id={`right-s-${idx}`}
          className="w-2! h-2! transition-all hover:scale-150! opacity-40! hover:opacity-100! border-0!"
          style={{
            background: service.color,
            top: `${offset}%`,
          }}
        />
      ))}

      <div className="flex flex-col gap-2">
        {/* Category Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: service.color }}
            />
            <div
              className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              {service.category}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1">
            {hasFreeTier && (
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-full ${isDark ? "bg-green-900/50 border-green-700" : "bg-green-100 border-green-300"} border`}
                title="Free Tier Available"
              >
                <DollarSign
                  className={`w-3 h-3 ${isDark ? "text-green-400" : "text-green-600"}`}
                />
              </div>
            )}
            {isFullyManaged && (
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-full ${isDark ? "bg-blue-900/50 border-blue-700" : "bg-blue-100 border-blue-300"} border`}
                title="Fully Managed"
              >
                <CheckCircle2
                  className={`w-3 h-3 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Service Name */}
        <div
          className={`font-semibold text-sm ${isDark ? "text-gray-100" : "text-gray-800"}`}
        >
          {label || service.shortName}
        </div>

        {/* Provider */}
        <div
          className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {service.provider}
        </div>
      </div>

      {/* Bottom handles - target first, then source on top */}
      {handleOffsets.map((offset, idx) => (
        <Handle
          key={`bottom-target-${idx}`}
          type="target"
          position={Position.Bottom}
          id={`bottom-t-${idx}`}
          className="w-2! h-2! transition-all hover:scale-150! opacity-40! hover:opacity-100! border-0!"
          style={{
            background: service.color,
            left: `${offset}%`,
          }}
        />
      ))}
      {handleOffsets.map((offset, idx) => (
        <Handle
          key={`bottom-source-${idx}`}
          type="source"
          position={Position.Bottom}
          id={`bottom-s-${idx}`}
          className="w-2! h-2! transition-all hover:scale-150! opacity-40! hover:opacity-100! border-0!"
          style={{
            background: service.color,
            left: `${offset}%`,
          }}
        />
      ))}
    </div>
  );
};

export default memo(CustomNode);
