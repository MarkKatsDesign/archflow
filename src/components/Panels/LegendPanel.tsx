import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useArchitectureStore } from '../../store/useArchitectureStore';

export function LegendPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { nodes } = useArchitectureStore();

  // Only show if canvas has content
  if (nodes.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-[420px] z-10 w-72">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Visual Guide</h3>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="px-4 py-3 border-t space-y-4">
            {/* Connection Types */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Connection Types
              </h4>
              <div className="space-y-3">
                {/* Solid Line */}
                <div className="flex items-center gap-3">
                  <svg width="40" height="2" className="flex-shrink-0">
                    <line
                      x1="0"
                      y1="1"
                      x2="40"
                      y2="1"
                      stroke="#64748b"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="text-xs text-gray-600">
                    Standard connection
                  </div>
                </div>

                {/* Animated Line */}
                <div className="flex items-center gap-3">
                  <svg width="40" height="2" className="flex-shrink-0">
                    <line
                      x1="0"
                      y1="1"
                      x2="40"
                      y2="1"
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeDasharray="4"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="8;0"
                        dur="0.5s"
                        repeatCount="indefinite"
                      />
                    </line>
                  </svg>
                  <div className="text-xs text-gray-600">
                    Active data flow
                  </div>
                </div>

                {/* Edge Label Example */}
                <div className="flex items-start gap-3 pt-2 border-t">
                  <div className="flex-shrink-0 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-semibold text-gray-900 shadow-sm">
                    Auth Token
                  </div>
                  <div className="text-xs text-gray-600 pt-1">
                    Labels show connection type
                  </div>
                </div>
              </div>
            </div>

            {/* Node Badges */}
            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Service Badges
              </h4>
              <div className="space-y-2">
                {/* Free Tier Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 border border-green-300">
                    <span className="text-xs text-green-600 font-bold">$</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Free tier available
                  </div>
                </div>

                {/* Managed Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border border-blue-300">
                    <span className="text-xs text-blue-600 font-bold">✓</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Fully managed service
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tip */}
            <div className="border-t pt-3">
              <div className="bg-blue-50 rounded px-3 py-2">
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">Tip:</span> Click the{' '}
                  <span className="font-mono bg-white px-1 rounded">?</span>{' '}
                  icon in the top-right for detailed help
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
