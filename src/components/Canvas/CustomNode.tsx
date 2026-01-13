import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import type { NodeProps } from 'reactflow';
import type { ServiceNodeData } from '../../types/architecture';

const CustomNode = ({ data, selected }: NodeProps<ServiceNodeData>) => {
  const { service, label } = data;

  // Check for badges
  const hasFreeTier = service.costModel?.freeTierAvailable;
  const isFullyManaged = service.managedLevel === 'fully';

  // Create subtle gradient based on service color
  const gradientStyle = {
    background: `linear-gradient(135deg, white 0%, ${service.color}08 100%)`,
    borderColor: service.color,
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg min-w-40 max-w-50
        border-2 transition-all duration-300
        hover:scale-105 hover:shadow-2xl
        ${selected ? 'shadow-2xl ring-2 ring-blue-400 scale-105' : 'shadow-lg'}
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
            <div className="text-xs text-gray-500 font-medium">
              {service.category}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1">
            {hasFreeTier && (
              <div
                className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 border border-green-300"
                title="Free Tier Available"
              >
                <DollarSign className="w-3 h-3 text-green-600" />
              </div>
            )}
            {isFullyManaged && (
              <div
                className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-300"
                title="Fully Managed"
              >
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
              </div>
            )}
          </div>
        </div>

        {/* Service Name */}
        <div className="font-semibold text-sm text-gray-800">
          {label || service.shortName}
        </div>

        {/* Provider */}
        <div className="text-xs text-gray-600">
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
