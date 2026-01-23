import {
  CheckCircle2,
  Sparkles,
  DollarSign,
  Layers,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
} from "lucide-react";
import { useTemplateMatching } from "../../../hooks/useTemplateMatching";
import { useOnboardingStore } from "../../../store/useOnboardingStore";
import { useArchitectureStore } from "../../../store/useArchitectureStore";
import { services } from "../../../data/services";
import type { ArchitectureTemplate } from "../../../types/template";
import { isTemplateGroupNode } from "../../../types/template";

interface TemplateCardProps {
  template: ArchitectureTemplate;
  score: number;
  matchReasons: string[];
  isSelected: boolean;
  onSelect: () => void;
  onApply: () => void;
}

function TemplateCard({
  template,
  score,
  matchReasons,
  isSelected,
  onSelect,
  onApply,
}: TemplateCardProps) {
  // Get service names for display (filter out group nodes)
  const serviceNames = template.nodes
    .filter((node) => !isTemplateGroupNode(node))
    .map((node) => {
      const service = services.find((s) => s.id === node.data.service.id);
      return service?.shortName || node.data.service.id;
    })
    .join(", ");

  return (
    <div
      className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
        isSelected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
          : "border-gray-200 hover:border-gray-300 bg-white hover:shadow-lg"
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {template.name}
          </h3>
          <p className="text-sm text-gray-600">{template.description}</p>
        </div>
        {isSelected && (
          <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
        )}
      </div>

      {/* Match Score */}
      {matchReasons.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              Match: {score}%
            </span>
          </div>
          <ul className="space-y-1">
            {matchReasons.map((reason, idx) => (
              <li
                key={idx}
                className="text-xs text-green-700 flex items-start gap-2"
              >
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Services */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Services:</span>
        </div>
        <p className="text-xs text-gray-600">{serviceNames}</p>
      </div>

      {/* Cost */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Estimated Cost:
          </span>
        </div>
        <p className="text-sm text-gray-900">
          ${template.estimatedMonthlyCost.min} - $
          {template.estimatedMonthlyCost.max}/month
        </p>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-1 mb-2">
            <ThumbsUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-700">Pros</span>
          </div>
          <ul className="space-y-1">
            {template.pros.slice(0, 3).map((pro, idx) => (
              <li
                key={idx}
                className="text-xs text-gray-600 flex items-start gap-1"
              >
                <span className="text-green-500 mt-0.5">+</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-2">
            <ThumbsDown className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-gray-700">Cons</span>
          </div>
          <ul className="space-y-1">
            {template.cons.slice(0, 3).map((con, idx) => (
              <li
                key={idx}
                className="text-xs text-gray-600 flex items-start gap-1"
              >
                <span className="text-amber-500 mt-0.5">-</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Apply Button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onApply();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Use This Template
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function TemplatePreviewStep() {
  const templateMatches = useTemplateMatching();
  const {
    selectedTemplateId,
    setSelectedTemplate,
    completeOnboarding,
    closeWizard,
  } = useOnboardingStore();
  const { applyTemplate } = useArchitectureStore();

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleApplyTemplate = () => {
    const match = templateMatches.find(
      (m) => m.template.id === selectedTemplateId
    );
    if (match) {
      applyTemplate(match.template);
      completeOnboarding();
    }
  };

  const handleStartFromScratch = () => {
    completeOnboarding();
    closeWizard();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-2">
          Based on your answers, here are our recommended architecture
          templates:
        </p>
        <p className="text-sm text-gray-500">
          Select a template and click "Use This Template" to apply it to your
          canvas.
        </p>
      </div>

      {/* Template Cards */}
      <div className="space-y-4">
        {templateMatches.slice(0, 3).map((match) => (
          <TemplateCard
            key={match.template.id}
            template={match.template}
            score={match.score}
            matchReasons={match.matchReasons}
            isSelected={selectedTemplateId === match.template.id}
            onSelect={() => handleSelectTemplate(match.template.id)}
            onApply={handleApplyTemplate}
          />
        ))}
      </div>

      {/* Start from Scratch Option */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleStartFromScratch}
          className="w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 transition-colors"
        >
          Start from Scratch Instead
        </button>
      </div>
    </div>
  );
}
