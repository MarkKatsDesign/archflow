import { useState } from "react";
import {
  DollarSign,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Rocket,
  TrendingUp,
  Building2,
} from "lucide-react";
import { useCostCalculator } from "../../hooks/useCostCalculator";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { useArchitectureStore } from "../../store/useArchitectureStore";
import type { Category } from "../../types/service";
import type { Scale } from "../../types/onboarding";
import { SCALE_LABELS } from "../../types/onboarding";

const SCALE_ICONS: Record<Scale, typeof Rocket> = {
  "startup-mvp": Rocket,
  growth: TrendingUp,
  enterprise: Building2,
  unsure: Rocket,
};

export function CostEstimatePanel() {
  const { nodes } = useArchitectureStore();
  const { answers, setScale, openWizard } = useOnboardingStore();
  const costEstimate = useCostCalculator();

  // Local state for UI
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(
    new Set()
  );
  const [showScaleSelector, setShowScaleSelector] = useState(false);

  // Don't show panel if canvas is empty
  if (nodes.length === 0) {
    return null;
  }

  // Don't show if no services have cost data
  if (costEstimate.servicesWithCosts === 0) {
    return null;
  }

  const toggleCategory = (category: Category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleScaleChange = (newScale: Scale) => {
    setScale(newScale);
    setShowScaleSelector(false);
  };

  const formatCost = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const ScaleIcon = SCALE_ICONS[costEstimate.scale];

  // Budget status colors
  const budgetColorClasses = {
    ok: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    exceeded: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="absolute bottom-4 left-16 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 max-h-[calc(100vh-12rem)] overflow-hidden flex flex-col z-10 animate-slide-in-up">
      {/* Header - Collapsible */}
      <div
        className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 cursor-pointer hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/40 transition-all"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cost Estimate</h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded transition-colors"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCost(costEstimate.totalMin)} -{" "}
            {formatCost(costEstimate.totalMax)}
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
          </p>
        </div>
      </div>

      {/* Content - Only show when not collapsed */}
      {!isCollapsed && (
        <>
          {/* Scale Selector */}
          <div className="px-4 py-2 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScaleIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Scale:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {SCALE_LABELS[costEstimate.scale].label}
                </span>
              </div>
              {answers.completed ? (
                <div className="relative">
                  <button
                    onClick={() => setShowScaleSelector(!showScaleSelector)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Change
                  </button>
                  {showScaleSelector && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-10 w-40">
                      {(["startup-mvp", "growth", "enterprise"] as Scale[]).map(
                        (scale) => {
                          const Icon = SCALE_ICONS[scale];
                          return (
                            <button
                              key={scale}
                              onClick={() => handleScaleChange(scale)}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 ${
                                costEstimate.scale === scale
                                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {SCALE_LABELS[scale].label}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openWizard()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Complete onboarding
                </button>
              )}
            </div>
          </div>

          {/* Budget Status */}
          {costEstimate.budgetRange &&
            costEstimate.budgetRange !== "unsure" && (
              <div
                className={`px-4 py-2 border-b ${
                  budgetColorClasses[costEstimate.budgetStatus]
                }`}
              >
                <div className="flex items-center gap-2">
                  {costEstimate.budgetStatus === "ok" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {costEstimate.budgetStatus === "ok" && "Within budget"}
                    {costEstimate.budgetStatus === "warning" &&
                      "Approaching budget limit"}
                    {costEstimate.budgetStatus === "exceeded" &&
                      "Exceeds budget"}
                  </span>
                </div>
              </div>
            )}

          {/* Category Breakdown - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {costEstimate.categoryBreakdowns.map((categoryBreakdown) => {
              const isExpanded = expandedCategories.has(
                categoryBreakdown.category
              );

              return (
                <div key={categoryBreakdown.category}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(categoryBreakdown.category)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {categoryBreakdown.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({categoryBreakdown.services.length})
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatCost(categoryBreakdown.totalMin)} -{" "}
                      {formatCost(categoryBreakdown.totalMax)}
                    </span>
                  </button>

                  {/* Service Items - Only show when expanded */}
                  {isExpanded && (
                    <div>
                      {categoryBreakdown.services.map((serviceCost) => (
                        <div
                          key={serviceCost.service.id}
                          className="px-4 py-2 pl-8 flex items-center justify-between text-sm hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor: serviceCost.service.color,
                              }}
                            />
                            <span className="text-gray-700 dark:text-gray-300 truncate">
                              {serviceCost.service.shortName}
                            </span>
                            {serviceCost.isFreeTier && (
                              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                                Free
                              </span>
                            )}
                          </div>
                          <span className="text-gray-600 dark:text-gray-400 ml-2 whitespace-nowrap">
                            {formatCost(serviceCost.scaledMin)} -{" "}
                            {formatCost(serviceCost.scaledMax)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <p>
                {costEstimate.servicesWithCosts} of {nodes.length} services
                counted
              </p>
              {costEstimate.servicesWithoutCosts > 0 && (
                <p className="text-gray-500 dark:text-gray-500">
                  {costEstimate.servicesWithoutCosts} service
                  {costEstimate.servicesWithoutCosts > 1 ? "s" : ""} excluded
                  (no cost data)
                </p>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                <p className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1.5 rounded flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    Cost estimates are approximate based on typical usage.
                    Review official pricing before committing.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
