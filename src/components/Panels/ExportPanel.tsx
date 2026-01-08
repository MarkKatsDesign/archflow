import { useState, useRef } from 'react';
import { Download, FileJson, Image, FileText, FileType, Upload, ChevronDown, FileCode } from 'lucide-react';
import { useArchitectureStore } from '../../store/useArchitectureStore';
import { useCostCalculator } from '../../hooks/useCostCalculator';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import {
  exportToJSON,
  importFromJSON,
  exportToPNG,
  exportToMarkdown,
  exportToPDF,
} from '../../utils/exportUtils';
import { exportToTerraform } from '../../utils/terraformGenerator';

export function ExportPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { nodes, edges, setNodes, setEdges } = useArchitectureStore();
  const { totalMin, totalMax } = useCostCalculator();
  const { answers } = useOnboardingStore();

  const handleExportJSON = () => {
    const categories = [...new Set(nodes.map((n) => n.data.service.category))];

    exportToJSON(nodes, edges, {
      totalServices: nodes.length,
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
      setNodes(data.nodes);
      setEdges(data.edges);
      alert(`Imported ${data.nodes.length} services and ${data.edges.length} connections`);
    });

    // Reset input
    event.target.value = '';
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewport) {
        alert('Canvas not found. Make sure you have services on the canvas.');
        return;
      }

      await exportToPNG(viewport);
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    const scale = answers?.scale || 'Unknown';
    exportToMarkdown(nodes, edges, {
      totalCost: { min: totalMin, max: totalMax },
      scale,
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewport) {
        alert('Canvas not found');
        return;
      }

      const scale = answers?.scale || 'Unknown';
      await exportToPDF(viewport, nodes, edges, {
        totalCost: { min: totalMin, max: totalMax },
        scale,
      });
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTerraform = async () => {
    setIsExporting(true);
    try {
      await exportToTerraform(nodes, edges);
    } catch (error) {
      console.error('Terraform export failed:', error);
      alert('Failed to export Terraform files. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const isEmpty = nodes.length === 0;

  return (
    <>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Export/Import Button - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105"
        >
          {isEmpty ? (
            <>
              <Upload className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-gray-700">Import</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-700">Export</span>
            </>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Menu */}
        {isOpen && (
          <div className="absolute top-14 left-0 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              {isEmpty ? (
                <>
                  <h3 className="font-semibold text-gray-900">Import Architecture</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Load a saved design to get started
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-gray-900">Export Architecture</h3>
                  <p className="text-xs text-gray-600 mt-1">
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
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Import JSON</div>
                      <div className="text-xs text-gray-500">Load saved architecture</div>
                    </div>
                  </button>

                  {/* Helpful message */}
                  <div className="px-3 py-4 mt-2">
                    <p className="text-xs text-gray-600 text-center">
                      Import a previously saved architecture file, or use the wizard to start fresh
                    </p>
                  </div>
                </>
              ) : (
                /* Canvas Has Content - Show All Export Options */
                <>
                  {/* JSON Export */}
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileJson className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">JSON</div>
                      <div className="text-xs text-gray-500">Save architecture data</div>
                    </div>
                  </button>

                  {/* JSON Import */}
                  <button
                    onClick={handleImportJSON}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Import JSON</div>
                      <div className="text-xs text-gray-500">Load saved architecture</div>
                    </div>
                  </button>

                  <div className="border-t my-1"></div>

                  {/* PNG Export */}
                  <button
                    onClick={handleExportPNG}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Image className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">PNG Image</div>
                      <div className="text-xs text-gray-500">
                        {isExporting ? 'Exporting...' : 'High-res diagram'}
                      </div>
                    </div>
                  </button>

                  {/* Markdown Export */}
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Markdown</div>
                      <div className="text-xs text-gray-500">Documentation file</div>
                    </div>
                  </button>

                  {/* PDF Export */}
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <FileType className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">PDF Document</div>
                      <div className="text-xs text-gray-500">
                        {isExporting ? 'Generating...' : 'Multi-page report'}
                      </div>
                    </div>
                  </button>

                  <div className="border-t my-1"></div>

                  {/* Terraform Export */}
                  <button
                    onClick={handleExportTerraform}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <FileCode className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Terraform (IaC)</div>
                      <div className="text-xs text-gray-500">
                        {isExporting ? 'Generating...' : 'Infrastructure as Code'}
                      </div>
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            {!isEmpty && (
              <div className="px-4 py-2 bg-gray-50 border-t">
                <p className="text-xs text-gray-500 text-center">
                  {nodes.length} services • {edges.length} connections
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
