import { useState, useEffect } from "react";
import {
  Lightbulb,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useCompatibility } from "../../hooks/useCompatibility";
import { useArchitectureStore } from "../../store/useArchitectureStore";
import { services } from "../../data/services";
import type { Service } from "../../types/service";

const STORAGE_KEY = "archflow_suggestions_expanded";

export function RecommendationsPanel() {
  const { getRecommendations, getWarnings, canvasServices } =
    useCompatibility();
  const { selectedNodeId, selectedEdgeId } = useArchitectureStore();

  // Load expansion state from localStorage, default to collapsed
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  // Save expansion state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isExpanded));
  }, [isExpanded]);

  const recommendations = getRecommendations(services);
  const warnings = getWarnings();

  // Don't show panel if canvas is empty
  if (canvasServices.length === 0) {
    return null;
  }

  // Auto-hide when a node or edge is selected to avoid overlapping with detail panels
  if (selectedNodeId || selectedEdgeId) {
    return null;
  }

  const hasContent = recommendations.length > 0 || warnings.length > 0;
  const totalCount = recommendations.length + warnings.length;

  // Collapsed state - minimal button
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="absolute bottom-4 right-4 z-40 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 hover:shadow-xl transition-all hover:scale-105 group animate-slide-in-up"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">
              Smart Suggestions
            </span>
          </div>
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              {warnings.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {warnings.length}{" "}
                  {warnings.length === 1 ? "warning" : "warnings"}
                </span>
              )}
              {recommendations.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {recommendations.length}{" "}
                  {recommendations.length === 1 ? "tip" : "tips"}
                </span>
              )}
            </div>
          )}
          {!hasContent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              All good
            </span>
          )}
          <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </button>
    );
  }

  // Expanded state - full panel
  if (!hasContent) {
    return (
      <div className="absolute bottom-4 right-4 z-40 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-slide-in-up">
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">
                Architecture looks good!
              </h3>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </div>
        </button>
        <div className="px-4 py-3">
          <p className="text-sm text-gray-600">
            No warnings or critical recommendations at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-40 w-96 bg-white rounded-xl shadow-xl border border-gray-200 max-h-125 overflow-hidden flex flex-col animate-slide-in-up">
      {/* Header - Clickable to collapse */}
      <button
        onClick={() => setIsExpanded(false)}
        className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all text-left w-full"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Smart Suggestions</h3>
              {totalCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {totalCount}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Based on your current architecture
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-600 shrink-0" />
        </div>
      </button>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Warnings Section */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="font-medium text-sm">Warnings</h4>
            </div>
            <div className="space-y-2">
              {warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <p className="text-sm text-amber-900">{warning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-medium text-sm">
                Recommended Services ({recommendations.length})
              </h4>
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 5).map((service) => (
                <RecommendationCard key={service.id} service={service} />
              ))}
              {recommendations.length > 5 && (
                <p className="text-xs text-gray-500 text-center pt-1">
                  +{recommendations.length - 5} more in sidebar
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  service: Service;
}

function RecommendationCard({ service }: RecommendationCardProps) {
  const onDragStart = (event: React.DragEvent, service: Service) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(service)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, service)}
      className="p-3 bg-green-50 border border-green-200 rounded-lg hover:border-green-400 cursor-move transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-3 h-3 rounded-full mt-0.5 shrink-0"
          style={{ backgroundColor: service.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {service.shortName}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            {service.provider} • {service.category}
          </div>
          <p className="text-xs text-gray-700 mt-1 line-clamp-2">
            {service.description}
          </p>
          {service.costModel?.freeTierAvailable && (
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-100 rounded text-xs text-green-700">
              <Sparkles className="w-3 h-3" />
              Free tier available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
