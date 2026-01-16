import { Sparkles, Plus } from "lucide-react";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { useArchitectureStore } from "../../store/useArchitectureStore";

export function WizardButton() {
  const { openWizard } = useOnboardingStore();
  const { nodes } = useArchitectureStore();

  const isCanvasEmpty = nodes.length === 0;

  if (isCanvasEmpty) {
    // Prominent "Get Started" button with gradient when canvas is empty
    return (
      <button
        onClick={openWizard}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white btn-gradient-primary shadow-md"
      >
        <Sparkles className="w-4 h-4" />
        Get Started
      </button>
    );
  }

  // Subtle "New Project" button when canvas has nodes
  return (
    <button
      onClick={openWizard}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all border border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 hover:shadow-sm"
    >
      <Plus className="w-4 h-4" />
      New Project
    </button>
  );
}
