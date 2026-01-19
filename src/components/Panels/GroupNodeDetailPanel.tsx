import { useState } from "react";
import { X, Pencil, Check, Trash2 } from "lucide-react";
import { useArchitectureStore } from "../../store/useArchitectureStore";
import { isGroupNode } from "../../types/architecture";
import type { BoundaryZone } from "../../types/infrastructure";

export function GroupNodeDetailPanel() {
  const { nodes, selectedNodeId, setSelectedNodeId, updateNodeLabel, deleteNode } =
    useArchitectureStore();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState("");
  const [prevNodeId, setPrevNodeId] = useState<string | null | undefined>(null);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  // Reset editing state when selected node changes (during render, not in effect)
  if (selectedNodeId !== prevNodeId) {
    setPrevNodeId(selectedNodeId);
    setIsEditingLabel(false);
    setEditedLabel(selectedNode?.data?.label || "");
  }

  // Only show panel for group nodes
  if (!selectedNode || !isGroupNode(selectedNode)) {
    return null;
  }

  const zone: BoundaryZone | undefined = selectedNode.data?.zone;

  if (!zone) {
    return null;
  }

  const currentLabel = selectedNode.data?.label || zone.shortName;

  const handleSaveLabel = () => {
    if (editedLabel.trim()) {
      updateNodeLabel(selectedNode.id, editedLabel.trim());
    }
    setIsEditingLabel(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveLabel();
    } else if (e.key === "Escape") {
      setEditedLabel(currentLabel);
      setIsEditingLabel(false);
    }
  };

  const handleDelete = () => {
    deleteNode(selectedNode.id);
  };

  // Count children inside this group
  const childCount = nodes.filter((n) => n.parentNode === selectedNode.id).length;

  return (
    <div className="absolute top-4 right-4 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col z-10 animate-slide-in-right">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between shrink-0"
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: zone.color,
          background: `linear-gradient(to right, ${zone.color}10, transparent)`,
        }}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {zone.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Boundary Zone
          </p>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors ml-2 shrink-0"
          aria-label="Close panel"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Display Label (Editable) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 block mb-2">
            Display Label
          </label>
          {isEditingLabel ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveLabel}
                autoFocus
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveLabel}
                className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {currentLabel}
              </span>
              <button
                onClick={() => {
                  setEditedLabel(currentLabel);
                  setIsEditingLabel(true);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
                title="Edit label"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {zone.description}
          </p>
        </div>

        {/* Provider & Type */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${zone.color}20`,
              color: zone.color,
            }}
          >
            {zone.provider}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {zone.type}
          </span>
        </div>

        {/* Children count */}
        {childCount > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Contains {childCount} {childCount === 1 ? "service" : "services"}
          </div>
        )}

        {/* Delete button */}
        <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Zone
          </button>
        </div>
      </div>
    </div>
  );
}
