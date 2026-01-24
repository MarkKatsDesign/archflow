import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import type { Node, Edge, ReactFlowInstance, Viewport } from "reactflow";
import type { ServiceNodeData, ArchNode } from "../types/architecture";

// ========================================
// VIEWPORT UTILITIES FOR FULL EXPORT
// ========================================

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate the bounding box that contains all nodes
 */
function calculateNodesBounds(nodes: Node[]): NodeBounds | null {
  if (nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const width = node.width || 168; // Default node width
    const height = node.height || 100; // Default node height

    // For child nodes, we need to calculate absolute position
    let absoluteX = node.position.x;
    let absoluteY = node.position.y;

    if (node.parentNode) {
      const parent = nodes.find((n) => n.id === node.parentNode);
      if (parent) {
        absoluteX += parent.position.x;
        absoluteY += parent.position.y;
      }
    }

    minX = Math.min(minX, absoluteX);
    minY = Math.min(minY, absoluteY);
    maxX = Math.max(maxX, absoluteX + width);
    maxY = Math.max(maxY, absoluteY + height);
  });

  // Add padding around the bounds
  const padding = 50;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/**
 * Calculate viewport to fit given bounds within container dimensions
 */
function getViewportForBounds(
  bounds: NodeBounds,
  containerWidth: number,
  containerHeight: number,
  minZoom: number = 0.1,
  maxZoom: number = 1,
  padding: number = 0.1,
): Viewport {
  const xZoom = containerWidth / bounds.width;
  const yZoom = containerHeight / bounds.height;
  const zoom = Math.min(xZoom, yZoom) * (1 - padding);
  const clampedZoom = Math.min(Math.max(zoom, minZoom), maxZoom);

  const x =
    (containerWidth - bounds.width * clampedZoom) / 2 - bounds.x * clampedZoom;
  const y =
    (containerHeight - bounds.height * clampedZoom) / 2 -
    bounds.y * clampedZoom;

  return { x, y, zoom: clampedZoom };
}

// ========================================
// JSON EXPORT/IMPORT
// ========================================

export interface ArchitectureExport {
  version: string;
  exportDate: string;
  nodes: ArchNode[];
  edges: Edge[];
  metadata?: {
    totalServices: number;
    categories: string[];
    estimatedCost?: { min: number; max: number };
  };
}

