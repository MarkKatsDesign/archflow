import ComponentPalette from './components/Sidebar/ComponentPalette';
import ArchitectureCanvas from './components/Canvas/ArchitectureCanvas';
import { NodeDetailPanel } from './components/Panels/NodeDetailPanel';
import { RecommendationsPanel } from './components/Panels/RecommendationsPanel';

function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ArchFlow</h1>
          <p className="text-sm text-gray-600">Visual System Architecture Designer</p>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ComponentPalette />
        <div className="flex-1 relative">
          <ArchitectureCanvas />
          <NodeDetailPanel />
          <RecommendationsPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
