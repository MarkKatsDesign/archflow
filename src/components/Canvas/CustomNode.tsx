import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { ServiceNodeData } from '../../types/architecture';

const CustomNode = ({ data, selected }: NodeProps<ServiceNodeData>) => {
  const { service, label } = data;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-lg min-w-[160px] max-w-[200px]
        border-2 transition-all duration-200
        ${selected ? 'shadow-xl ring-2 ring-blue-400' : 'shadow-md'}
      `}
      style={{
        borderColor: service.color,
        backgroundColor: 'white',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3"
        style={{ background: service.color }}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: service.color }}
          />
          <div className="text-xs text-gray-500 font-medium">
            {service.category}
          </div>
        </div>

        <div className="font-semibold text-sm text-gray-800">
          {label || service.shortName}
        </div>

        <div className="text-xs text-gray-600">
          {service.provider}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3"
        style={{ background: service.color }}
      />
    </div>
  );
};

export default memo(CustomNode);
