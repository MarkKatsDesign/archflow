import { useEffect } from 'react';
import ComponentPalette from './components/Sidebar/ComponentPalette';
import ArchitectureCanvas from './components/Canvas/ArchitectureCanvas';
import { NodeDetailPanel } from './components/Panels/NodeDetailPanel';
import { EdgeDetailPanel } from './components/Panels/EdgeDetailPanel';
import { RecommendationsPanel } from './components/Panels/RecommendationsPanel';
import { CostEstimatePanel } from './components/Panels/CostEstimatePanel';
import { ExportPanel } from './components/Panels/ExportPanel';
import { HelpModal } from './components/Help/HelpModal';
import { OnboardingWizard } from './components/Onboarding/OnboardingWizard';
import { WizardButton } from './components/Onboarding/WizardButton';
import { useOnboardingStore } from './store/useOnboardingStore';
import { useArchitectureStore } from './store/useArchitectureStore';

function App() {
  const { openWizard } = useOnboardingStore();
  const { nodes } = useArchitectureStore();

  // Show wizard on first visit
  useEffect(() => {
    const hasCompleted = localStorage.getItem('archflow_has_completed_onboarding');

    if (!hasCompleted && nodes.length === 0) {
      // Show wizard after brief delay for better UX
      const timer = setTimeout(() => {
        openWizard();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [openWizard, nodes.length]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ArchFlow</h1>
          <p className="text-sm text-gray-600">Visual System Architecture Designer</p>
        </div>
        <WizardButton />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ComponentPalette />
        <div className="flex-1 relative">
          <ArchitectureCanvas />
          <ExportPanel />
          <NodeDetailPanel />
          <EdgeDetailPanel />
          <RecommendationsPanel />
          <CostEstimatePanel />
          <HelpModal />
        </div>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard />
    </div>
  );
}

export default App;
