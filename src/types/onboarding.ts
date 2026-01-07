// Project type categories
export type ProjectType =
  | 'saas'
  | 'ecommerce'
  | 'data-pipeline'
  | 'mobile-backend'
  | 'ai-ml'
  | 'content-site'
  | 'real-time-app'
  | 'microservices'
  | 'other';

// Expected scale/traffic
export type Scale =
  | 'startup-mvp'      // < 1K users/day
  | 'growth'           // 1K - 100K users/day
  | 'enterprise'       // > 100K users/day
  | 'unsure';

// Monthly infrastructure budget ranges
export type BudgetRange =
  | 'free-tier'        // $0/month (free tiers only)
  | 'minimal'          // < $50/month
  | 'moderate'         // $50 - $500/month
  | 'flexible'         // $500 - $5K/month
  | 'enterprise'       // > $5K/month
  | 'unsure';

// Priority dimensions for architecture decisions
export type Priority = 'cost' | 'performance' | 'simplicity' | 'scalability';

// Existing infrastructure (if any)
export type ExistingSystem = 'aws' | 'gcp' | 'azure' | 'vercel' | 'netlify' | 'none';

// Complete onboarding answers from wizard
export interface OnboardingAnswers {
  projectType?: ProjectType;
  scale?: Scale;
  budgetRange?: BudgetRange;
  existingSystems: ExistingSystem[];
  priorities: Priority[];  // Ordered array (first = highest priority)
  completed: boolean;
  completedAt?: string;    // ISO timestamp
}

// Wizard step navigation (1-6, skipping welcome screen 0)
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

// Display labels for UI
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  'saas': 'SaaS Application',
  'ecommerce': 'E-commerce Platform',
  'data-pipeline': 'Data Pipeline',
  'mobile-backend': 'Mobile App Backend',
  'ai-ml': 'AI/ML Platform',
  'content-site': 'Content/Marketing Site',
  'real-time-app': 'Real-time Application',
  'microservices': 'Microservices Architecture',
  'other': 'Other',
};

export const SCALE_LABELS: Record<Scale, { label: string; description: string }> = {
  'startup-mvp': {
    label: 'Startup MVP',
    description: '< 1,000 users/day',
  },
  'growth': {
    label: 'Growth Stage',
    description: '1K - 100K users/day',
  },
  'enterprise': {
    label: 'Enterprise Scale',
    description: '> 100K users/day',
  },
  'unsure': {
    label: 'Not Sure Yet',
    description: 'Help me decide',
  },
};

export const BUDGET_LABELS: Record<BudgetRange, { label: string; description: string }> = {
  'free-tier': {
    label: 'Free Tier',
    description: '$0/month',
  },
  'minimal': {
    label: 'Minimal Budget',
    description: '< $50/month',
  },
  'moderate': {
    label: 'Moderate Budget',
    description: '$50 - $500/month',
  },
  'flexible': {
    label: 'Flexible Budget',
    description: '$500 - $5K/month',
  },
  'enterprise': {
    label: 'Enterprise Budget',
    description: '> $5K/month',
  },
  'unsure': {
    label: 'Not Sure Yet',
    description: 'Help me estimate',
  },
};

export const PRIORITY_LABELS: Record<Priority, { label: string; description: string }> = {
  'cost': {
    label: 'Cost Efficiency',
    description: 'Minimize monthly expenses',
  },
  'performance': {
    label: 'Performance',
    description: 'Maximize speed and responsiveness',
  },
  'simplicity': {
    label: 'Simplicity',
    description: 'Easy to set up and maintain',
  },
  'scalability': {
    label: 'Scalability',
    description: 'Handle growth seamlessly',
  },
};

export const EXISTING_SYSTEM_LABELS: Record<ExistingSystem, string> = {
  'aws': 'Amazon Web Services (AWS)',
  'gcp': 'Google Cloud Platform (GCP)',
  'azure': 'Microsoft Azure',
  'vercel': 'Vercel',
  'netlify': 'Netlify',
  'none': 'None / Starting Fresh',
};
