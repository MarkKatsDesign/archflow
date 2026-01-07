import type { ArchitectureTemplate } from '../types/template';

export const templates: ArchitectureTemplate[] = [
  // Template 1: SaaS MVP Starter
  {
    id: 'saas-mvp-starter',
    name: 'SaaS MVP Starter',
    description:
      'Perfect for launching a SaaS product quickly. Includes frontend hosting, database, authentication, and CDN - all with generous free tiers.',

    projectTypes: ['saas', 'content-site'],
    idealScale: ['startup-mvp', 'unsure'],
    budgetCompatible: ['free-tier', 'minimal'],

    nodes: [
      {
        position: { x: 250, y: 50 },
        data: { service: { id: 'vercel' } },
      },
      {
        position: { x: 250, y: 200 },
        data: { service: { id: 'supabase' } },
      },
      {
        position: { x: 250, y: 350 },
        data: { service: { id: 'cloudflare-cdn' } },
      },
    ],

    edges: [
      {
        sourceIndex: 0, // Vercel
        targetIndex: 1, // Supabase
        animated: true,
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 2, // Cloudflare CDN
      },
    ],

    estimatedMonthlyCost: { min: 0, max: 20 },
    complexity: 1,

    pros: [
      'Free tier available for all services',
      'Quick setup with minimal configuration',
      'Built-in authentication and database',
      'Automatic scaling and CDN',
    ],

    cons: [
      'Limited customization options',
      'Vendor lock-in with Supabase',
      'May need migration as you grow',
    ],
  },

  // Template 2: E-commerce Standard
  {
    id: 'ecommerce-standard',
    name: 'E-commerce Standard',
    description:
      'Production-ready e-commerce stack with robust authentication, scalable database, cloud storage, and powerful search capabilities.',

    projectTypes: ['ecommerce', 'saas'],
    idealScale: ['growth', 'enterprise'],
    budgetCompatible: ['moderate', 'flexible'],

    nodes: [
      {
        position: { x: 100, y: 50 },
        data: { service: { id: 'vercel' } },
      },
      {
        position: { x: 400, y: 50 },
        data: { service: { id: 'auth0' } },
      },
      {
        position: { x: 250, y: 200 },
        data: { service: { id: 'postgres-rds' } },
      },
      {
        position: { x: 100, y: 350 },
        data: { service: { id: 'aws-s3' } },
      },
      {
        position: { x: 400, y: 350 },
        data: { service: { id: 'algolia' } },
      },
    ],

    edges: [
      {
        sourceIndex: 0, // Vercel
        targetIndex: 1, // Auth0
        animated: true,
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 2, // Postgres RDS
        animated: true,
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 3, // S3
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 4, // Algolia
        animated: true,
      },
    ],

    estimatedMonthlyCost: { min: 100, max: 500 },
    complexity: 3,

    pros: [
      'Scalable to millions of users',
      'Robust authentication with Auth0',
      'Fast product search with Algolia',
      'Secure file storage with S3',
      'Battle-tested components',
    ],

    cons: [
      'Higher monthly costs',
      'More complex setup and configuration',
      'Requires AWS knowledge',
    ],
  },

  // Template 3: Serverless AWS
  {
    id: 'serverless-aws',
    name: 'Serverless AWS',
    description:
      'Fully serverless architecture on AWS with Lambda functions, NoSQL database, and pay-per-use pricing. Scales automatically from zero to millions.',

    projectTypes: ['saas', 'mobile-backend', 'microservices'],
    idealScale: ['startup-mvp', 'growth'],
    budgetCompatible: ['minimal', 'moderate'],

    nodes: [
      {
        position: { x: 250, y: 50 },
        data: { service: { id: 'aws-cloudfront' } },
      },
      {
        position: { x: 250, y: 200 },
        data: { service: { id: 'aws-lambda' } },
      },
      {
        position: { x: 100, y: 350 },
        data: { service: { id: 'dynamodb' } },
      },
      {
        position: { x: 250, y: 500 },
        data: { service: { id: 'aws-s3' } },
      },
      {
        position: { x: 400, y: 350 },
        data: { service: { id: 'aws-sqs' } },
      },
    ],

    edges: [
      {
        sourceIndex: 0, // CloudFront
        targetIndex: 1, // Lambda
        animated: true,
      },
      {
        sourceIndex: 1, // Lambda
        targetIndex: 2, // DynamoDB
        animated: true,
      },
      {
        sourceIndex: 1, // Lambda
        targetIndex: 3, // S3
      },
      {
        sourceIndex: 1, // Lambda
        targetIndex: 4, // SQS
        animated: true,
      },
    ],

    estimatedMonthlyCost: { min: 20, max: 150 },
    complexity: 3,

    pros: [
      'Pay only for what you use',
      'Auto-scales from zero to infinity',
      'No server management required',
      'Full AWS ecosystem access',
      'Great for variable workloads',
    ],

    cons: [
      'Cold start latency',
      'AWS learning curve',
      'Vendor lock-in',
      'Complex debugging',
    ],
  },
];
