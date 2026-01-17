import {
  X,
  ExternalLink,
  DollarSign,
  Zap,
  Wrench,
  Server,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useArchitectureStore } from "../../store/useArchitectureStore";
import { isServiceNode } from "../../types/architecture";
import type { Service } from "../../types/service";

const MANAGED_LEVEL_LABELS = {
  fully: "Fully Managed",
  partial: "Partially Managed",
  self: "Self-Hosted",
};

const USE_CASE_LABELS: Record<string, string> = {
  "saas-mvp": "SaaS MVP",
  ecommerce: "E-commerce",
  "data-pipeline": "Data Pipeline",
  "mobile-backend": "Mobile Backend",
  microservices: "Microservices",
  "ai-ml": "AI/ML",
  "content-site": "Content Site",
  "real-time-app": "Real-time App",
  general: "General Purpose",
  enterprise: "Enterprise",
  orchestration: "Orchestration",
  "event-driven": "Event-Driven",
  "batch-jobs": "Batch Jobs",
  "api-backend": "API Backend",
  "hobby-project": "Hobby Project",
  "full-stack-app": "Full-Stack App",
  workers: "Workers",
  "global-app": "Global App",
  gaming: "Gaming",
  leaderboards: "Leaderboards",
  "edge-functions": "Edge Functions",
  "rate-limiting": "Rate Limiting",
  iot: "IoT",
  streaming: "Streaming",
  analytics: "Analytics",
  backup: "Backup",
  "static-assets": "Static Assets",
  "enterprise-sso": "Enterprise SSO",
  "b2b-saas": "B2B SaaS",
  "log-search": "Log Search",
  "vector-search": "Vector Search",
  observability: "Observability",
  "security-analytics": "Security Analytics",
  "security-monitoring": "Security Monitoring",
  "team-collaboration": "Team Collaboration",
  "container-builds": "Container Builds",
  workflow: "Workflow",
};

function RatingStars({ rating, label }: { rating?: number; label: string }) {
  if (!rating) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-3 h-3 rounded-sm ${
              star <= rating
                ? "bg-blue-500 dark:bg-blue-400"
                : "bg-gray-300 dark:bg-slate-600"
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

  // Only show panel for service nodes (not group nodes)
  if (!selectedNode || !isServiceNode(selectedNode)) {
    return null;
  }

  const service: Service | undefined = selectedNode.data?.service;

  if (!service) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col z-10 animate-slide-in-right">
      {/* Header - Fixed */}
      <div
        className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between shrink-0 bg-linear-to-r from-white to-gray-50 dark:from-slate-900 dark:to-slate-800"
        style={{ borderLeftWidth: "4px", borderLeftColor: service.color }}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {service.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {service.category}
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

      {/* Content - Scrollable (min-h-0 is critical for flex scroll to work) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 scrollable-panel scroll-shadow">
        {/* Description */}
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {service.description}
          </p>
        </div>

        {/* Provider Badge + Documentation Link */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200">
            {service.provider}
          </span>
          {service.documentation && (
            <a
              href={service.documentation}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Requires One Of (Dependencies) */}
        {service.requiresOneOf && service.requiresOneOf.length > 0 && (
          <div className="py-2 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Requires One Of:
              </span>
            </div>
            <div className="ml-6 flex flex-wrap gap-1">
              {service.requiresOneOf.map((reqId) => (
                <span
                  key={reqId}
                  className="text-xs px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded"
                >
                  {reqId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        {(service.scalability || service.complexity) && (
          <div className="space-y-2 py-2 border-t border-gray-200 dark:border-slate-700">
            <RatingStars rating={service.scalability} label="Scalability" />
            <RatingStars rating={service.complexity} label="Complexity" />
          </div>
        )}

        {/* Managed Level */}
        {service.managedLevel && (
          <div className="flex items-center gap-2 py-2 border-t border-gray-200 dark:border-slate-700">
            <Server className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {MANAGED_LEVEL_LABELS[service.managedLevel]}
            </span>
          </div>
        )}

        {/* Cost Estimate */}
        {service.costModel && (
          <div className="py-2 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cost Estimate
              </span>
              {service.costModel.confidence && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    service.costModel.confidence === "high"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : service.costModel.confidence === "medium"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {service.costModel.confidence}
                </span>
              )}
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {service.costModel.type}
                </span>
              </div>
              {service.costModel.estimatedMonthlyCost && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Monthly:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ${service.costModel.estimatedMonthlyCost.min} - $
                    {service.costModel.estimatedMonthlyCost.max}
                  </span>
                </div>
              )}
              {service.costModel.freeTierAvailable && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Zap className="w-3 h-3" />
                  <span>Free tier available</span>
                </div>
              )}
              {service.costModel.lastUpdated && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Last verified: {service.costModel.lastUpdated}
                </div>
              )}
              {service.costModel.assumptions && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                  {service.costModel.assumptions}
                </div>
              )}
              {service.costModel.pricingUrl && (
                <div className="mt-2">
                  <a
                    href={service.costModel.pricingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View official pricing</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Use Cases */}
        {service.useCases && service.useCases.length > 0 && (
          <div className="py-2 border-t border-gray-200 dark:border-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 block mb-2">
              Best For
            </span>
            <div className="flex flex-wrap gap-2">
              {service.useCases.map((useCase) => (
                <span
                  key={useCase}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                >
                  {USE_CASE_LABELS[useCase] || useCase}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Compatibility */}
        {service.compatibleWith && service.compatibleWith.length > 0 && (
          <div className="py-2 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Compatible With:
              </span>
            </div>
            <div className="ml-6 flex flex-wrap gap-1">
              {service.compatibleWith.map((compatId) => (
                <span
                  key={compatId}
                  className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded"
                >
                  {compatId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Incompatibility */}
        {service.incompatibleWith && service.incompatibleWith.length > 0 && (
          <div className="py-2 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Incompatible With:
              </span>
            </div>
            <div className="ml-6 flex flex-wrap gap-1">
              {service.incompatibleWith.map((incompatId) => (
                <span
                  key={incompatId}
                  className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded"
                >
                  {incompatId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="py-2 border-t border-gray-200 dark:border-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 block mb-2">
              Tags
            </span>
            <div className="flex flex-wrap gap-1">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
