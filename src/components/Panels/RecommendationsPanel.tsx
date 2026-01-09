import { Lightbulb, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useCompatibility } from '../../hooks/useCompatibility';
import { useArchitectureStore } from '../../store/useArchitectureStore';
import { services } from '../../data/services';
import type { Service } from '../../types/service';

export function RecommendationsPanel() {
  const { getRecommendations, getWarnings, canvasServices } = useCompatibility();
  const { selectedNodeId, selectedEdgeId } = useArchitectureStore();

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

  if (!hasContent) {
    return (
      <div className="absolute bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <h3 className="font-semibold">Architecture looks good!</h3>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          No warnings or critical recommendations at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Smart Suggestions</h3>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Based on your current architecture
        </p>
      </div>

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
    event.dataTransfer.setData('application/reactflow', JSON.stringify(service));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, service)}
      className="p-3 bg-green-50 border border-green-200 rounded-lg hover:border-green-400 cursor-move transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
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
