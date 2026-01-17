import { memo } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { NodeProps } from "reactflow";
import type { GroupNodeData } from "../../types/architecture";

function GroupNode({ data, selected }: NodeProps<GroupNodeData>) {
  const { zone, label } = data;

  return (
    <>
      {/* Resizer handles - only visible when selected */}
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: 3,
          backgroundColor: "white",
          border: `2px solid ${zone.color}`,
        }}
        lineStyle={{
          borderColor: zone.color,
          borderWidth: 2,
        }}
      />

      {/* Main container */}
      <div
        className="relative h-full w-full rounded-lg transition-shadow"
        style={{
          backgroundColor: zone.backgroundColor,
          border: `2px ${zone.borderStyle} ${zone.color}`,
          boxShadow: selected
            ? `0 0 0 2px ${zone.color}40, 0 4px 12px rgba(0,0,0,0.1)`
            : "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* Clickable frame - 4 edge strips that capture clicks for selecting/dragging the group */}
        {/* Top edge */}
        <div className="absolute top-0 left-0 right-0 h-6 group-clickable cursor-move" />
        {/* Bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-3 group-clickable cursor-move" />
        {/* Left edge */}
        <div className="absolute top-0 bottom-0 left-0 w-3 group-clickable cursor-move" />
        {/* Right edge */}
        <div className="absolute top-0 bottom-0 right-0 w-3 group-clickable cursor-move" />

        {/* Zone label at top-left - clickable */}
        <div
          className="absolute -top-3 left-3 px-2 py-0.5 rounded text-xs font-semibold shadow-sm group-clickable cursor-move"
          style={{
            backgroundColor: zone.color,
            color: "white",
          }}
        >
          {label || zone.shortName}
        </div>

        {/* Provider badge at top-right - clickable */}
        <div className="absolute top-2 right-2 group-clickable">
          <span
            className="px-1.5 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${zone.color}20`,
              color: zone.color,
            }}
          >
            {zone.provider}
          </span>
        </div>

        {/* Connection handles on all sides */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="w-3! h-3! border-2! border-white! transition-transform hover:scale-125"
          style={{ background: zone.color }}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-source"
          className="w-3! h-3! border-2! border-white! transition-transform hover:scale-125"
          style={{ background: zone.color, left: "60%" }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          className="w-3! h-3! border-2! border-white! transition-transform hover:scale-125"
          style={{ background: zone.color }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-source"
          className="w-3! h-3! border-2! border-white! transition-transform hover:scale-125"
          style={{ background: zone.color, left: "60%" }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="w-3! h-3! border-2! border-white! transition-transform hover:scale-125"
          style={{ background: zone.color }}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-source"
          className="w-3! h-3! border-2! border-white! transition-transform hover:scale-125"
          style={{ background: zone.color, top: "60%" }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          className="w-3! h-3! border-2! border-white! transition-transform hover:scale-125"
          style={{ background: zone.color }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right-source"
          className="w-3! h-3! border-2! border-white! transition-transform hover:scale-125"
          style={{ background: zone.color, top: "60%" }}
        />
      </div>
    </>
  );
}

export default memo(GroupNode);
