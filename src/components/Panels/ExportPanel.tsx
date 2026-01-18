import { useState, useRef, useMemo } from "react";
import {
  Download,
  FileJson,
  Image,
  FileText,
  FileType,
  Upload,
  ChevronDown,
  FileCode,
} from "lucide-react";
import { useArchitectureStore } from "../../store/useArchitectureStore";
import { useCostCalculator } from "../../hooks/useCostCalculator";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { useThemeStore } from "../../store/useThemeStore";
import {
  exportToJSON,
  importFromJSON,
  exportToPNG,
  exportToMarkdown,
  exportToPDF,
} from "../../utils/exportUtils";
import { exportToTerraform } from "../../utils/terraformGenerator";
import { isServiceNode } from "../../types/architecture";
import type { ArchNode } from "../../types/architecture";

export function ExportPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { nodes, edges, setNodes, setEdges } = useArchitectureStore();
  const { totalMin, totalMax } = useCostCalculator();
  const { answers } = useOnboardingStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === "dark";

  // Filter to only service nodes (memoized)
  const serviceNodes = useMemo(() => nodes.filter(isServiceNode), [nodes]);

  const handleExportJSON = () => {
    const categories = [
      ...new Set(serviceNodes.map((n) => n.data.service.category)),
    ];

    // Export all nodes (including groups) so parent relationships are preserved
    exportToJSON(nodes, edges, {
      totalServices: serviceNodes.length,
      categories,
      estimatedCost: { min: totalMin, max: totalMax },
    });
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importFromJSON(file, (data) => {
      // Cast imported nodes to ArchNode[] (they're compatible at runtime)
      setNodes(data.nodes as unknown as ArchNode[]);
      setEdges(data.edges);
      alert(
        `Imported ${data.nodes.length} services and ${data.edges.length} connections`
      );
    });

    // Reset input
    event.target.value = "";
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const viewport = document.querySelector(
        ".react-flow__viewport"
      ) as HTMLElement;
      if (!viewport) {
        alert("Canvas not found. Make sure you have services on the canvas.");
        return;
      }

      await exportToPNG(viewport, isDarkMode);
    } catch (error) {
      console.error("PNG export failed:", error);
      alert("Failed to export PNG. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    const scale = answers?.scale || "Unknown";
    exportToMarkdown(serviceNodes, edges, {
      totalCost: { min: totalMin, max: totalMax },
      scale,
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const viewport = document.querySelector(
        ".react-flow__viewport"
      ) as HTMLElement;
      if (!viewport) {
        alert("Canvas not found");
        return;
      }

      const scale = answers?.scale || "Unknown";
      await exportToPDF(
        viewport,
        serviceNodes,
        edges,
        {
          totalCost: { min: totalMin, max: totalMax },
          scale,
        },
        isDarkMode
      );
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTerraform = async () => {
    setIsExporting(true);
    try {
      await exportToTerraform(serviceNodes, edges);
    } catch (error) {
      console.error("Terraform export failed:", error);
      alert("Failed to export Terraform files. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const isEmpty = serviceNodes.length === 0;

  return (
    <>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Export/Import Button - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          {isEmpty ? (
            <>
              <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-200">Import</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-200">Export</span>
            </>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Menu */}
        {isOpen && (
          <div className="absolute top-14 left-0 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-4 py-3 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/30 border-b border-gray-100 dark:border-slate-700">
              {isEmpty ? (
                <>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Import Architecture
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Load a saved design to get started
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Export Architecture
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Save or share your design
                  </p>
                </>
              )}
            </div>

            {/* Options */}
            <div className="p-2 space-y-1">
              {isEmpty ? (
                /* Empty Canvas - Show Only Import */
                <>
                  <button
                    onClick={handleImportJSON}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        Import JSON
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Load saved architecture
                      </div>
                    </div>
                  </button>

                  {/* Helpful message */}
                  <div className="px-3 py-4 mt-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      Import a previously saved architecture file, or use the
                      wizard to start fresh
                    </p>
                  </div>
                </>
              ) : (
                /* Canvas Has Content - Show All Export Options */
                <>
                  {/* JSON Export */}
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <FileJson className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        JSON
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Save architecture data
                      </div>
                    </div>
                  </button>

                  {/* JSON Import */}
                  <button
                    onClick={handleImportJSON}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        Import JSON
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Load saved architecture
                      </div>
                    </div>
                  </button>

                  <div className="border-t dark:border-slate-700 my-1"></div>

                  {/* PNG Export */}
                  <button
                    onClick={handleExportPNG}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                      <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        PNG Image
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isExporting ? "Exporting..." : "High-res diagram"}
                      </div>
                    </div>
                  </button>

                  {/* Markdown Export */}
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        Markdown
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Documentation file
                      </div>
                    </div>
                  </button>

                  {/* PDF Export */}
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                      <FileType className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        PDF Document
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isExporting ? "Generating..." : "Multi-page report"}
                      </div>
                    </div>
                  </button>

                  <div className="border-t dark:border-slate-700 my-1"></div>

                  {/* Terraform Export */}
                  <button
                    onClick={handleExportTerraform}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                      <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        Terraform (IaC)
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isExporting
                          ? "Generating..."
                          : "Infrastructure as Code"}
                      </div>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            {!isEmpty && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-t dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {serviceNodes.length} services • {edges.length} connections
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
