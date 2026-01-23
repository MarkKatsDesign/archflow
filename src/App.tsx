import { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Logo } from './components/Logo';
import ComponentPalette from './components/Sidebar/ComponentPalette';
import ArchitectureCanvas from './components/Canvas/ArchitectureCanvas';
import { NodeDetailPanel } from './components/Panels/NodeDetailPanel';
import { GroupNodeDetailPanel } from './components/Panels/GroupNodeDetailPanel';
import { EdgeDetailPanel } from './components/Panels/EdgeDetailPanel';
import { RecommendationsPanel } from './components/Panels/RecommendationsPanel';
import { CostEstimatePanel } from './components/Panels/CostEstimatePanel';
import { ExportPanel } from './components/Panels/ExportPanel';
import { AutoLayoutPanel } from './components/Panels/AutoLayoutPanel';
import { HelpModal } from './components/Help/HelpModal';
import { OnboardingWizard } from './components/Onboarding/OnboardingWizard';
import { WizardButton } from './components/Onboarding/WizardButton';
import { useOnboardingStore } from './store/useOnboardingStore';
import { useArchitectureStore } from './store/useArchitectureStore';
import { useThemeStore } from './store/useThemeStore';

function App() {
  const { openWizard } = useOnboardingStore();
  const { nodes } = useArchitectureStore();
  const { theme, toggleTheme, focusMode } = useThemeStore();

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

  const isDark = theme === 'dark';

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden ${isDark ? 'dark' : ''}`}>
      {/* Compact header with brand identity - hidden in focus mode */}
      {!focusMode && (
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between transition-colors">
          <div
            className="flex items-center gap-3 group cursor-default"
            title="Visual System Architecture Designer"
          >
            {/* Brand logo with waves */}
            <div className="shadow-md group-hover:shadow-lg transition-shadow rounded-full">
              <Logo size={36} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                ArchFlow
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <WizardButton />
          </div>
        </header>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Component palette - hidden in focus mode */}
        {!focusMode && <ComponentPalette />}

        <div className="flex-1 relative">
          <ArchitectureCanvas />

          {/* Panels - hidden in focus mode except essential controls */}
          {!focusMode && (
            <>
              <ExportPanel />
              <AutoLayoutPanel />
              <NodeDetailPanel />
              <GroupNodeDetailPanel />
              <EdgeDetailPanel />
              <RecommendationsPanel />
              <CostEstimatePanel />
            </>
          )}

          {/* Export panel available in focus mode for quick exports */}
          {focusMode && <ExportPanel />}

          <HelpModal />
        </div>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard />
    </div>
  );
}

export default App;