export const exportToJSON = (
  nodes: ArchNode[],
  edges: Edge[],
  metadata?: ArchitectureExport["metadata"],
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

/**
 * Migrate old handle names to new multi-handle format
 * Old formats:
 *   - "bottom" -> "bottom-s-4" or "bottom-t-4"
 *   - "left-4" -> "left-s-4" or "left-t-4"
 * New format: "side-type-index" (e.g., "left-s-4", "right-t-7")
 */
function migrateHandleId(
  handleId: string | null | undefined,
  isSource: boolean = true,
): string | null | undefined {
  if (!handleId) return handleId;

  const type = isSource ? "s" : "t";

  // Check if already in new format with type indicator (side-type-index)
  const newMatch = handleId.match(/^(top|bottom|left|right)-([st])-(\d+)$/);
  if (newMatch) {
    // Already in new format
    return handleId;
  }

  // Check if in old format without type (side-index)
  const oldMatch = handleId.match(/^(top|bottom|left|right)-(\d+)$/);
  if (oldMatch) {
    const [, side, indexStr] = oldMatch;
    let index = parseInt(indexStr, 10);

    // If index is in old 3-handle range (0-2), map to new 10-handle range
    // Old: 0, 1, 2 -> New: 1, 4, 8 (roughly equivalent positions)
    if (index <= 2) {
      index = index === 0 ? 1 : index === 1 ? 4 : 8;
    }

    // Add type indicator
    return `${side}-${type}-${index}`;
  }

  // Old format: just the side name - migrate to middle handle (index 4 out of 0-9)
  if (["top", "bottom", "left", "right"].includes(handleId)) {
    return `${handleId}-${type}-4`;
  }

  // Unknown format, return as-is
  return handleId;
}

/**
 * Migrate edges to use new multi-handle format
 */
function migrateEdges(edges: Edge[]): Edge[] {
  return edges.map((edge) => ({
    ...edge,
    sourceHandle: migrateHandleId(edge.sourceHandle, true),
    targetHandle: migrateHandleId(edge.targetHandle, false),
  }));
}

export const importFromJSON = (
  file: File,
  callback: (data: ArchitectureExport) => void,
): void => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as ArchitectureExport;

      // Migrate edges to new handle format if needed
      data.edges = migrateEdges(data.edges);

      callback(data);
    } catch {
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
  isDarkMode: boolean = false,
  reactFlowInstance?: ReactFlowInstance,
  nodes?: Node[],
): Promise<void> => {
  try {
    const backgroundColor = isDarkMode ? "#0f172a" : "#f9fafb";

    // Save current viewport to restore later
    let originalViewport: Viewport | null = null;

    // If we have the React Flow instance and nodes, fit to show entire architecture
    if (reactFlowInstance && nodes && nodes.length > 0) {
      originalViewport = reactFlowInstance.getViewport();
      const bounds = calculateNodesBounds(nodes);

      if (bounds) {
        // Get the container dimensions
        const container = element.parentElement;
        const containerWidth = container?.clientWidth || 1200;
        const containerHeight = container?.clientHeight || 800;

        // Calculate viewport to fit all nodes
        const fitViewport = getViewportForBounds(
          bounds,
          containerWidth,
          containerHeight,
          0.1,
          1,
          0.05,
        );

        // Apply the viewport
        reactFlowInstance.setViewport(fitViewport);

        // Wait for the viewport change to render
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

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
            (node as HTMLElement)?.classList?.contains(classname),
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

      // Restore original viewport
      if (originalViewport && reactFlowInstance) {
        reactFlowInstance.setViewport(originalViewport);
      }
    }
  } catch {
    alert("Failed to export image");
  }
};

// ========================================
// MARKDOWN EXPORT
// ========================================

export const exportToMarkdown = (
  nodes: Node<ServiceNodeData>[],
  edges: Edge[],
  metadata?: { totalCost?: { min: number; max: number }; scale?: string },
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
  isDarkMode: boolean = false,
  reactFlowInstance?: ReactFlowInstance,
): Promise<void> => {
  try {
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const backgroundColor = isDarkMode ? "#0f172a" : "#f9fafb";

    // Page 1: Architecture Diagram
    pdf.setFontSize(20);
    pdf.text("Architecture Diagram", pageWidth / 2, 15, { align: "center" });

    // Save current viewport to restore later
    let originalViewport: Viewport | null = null;

    // If we have the React Flow instance and nodes, fit to show entire architecture
    if (reactFlowInstance && nodes && nodes.length > 0) {
      originalViewport = reactFlowInstance.getViewport();
      const bounds = calculateNodesBounds(nodes);

      if (bounds) {
        // Get the container dimensions
        const container = element.parentElement;
        const containerWidth = container?.clientWidth || 1200;
        const containerHeight = container?.clientHeight || 800;

        // Calculate viewport to fit all nodes
        const fitViewport = getViewportForBounds(
          bounds,
          containerWidth,
          containerHeight,
          0.1,
          1,
          0.05,
        );

        // Apply the viewport
        reactFlowInstance.setViewport(fitViewport);

        // Wait for the viewport change to render
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

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
            (node as HTMLElement)?.classList?.contains(classname),
          );
        },
      });
    } finally {
      // Always restore DOM even if capture fails
      restore();

      // Restore original viewport
      if (originalViewport && reactFlowInstance) {
        reactFlowInstance.setViewport(originalViewport);
      }
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
      },
    );

    if (metadata?.totalCost) {
      pdf.text(
        `Est. Cost: $${metadata.totalCost.min}-$${metadata.totalCost.max}/mo`,
        pageWidth - 10,
        pageHeight - 10,
        { align: "right" },
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
  } catch {
    alert("Failed to export PDF");
  }
};
