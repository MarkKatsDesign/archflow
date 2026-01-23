import type { ProjectType, Scale, BudgetRange } from './onboarding';

// Base position for all template nodes
interface TemplateNodeBase {
  position: { x: number; y: number };
  parentIndex?: number; // Index of parent group in nodes array (for nesting)
}

// Service template node
export interface TemplateServiceNode extends TemplateNodeBase {
  type?: 'service'; // Optional for backward compatibility (defaults to 'service')
  data: {
    service: {
      id: string; // Service ID from services.ts
    };
  };
}

// Group/Zone template node
export interface TemplateGroupNode extends TemplateNodeBase {
  type: 'group'; // Required to identify as group
  data: {
    zone: {
      id: string; // Zone ID from infrastructure.ts (e.g., 'vpc', 'public-subnet')
    };
    label?: string; // Optional custom label
  };
  style: {
    width: number;
    height: number;
  };
}

// Union type for template nodes
export type TemplateNode = TemplateServiceNode | TemplateGroupNode;

// Type guard for group nodes
export function isTemplateGroupNode(node: TemplateNode): node is TemplateGroupNode {
  return node.type === 'group';
}

// Edge template with source/target indices instead of IDs
export interface TemplateEdge {
  sourceIndex: number;  // Index in nodes array
  targetIndex: number;  // Index in nodes array
  sourceHandle?: 'top' | 'bottom' | 'left' | 'right';  // Optional: auto-calculated if not provided
  targetHandle?: 'top' | 'bottom' | 'left' | 'right';  // Optional: auto-calculated if not provided
  type?: string;
  animated?: boolean;
  label?: string;
}

// Complete architecture template
export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;

  // Matching criteria
  projectTypes: ProjectType[];
  idealScale: Scale[];
  budgetCompatible: BudgetRange[];

  // Architecture definition
  nodes: TemplateNode[];
  edges: TemplateEdge[];

  // Metadata for display and comparison
  estimatedMonthlyCost: {
    min: number;
    max: number;
  };
  complexity: 1 | 2 | 3 | 4 | 5;  // 1 = simple, 5 = complex
  pros: string[];
  cons: string[];
}

// Result of template matching algorithm
export interface TemplateMatch {
  template: ArchitectureTemplate;
  score: number;           // 0-100
  matchReasons: string[];  // Why this template was recommended
}
