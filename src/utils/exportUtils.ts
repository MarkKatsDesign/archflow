import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import type { Node, Edge } from "reactflow";
import type { ServiceNodeData } from "../types/architecture";

// ========================================
// JSON EXPORT/IMPORT
// ========================================

export interface ArchitectureExport {
  version: string;
  exportDate: string;
  nodes: Node<ServiceNodeData>[];
  edges: Edge[];
  metadata?: {
    totalServices: number;
    categories: string[];
    estimatedCost?: { min: number; max: number };
  };
}

export const exportToJSON = (
  nodes: Node<ServiceNodeData>[],
  edges: Edge[],
  metadata?: ArchitectureExport["metadata"]
): void => {
  const exportData: ArchitectureExport = {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    nodes,
    edges,
    metadata,
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `architecture-${Date.now()}.json`;
  link.click();

  URL.revokeObjectURL(url);
};

export const importFromJSON = (
  file: File,
  callback: (data: ArchitectureExport) => void
): void => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as ArchitectureExport;
      callback(data);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
};

// ========================================
// PNG EXPORT
// ========================================

// Helper function to prepare DOM for export (hide handles, fix animated edges)
function prepareForExport(element: HTMLElement): () => void {
  const restoreFunctions: (() => void)[] = [];

  // Hide connection handles
  const handles = element.querySelectorAll(".react-flow__handle");
  handles.forEach((handle) => {
    const el = handle as HTMLElement;
    const originalDisplay = el.style.display;
    el.style.display = "none";
    restoreFunctions.push(() => {
      el.style.display = originalDisplay;
    });
  });

  // Fix animated edges - add inline stroke-dasharray
  const animatedEdges = element.querySelectorAll(".react-flow__edge.animated");
  animatedEdges.forEach((edgeGroup) => {
    const path = edgeGroup.querySelector("path");
    if (path) {
      const originalDasharray = path.style.strokeDasharray;
      path.style.strokeDasharray = "5 5";
      restoreFunctions.push(() => {
        path.style.strokeDasharray = originalDasharray;
      });
    }
  });

  // Return a function to restore all changes
  return () => {
    restoreFunctions.forEach((restore) => restore());
  };
}

export const exportToPNG = async (
  element: HTMLElement,
  isDarkMode: boolean = false
): Promise<void> => {
  try {
    const backgroundColor = isDarkMode ? "#0f172a" : "#f9fafb";

    // Prepare DOM for export and get restore function
    const restore = prepareForExport(element);

    try {
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor,
        filter: (node) => {
          // Exclude controls, minimap, and other UI elements
          const exclusions = [
            "react-flow__minimap",
            "react-flow__controls",
            "react-flow__panel",
          ];
          return !exclusions.some((classname) =>
            (node as HTMLElement)?.classList?.contains(classname)
          );
        },
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `architecture-${Date.now()}.png`;
      link.click();
    } finally {
      // Always restore DOM even if export fails
      restore();
    }
  } catch (error) {
    console.error("Failed to export PNG:", error);
    alert("Failed to export image");
  }
};

// ========================================
// MARKDOWN EXPORT
// ========================================

export const exportToMarkdown = (
  nodes: Node<ServiceNodeData>[],
  edges: Edge[],
  metadata?: { totalCost?: { min: number; max: number }; scale?: string }
): void => {
  const services = nodes.map((n) => n.data.service);
  const categories = [...new Set(services.map((s) => s.category))];

  let markdown = `# Architecture Documentation\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `**Total Services:** ${nodes.length}\n`;
  markdown += `**Total Connections:** ${edges.length}\n\n`;

  if (metadata?.totalCost) {
    markdown += `**Estimated Monthly Cost:** $${metadata.totalCost.min} - $${metadata.totalCost.max}`;
    if (metadata.scale) {
      markdown += ` (${metadata.scale})`;
    }
    markdown += `\n\n`;
  }

  markdown += `---\n\n`;

  // Services by Category
  markdown += `## Services\n\n`;
  categories.forEach((category) => {
    const categoryServices = services.filter((s) => s.category === category);
    markdown += `### ${category} (${categoryServices.length})\n\n`;

    categoryServices.forEach((service) => {
      markdown += `#### ${service.name}\n\n`;
      markdown += `- **Provider:** ${service.provider}\n`;
      markdown += `- **Description:** ${service.description}\n`;

      if (service.costModel?.freeTierAvailable) {
        markdown += `- **Free Tier:** ✅ Available\n`;
      }

      if (service.costModel?.estimatedMonthlyCost) {
        markdown += `- **Cost:** $${service.costModel.estimatedMonthlyCost.min} - $${service.costModel.estimatedMonthlyCost.max}/month\n`;
      }

      if (service.scalability) {
        markdown += `- **Scalability:** ${service.scalability}/5\n`;
      }

      if (service.complexity) {
        markdown += `- **Complexity:** ${service.complexity}/5\n`;
      }

      if (service.useCases && service.useCases.length > 0) {
        markdown += `- **Use Cases:** ${service.useCases.join(", ")}\n`;
      }

      if (service.documentation) {
        markdown += `- **Documentation:** [${service.documentation}](${service.documentation})\n`;
      }

      markdown += `\n`;
    });
  });

  // Connections
  if (edges.length > 0) {
    markdown += `## Connections\n\n`;
    markdown += `| From | To | Type |\n`;
    markdown += `|------|----|----- |\n`;

    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const sourceName = sourceNode.data.service.shortName;
        const targetName = targetNode.data.service.shortName;
        const label = edge.label || "Connection";

        markdown += `| ${sourceName} | ${targetName} | ${label} |\n`;
      }
    });

    markdown += `\n`;
  }

  markdown += `---\n\n`;
  markdown += `*Generated with [ArchFlow](https://github.com/MarkKatsDesign/archflow)*\n`;

  // Download
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `architecture-${Date.now()}.md`;
  link.click();

  URL.revokeObjectURL(url);
};

