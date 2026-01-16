import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import type { NodeProps } from 'reactflow';
import type { ServiceNodeData } from '../../types/architecture';
import { useThemeStore } from '../../store/useThemeStore';

const CustomNode = ({ data, selected }: NodeProps<ServiceNodeData>) => {
  const { service, label } = data;
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Check for badges
  const hasFreeTier = service.costModel?.freeTierAvailable;
  const isFullyManaged = service.managedLevel === 'fully';

  // Create subtle gradient based on service color and theme
  const gradientStyle = {
    background: isDark
      ? `linear-gradient(145deg, #1e293b 0%, ${service.color}20 100%)`
      : `linear-gradient(145deg, white 0%, ${service.color}10 100%)`,
    borderColor: service.color,
    boxShadow: selected
      ? `0 20px 25px -5px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'}), 0 8px 10px -6px rgba(0, 0, 0, ${isDark ? '0.2' : '0.1'}), 0 0 0 2px ${service.color}40`
      : `0 10px 15px -3px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'}), 0 4px 6px -4px rgba(0, 0, 0, ${isDark ? '0.2' : '0.1'})`,
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-xl min-w-40 max-w-50
        border-2 transition-all duration-200 ease-out
        hover:-translate-y-1 hover:shadow-xl
        ${selected ? 'scale-105 ring-2 ring-blue-400/50' : ''}
      `}
      style={gradientStyle}
    >
      {/* Connection handles on all 4 sides for flexible layouts */}
      {/* Top handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="w-3 h-3 transition-all hover:scale-150"
        style={{ background: service.color }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="w-3 h-3 transition-all hover:scale-150"
        style={{ background: service.color }}
      />

      {/* Left handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 transition-all hover:scale-150"
        style={{ background: service.color }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="w-3 h-3 transition-all hover:scale-150"
        style={{ background: service.color }}
      />

      {/* Right handles */}
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className="w-3 h-3 transition-all hover:scale-150"
        style={{ background: service.color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 transition-all hover:scale-150"
        style={{ background: service.color }}
      />

      <div className="flex flex-col gap-2">
        {/* Category Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: service.color }}
            />
            <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {service.category}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1">
            {hasFreeTier && (
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-full ${isDark ? 'bg-green-900/50 border-green-700' : 'bg-green-100 border-green-300'} border`}
                title="Free Tier Available"
              >
                <DollarSign className={`w-3 h-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            )}
            {isFullyManaged && (
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-full ${isDark ? 'bg-blue-900/50 border-blue-700' : 'bg-blue-100 border-blue-300'} border`}
                title="Fully Managed"
              >
                <CheckCircle2 className={`w-3 h-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            )}
          </div>
        </div>

        {/* Service Name */}
        <div className={`font-semibold text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          {label || service.shortName}
        </div>

        {/* Provider */}
        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {service.provider}
        </div>
      </div>

      {/* Bottom handles */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 transition-all hover:scale-150"
        style={{ background: service.color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="w-3 h-3 transition-all hover:scale-150"
        style={{ background: service.color }}
      />
    </div>
  );
};

export default memo(CustomNode);
