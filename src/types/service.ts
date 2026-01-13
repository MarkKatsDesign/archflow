export const Category = {
  Frontend: 'Frontend',
  Backend: 'Backend',
  Database: 'Database',
  Cache: 'Cache',
  Queue: 'Queue',
  Storage: 'Storage',
  CDN: 'CDN',
  Auth: 'Auth',
  Analytics: 'Analytics',
  AIml: 'AI/ML',
  Monitoring: 'Monitoring',
  Search: 'Search',
  Networking: 'Networking',
  DevOps: 'DevOps',
  Integrations: 'Integrations',
} as const;

export type Category = typeof Category[keyof typeof Category];

export const Provider = {
  AWS: 'AWS',
  GCP: 'GCP',
  Azure: 'Azure',
  Vercel: 'Vercel',
  Netlify: 'Netlify',
  Cloudflare: 'Cloudflare',
  Supabase: 'Supabase',
  Railway: 'Railway',
  Render: 'Render',
  OpenSource: 'OpenSource',
  SaaS: 'SaaS',
} as const;

export type Provider = typeof Provider[keyof typeof Provider];

export type UseCase =
  | 'saas-mvp'
  | 'ecommerce'
  | 'data-pipeline'
  | 'mobile-backend'
  | 'microservices'
  | 'ai-ml'
  | 'content-site'
  | 'real-time-app'
  | 'general';

export type ManagedLevel = 'fully' | 'partial' | 'self';

export interface CostModel {
  type: 'fixed' | 'usage' | 'tiered' | 'free';
  baseCost?: number;           // Monthly base in USD
  scalingFactor?: number;      // Cost multiplier per scale tier
  freeTierAvailable: boolean;
  estimatedMonthlyCost?: {     // For display purposes
    min: number;
    max: number;
  };
  lastUpdated?: string;        // Date when pricing was last verified (YYYY-MM format)
  pricingUrl?: string;         // Link to official pricing page
  confidence?: 'low' | 'medium' | 'high';  // Confidence level in estimate accuracy
  assumptions?: string;        // Notes about what the estimate assumes
}

export interface Service {
  id: string;
  name: string;
  shortName: string;
  category: Category;
  provider: Provider;
  icon?: string;
  description: string;
  color: string; // For visual styling

  // Phase 2: Enhanced metadata
  compatibleWith?: string[];      // Service IDs that work well together
  incompatibleWith?: string[];    // Service IDs that conflict
  requiresOneOf?: string[];       // Must have at least one of these

  costModel?: CostModel;

  scalability?: 1 | 2 | 3 | 4 | 5;        // 1=low, 5=high
  complexity?: 1 | 2 | 3 | 4 | 5;         // 1=simple, 5=complex
  managedLevel?: ManagedLevel;
  useCases?: UseCase[];

  // Additional details for the panel
  documentation?: string;         // URL to docs
  tags?: string[];               // Additional tags for search/filtering
}