// ========================================
// PDF EXPORT
// ========================================

export const exportToPDF = async (
  element: HTMLElement,
  nodes: Node<ServiceNodeData>[],
  edges: Edge[],
  metadata?: { totalCost?: { min: number; max: number }; scale?: string },
  isDarkMode: boolean = false
): Promise<void> => {
  try {
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const backgroundColor = isDarkMode ? "#0f172a" : "#f9fafb";

    // Page 1: Architecture Diagram
    pdf.setFontSize(20);
    pdf.text("Architecture Diagram", pageWidth / 2, 15, { align: "center" });

    // Prepare DOM for export and get restore function
    const restore = prepareForExport(element);

    let dataUrl: string;
    try {
      // Capture canvas as image
      dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor,
        filter: (node) => {
          const exclusions = [
            "react-flow__minimap",
            "react-flow__controls",
            "react-flow__panel",
          ];
          return !exclusions.some((classname) =>
            (node as HTMLElement)?.classList?.contains(classname)
          );
        },
      });
    } finally {
      // Always restore DOM even if capture fails
      restore();
    }

    // Add image to PDF
    const imgWidth = pageWidth - 20;
    const imgHeight = (pageHeight - 30) * 0.85;
    pdf.addImage(dataUrl, "PNG", 10, 25, imgWidth, imgHeight);

    // Add metadata footer
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, pageHeight - 10);
    pdf.text(
      `Services: ${nodes.length} | Connections: ${edges.length}`,
      pageWidth / 2,
      pageHeight - 10,
      {
        align: "center",
      }
    );

    if (metadata?.totalCost) {
      pdf.text(
        `Est. Cost: $${metadata.totalCost.min}-$${metadata.totalCost.max}/mo`,
        pageWidth - 10,
        pageHeight - 10,
        { align: "right" }
      );
    }

    // Page 2: Service Details
    pdf.addPage();
    pdf.setFontSize(20);
    pdf.text("Service Details", pageWidth / 2, 15, { align: "center" });

    const services = nodes.map((n) => n.data.service);
    const categories = [...new Set(services.map((s) => s.category))];

    let yPosition = 30;
    const lineHeight = 7;
    const leftMargin = 10;

    categories.forEach((category) => {
      const categoryServices = services.filter((s) => s.category === category);

      // Check if we need a new page
      if (
        yPosition + categoryServices.length * lineHeight * 3 >
        pageHeight - 20
      ) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${category}`, leftMargin, yPosition);
      yPosition += lineHeight;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      categoryServices.forEach((service) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.text(`• ${service.name}`, leftMargin + 5, yPosition);
        yPosition += lineHeight;

        pdf.setFont("helvetica", "normal");
        pdf.text(`  ${service.description}`, leftMargin + 10, yPosition, {
          maxWidth: pageWidth - 30,
        });
        yPosition += lineHeight;

        if (service.costModel?.freeTierAvailable) {
          pdf.text(`  Free Tier Available`, leftMargin + 10, yPosition);
          yPosition += lineHeight;
        }

        yPosition += 3; // Extra spacing between services
      });

      yPosition += 5; // Extra spacing between categories
    });

    // Save PDF
    pdf.save(`architecture-${Date.now()}.pdf`);
  } catch (error) {
    console.error("Failed to export PDF:", error);
    alert("Failed to export PDF");
  }
};
