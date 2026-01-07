import { Sparkles, Plus } from 'lucide-react';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useArchitectureStore } from '../../store/useArchitectureStore';

export function WizardButton() {
  const { openWizard } = useOnboardingStore();
  const { nodes } = useArchitectureStore();

  const isCanvasEmpty = nodes.length === 0;

  if (isCanvasEmpty) {
    // Prominent "Get Started" button when canvas is empty
    return (
      <button
        onClick={openWizard}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
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
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-gray-300"
    >
      <Plus className="w-4 h-4" />
      New Project
    </button>
  );
}
