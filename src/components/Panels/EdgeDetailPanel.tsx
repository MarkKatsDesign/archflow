import { useState } from "react";
import { X, Tag, Zap, GitBranch, Trash2, Pencil, Route, Cpu } from "lucide-react";
import { useArchitectureStore } from "../../store/useArchitectureStore";
import type { Edge } from "reactflow";
import type { ArchNode } from "../../types/architecture";

function EdgeDetailPanelContent({
  edge,
  nodes,
}: {
  edge: Edge;
  nodes: ArchNode[];
}) {
  const { setSelectedEdgeId, updateEdge, deleteEdge } = useArchitectureStore();

  const [label, setLabel] = useState<string>(
    typeof edge.label === "string" ? edge.label : ""
  );

  // Find source and target node names for display
  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    updateEdge(edge.id, { label: newLabel });
  };

  const handleAnimatedToggle = () => {
    updateEdge(edge.id, { animated: !edge.animated });
  };

  const handleEdgeTypeChange = (type: string) => {
    updateEdge(edge.id, { type });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this connection?")) {
      deleteEdge(edge.id);
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between border-l-4 border-l-blue-500 bg-linear-to-r from-white to-gray-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Connection Properties</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sourceNode?.data.label || "Source"} →{" "}
            {targetNode?.data.label || "Target"}
          </p>
        </div>
        <button
          onClick={() => setSelectedEdgeId(null)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Label Input */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Tag className="w-4 h-4" />
            Connection Label
          </label>
          <input
            type="text"
            value={label || ""}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g., Data & Auth, API Call"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Describe the data or communication flow
          </p>
        </div>

        {/* Animated Toggle */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                  Animated Flow
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Dashed line with animation
                </span>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={edge.animated || false}
                onChange={handleAnimatedToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>
        </div>

        {/* Edge Type Selection */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <GitBranch className="w-4 h-4" />
            Connection Style
          </label>
          <div className="space-y-2">
            <button
              onClick={() => handleEdgeTypeChange("default")}
              className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                edge.type === "default" || !edge.type
                  ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <div className="font-medium">Bezier (Curved)</div>
              <div className="text-xs opacity-75">Smooth curved lines</div>
            </button>
            <button
              onClick={() => handleEdgeTypeChange("editableBezier")}
              className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                edge.type === "editableBezier"
                  ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <Pencil className="w-3 h-3" />
                Editable Bezier
              </div>
              <div className="text-xs opacity-75">Drag control points to adjust curve</div>
            </button>
            <button
              onClick={() => handleEdgeTypeChange("smartOrthogonal")}
              className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                edge.type === "smartOrthogonal"
                  ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <Route className="w-3 h-3" />
                Smart Orthogonal
              </div>
              <div className="text-xs opacity-75">90° angles with lane routing</div>
            </button>
            <button
              onClick={() => handleEdgeTypeChange("pcb")}
              className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                edge.type === "pcb"
                  ? "bg-cyan-50 dark:bg-cyan-900/30 border-2 border-cyan-500 text-cyan-700 dark:text-cyan-300"
                  : "bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <Cpu className="w-3 h-3" />
                PCB Style
              </div>
              <div className="text-xs opacity-75">45° angles, sci-fi circuit board look</div>
            </button>
            <button
              onClick={() => handleEdgeTypeChange("smoothstep")}
              className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                edge.type === "smoothstep"
                  ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <div className="font-medium">Smooth Step</div>
              <div className="text-xs opacity-75">Rounded right angles (basic)</div>
            </button>
            <button
              onClick={() => handleEdgeTypeChange("straight")}
              className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                edge.type === "straight"
                  ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              <div className="font-medium">Straight</div>
              <div className="text-xs opacity-75">Direct line connection</div>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> Use <strong>Optimize Edges</strong> for automatic lane-based routing. <strong>PCB Style</strong> creates sci-fi circuit board aesthetics with 45° angles.
            </p>
          </div>
        </div>

        {/* Delete Button */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-medium text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Connection
          </button>
        </div>
      </div>
    </div>
  );
}

export function EdgeDetailPanel() {
  const { edges, selectedEdgeId, nodes } = useArchitectureStore();
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  if (!selectedEdge) {
    return null;
  }

  // Use key to reset component state when edge changes
  return (
    <EdgeDetailPanelContent
      key={selectedEdge.id}
      edge={selectedEdge}
      nodes={nodes}
    />
  );
}
