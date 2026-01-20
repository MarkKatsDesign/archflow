import { useState } from 'react';
import {
  LayoutGrid,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Route,
  Cpu,
} from 'lucide-react';
import { useArchitectureStore } from '../../store/useArchitectureStore';
import { applyAutoLayout, optimizeEdges, type LayoutOptions } from '../../utils/layoutEngine';

type Direction = LayoutOptions['direction'];

const directions: { value: Direction; icon: typeof ArrowDown; label: string }[] = [
  { value: 'TB', icon: ArrowDown, label: 'Top to Bottom' },
  { value: 'LR', icon: ArrowRight, label: 'Left to Right' },
  { value: 'BT', icon: ArrowUp, label: 'Bottom to Top' },
  { value: 'RL', icon: ArrowLeft, label: 'Right to Left' },
];

export function AutoLayoutPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLayouting, setIsLayouting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [direction, setDirection] = useState<Direction>('TB');
  const [nodeSpacing, setNodeSpacing] = useState(80);
  const [layerSpacing, setLayerSpacing] = useState(100);
  const [pcbMode, setPcbMode] = useState(false);

  const { nodes, edges, setNodes, setEdges } = useArchitectureStore();

  const handleApplyLayout = async () => {
    if (nodes.length === 0) return;

    setIsLayouting(true);
    try {
      const result = await applyAutoLayout(nodes, edges, {
        direction,
        nodeSpacing,
        layerSpacing,
        algorithm: 'layered',
      });

      setNodes(result.nodes);
      setEdges(result.edges);
      setIsOpen(false);
    } catch (error) {
      console.error('Auto layout failed:', error);
    } finally {
      setIsLayouting(false);
    }
  };

  const handleOptimizeEdges = () => {
    if (edges.length === 0) return;

    setIsOptimizing(true);
    try {
      let optimizedEdges = optimizeEdges(nodes, edges);

      // Apply PCB style if enabled
      if (pcbMode) {
        optimizedEdges = optimizedEdges.map(edge => ({
          ...edge,
          type: 'pcb',
        }));
      }

      setEdges(optimizedEdges);
    } catch (error) {
      console.error('Edge optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const isEmpty = nodes.length === 0;

  if (isEmpty) {
    return null;
  }

  return (
    <div className="absolute top-4 left-44 z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all hover:-translate-y-0.5"
      >
        <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span className="font-semibold text-gray-700 dark:text-gray-200">Auto Layout</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="px-4 py-3 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-purple-900/30 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Auto Layout
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Automatically arrange nodes
            </p>
          </div>

          {/* Options */}
          <div className="p-4 space-y-4">
            {/* Direction Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Direction
              </label>
              <div className="flex gap-2">
                {directions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setDirection(value)}
                    className={`flex-1 p-2 rounded-lg border transition-all ${
                      direction === value
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600'
                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                    title={label}
                  >
                    <Icon
                      className={`w-5 h-5 mx-auto ${
                        direction === value
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Node Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Node Spacing: {nodeSpacing}px
              </label>
              <input
                type="range"
                min="40"
                max="150"
                value={nodeSpacing}
                onChange={(e) => setNodeSpacing(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Layer Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Layer Spacing: {layerSpacing}px
              </label>
              <input
                type="range"
                min="60"
                max="200"
                value={layerSpacing}
                onChange={(e) => setLayerSpacing(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApplyLayout}
              disabled={isLayouting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLayouting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  Apply Layout
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-800 px-2 text-gray-500 dark:text-gray-400">
                  or
                </span>
              </div>
            </div>

            {/* PCB Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-500" />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    PCB Style
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    45° angles, sci-fi look
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPcbMode(!pcbMode)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  pcbMode
                    ? 'bg-cyan-500'
                    : 'bg-gray-200 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    pcbMode ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Optimize Edges Button */}
            <button
              onClick={handleOptimizeEdges}
              disabled={isOptimizing || edges.length === 0}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                pcbMode
                  ? 'bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white'
                  : 'bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200'
              }`}
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  {pcbMode ? <Cpu className="w-4 h-4" /> : <Route className="w-4 h-4" />}
                  {pcbMode ? 'Apply PCB Routing' : 'Optimize Edges'}
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {pcbMode
                ? 'Apply circuit board style with 45° chamfered corners'
                : 'Reroute edges to avoid overlapping nodes'}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-t dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {nodes.length} nodes • {edges.length} connections
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
