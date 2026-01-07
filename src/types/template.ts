import type { ProjectType, Scale, BudgetRange } from './onboarding';

// Node template without generated IDs
export interface TemplateNode {
  position: { x: number; y: number };
  data: {
    service: {
      id: string;  // Service ID from services.ts
    };
  };
  type?: string;
}

// Edge template with source/target indices instead of IDs
export interface TemplateEdge {
  sourceIndex: number;  // Index in nodes array
  targetIndex: number;  // Index in nodes array
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
