import { X, ExternalLink, DollarSign, Zap, Wrench, Server } from 'lucide-react';
import { useArchitectureStore } from '../../store/useArchitectureStore';
import type { Service } from '../../types/service';

const MANAGED_LEVEL_LABELS = {
  fully: 'Fully Managed',
  partial: 'Partially Managed',
  self: 'Self-Hosted',
};

const USE_CASE_LABELS: Record<string, string> = {
  'saas-mvp': 'SaaS MVP',
  'ecommerce': 'E-commerce',
  'data-pipeline': 'Data Pipeline',
  'mobile-backend': 'Mobile Backend',
  'ai-ml': 'AI/ML',
  'content-site': 'Content Site',
  'real-time-app': 'Real-time App',
  'general': 'General Purpose',
};

function RatingStars({ rating, label }: { rating?: number; label: string }) {
  if (!rating) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{label}:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-3 h-3 rounded-sm ${
              star <= rating ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function NodeDetailPanel() {
  const { nodes, selectedNodeId, setSelectedNodeId } = useArchitectureStore();

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const service: Service | undefined = selectedNode?.data?.service;

  if (!selectedNode || !service) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderLeftWidth: '4px', borderLeftColor: service.color }}
      >
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{service.name}</h3>
          <p className="text-sm text-gray-500">{service.category}</p>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Description */}
        <div>
          <p className="text-sm text-gray-700">{service.description}</p>
        </div>

        {/* Provider Badge */}
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {service.provider}
          </span>
        </div>

        {/* Ratings */}
        {(service.scalability || service.complexity) && (
          <div className="space-y-2 py-2 border-t border-gray-200">
            <RatingStars rating={service.scalability} label="Scalability" />
            <RatingStars rating={service.complexity} label="Complexity" />
          </div>
        )}

        {/* Managed Level */}
        {service.managedLevel && (
          <div className="flex items-center gap-2 py-2 border-t border-gray-200">
            <Server className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {MANAGED_LEVEL_LABELS[service.managedLevel]}
            </span>
          </div>
        )}

        {/* Cost Estimate */}
        {service.costModel && (
          <div className="py-2 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Cost Estimate</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{service.costModel.type}</span>
              </div>
              {service.costModel.estimatedMonthlyCost && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Monthly:</span>
                  <span className="font-medium">
                    ${service.costModel.estimatedMonthlyCost.min} - $
                    {service.costModel.estimatedMonthlyCost.max}
                  </span>
                </div>
              )}
              {service.costModel.freeTierAvailable && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Zap className="w-3 h-3" />
                  <span>Free tier available</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Use Cases */}
        {service.useCases && service.useCases.length > 0 && (
          <div className="py-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Best For:
            </span>
            <div className="flex flex-wrap gap-2">
              {service.useCases.map((useCase) => (
                <span
                  key={useCase}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700"
                >
                  {USE_CASE_LABELS[useCase] || useCase}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Compatibility */}
        {service.compatibleWith && service.compatibleWith.length > 0 && (
          <div className="py-2 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Compatible With:</span>
            </div>
            <div className="ml-6 flex flex-wrap gap-1">
              {service.compatibleWith.map((compatId) => (
                <span
                  key={compatId}
                  className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded"
                >
                  {compatId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Incompatibility */}
        {service.incompatibleWith && service.incompatibleWith.length > 0 && (
          <div className="py-2 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Incompatible With:</span>
            </div>
            <div className="ml-6 flex flex-wrap gap-1">
              {service.incompatibleWith.map((incompatId) => (
                <span
                  key={incompatId}
                  className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded"
                >
                  {incompatId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="py-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700 block mb-2">Tags:</span>
            <div className="flex flex-wrap gap-1">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Documentation Link */}
        {service.documentation && (
          <div className="py-2 border-t border-gray-200">
            <a
              href={service.documentation}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Documentation</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
