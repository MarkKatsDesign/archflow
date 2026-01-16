import { useEffect } from 'react';
import { Workflow } from 'lucide-react';
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
      {/* Compact header with brand identity */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div
          className="flex items-center gap-3 group cursor-default"
          title="Visual System Architecture Designer"
        >
          {/* Brand logo with gradient */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              ArchFlow
            </h1>
          </div>
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
