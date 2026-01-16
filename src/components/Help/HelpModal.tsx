import { useState } from "react";
import {
  HelpCircle,
  X,
  Zap,
  Box,
  GitBranch,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { useArchitectureStore } from "../../store/useArchitectureStore";

export function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedNodeId, selectedEdgeId } = useArchitectureStore();

  // Hide help button when node or edge detail panel is open
  const isPanelOpen = selectedNodeId !== null || selectedEdgeId !== null;

  return (
    <>
      {/* Help Button - Top Right (hidden when detail panel is open) */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105"
          title="Help & Guide"
        >
          <HelpCircle className="w-5 h-5 text-blue-600" />
        </button>
      )}

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">ArchFlow Guide</h2>
                  <p className="text-sm text-blue-100 mt-1">
                    Everything you need to know about designing your
                    architecture
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
              <div className="p-6 space-y-6">
                {/* Getting Started */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Getting Started
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>1. Start with a Template:</strong> Click "New
                      Project" to choose a pre-built architecture template that
                      matches your use case.
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>2. Drag & Drop Services:</strong> Browse the
                      Components panel on the left and drag services onto the
                      canvas.
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>3. Connect Services:</strong> Drag from a
                      service's edge to another service to create connections.
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>4. Export & Share:</strong> Use the Export button
                      to save as JSON, PNG, Markdown, or PDF.
                    </p>
                  </div>
                </section>

                {/* Visual Elements */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Box className="w-5 h-5 text-purple-600" />
                    Visual Elements
                  </h3>
                  <div className="space-y-3">
                    {/* Service Nodes */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Service Nodes
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                          <span>
                            <strong>Color-coded borders:</strong> Each service
                            category has a unique color (blue for Frontend,
                            green for Database, etc.)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                          <span>
                            <strong>Gradient backgrounds:</strong> Subtle
                            gradients enhance visual hierarchy
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                          <span>
                            <strong>Hover effects:</strong> Nodes scale up and
                            show enhanced shadows on hover
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Service Badges */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Service Badges
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 border border-green-300">
                            <DollarSign className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <span className="text-sm text-gray-700">
                            <strong>Free Tier Badge:</strong> Service offers a
                            free tier for getting started
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 border border-blue-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-700">
                            <strong>Fully Managed Badge:</strong> Service is
                            fully managed (no infrastructure to maintain)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Connections */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        Connection Types
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <svg width="50" height="2" className="shrink-0">
                            <line
                              x1="0"
                              y1="1"
                              x2="50"
                              y2="1"
                              stroke="#64748b"
                              strokeWidth="2"
                            />
                          </svg>
                          <span className="text-sm text-gray-700">
                            <strong>Solid Line:</strong> Standard connection or
                            data flow
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg width="50" height="2" className="shrink-0">
                            <line
                              x1="0"
                              y1="1"
                              x2="50"
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
                          <span className="text-sm text-gray-700">
                            <strong>Animated Line:</strong> Active or real-time
                            data flow
                          </span>
                        </div>
                        <div className="flex items-start gap-3 pt-2">
                          <div className="shrink-0 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-900 shadow-sm">
                            Label
                          </div>
                          <span className="text-sm text-gray-700 pt-0.5">
                            <strong>Connection Labels:</strong> Describe the
                            type of data or relationship (e.g., "Auth Token",
                            "User Data")
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Smart Features */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Smart Features
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">
                        ✓ Compatibility Checking
                      </h4>
                      <p className="text-sm text-green-800">
                        Services are automatically highlighted when they work
                        well together. Incompatible services are marked with
                        warnings.
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        💡 Smart Suggestions
                      </h4>
                      <p className="text-sm text-blue-800">
                        Get intelligent recommendations for complementary
                        services based on your current architecture.
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">
                        💰 Cost Estimates
                      </h4>
                      <p className="text-sm text-purple-800">
                        Real-time cost estimates show monthly pricing ranges for
                        your entire architecture based on different scales.
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-2">
                        ⚠️ Architectural Warnings
                      </h4>
                      <p className="text-sm text-orange-800">
                        Get notified about potential issues like databases
                        without backends or missing required services.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Canvas Controls */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Canvas Controls
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <strong className="text-gray-900">Pan Canvas:</strong>
                        <p className="text-gray-600">
                          Click and drag background
                        </p>
                      </div>
                      <div>
                        <strong className="text-gray-900">Zoom:</strong>
                        <p className="text-gray-600">Mouse wheel or pinch</p>
                      </div>
                      <div>
                        <strong className="text-gray-900">Select Node:</strong>
                        <p className="text-gray-600">Click on any service</p>
                      </div>
                      <div>
                        <strong className="text-gray-900">Move Node:</strong>
                        <p className="text-gray-600">Drag selected service</p>
                      </div>
                      <div>
                        <strong className="text-gray-900">Delete:</strong>
                        <p className="text-gray-600">
                          Select node, press Delete/Backspace
                        </p>
                      </div>
                      <div>
                        <strong className="text-gray-900">Connect:</strong>
                        <p className="text-gray-600">
                          Drag from node edge to another
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Export Options */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Export Options
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                      <span>
                        <strong>JSON:</strong> Save and load your complete
                        architecture with all connections and metadata
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                      <span>
                        <strong>PNG Image:</strong> High-resolution diagram
                        perfect for presentations and documentation
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5" />
                      <span>
                        <strong>Markdown:</strong> Text-based documentation with
                        service lists and connections
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                      <span>
                        <strong>PDF Document:</strong> Multi-page report with
                        diagram, service details, and cost estimates
                      </span>
                    </div>
                  </div>
                </section>

                {/* Tips & Best Practices */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Tips & Best Practices
                  </h3>
                  <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="text-gray-700">
                      💡 <strong>Start Simple:</strong> Begin with essential
                      services and add complexity as needed
                    </p>
                    <p className="text-gray-700">
                      💡 <strong>Follow Recommendations:</strong>{" "}
                      Green-highlighted services in the sidebar work well with
                      your current setup
                    </p>
                    <p className="text-gray-700">
                      💡 <strong>Use Templates:</strong> Pre-built templates
                      follow industry best practices
                    </p>
                    <p className="text-gray-700">
                      💡 <strong>Label Connections:</strong> Click on
                      connections to add descriptive labels
                    </p>
                    <p className="text-gray-700">
                      💡 <strong>Save Frequently:</strong> Export to JSON
                      regularly to preserve your work
                    </p>
                    <p className="text-gray-700">
                      💡 <strong>Check Costs:</strong> Keep an eye on the cost
                      estimate panel to stay within budget
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
