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
        label: 'Data & Auth',
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 2, // Cloudflare CDN
        label: 'Static Assets',
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
        label: 'Auth Token',
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 2, // Postgres RDS
        animated: true,
        label: 'SQL Queries',
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 3, // S3
        label: 'File Upload',
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 4, // Algolia
        animated: true,
        label: 'Search API',
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
        label: 'HTTP Request',
      },
      {
        sourceIndex: 1, // Lambda
        targetIndex: 2, // DynamoDB
        animated: true,
        label: 'NoSQL Query',
      },
      {
        sourceIndex: 1, // Lambda
        targetIndex: 3, // S3
        label: 'Object Storage',
      },
      {
        sourceIndex: 1, // Lambda
        targetIndex: 4, // SQS
        animated: true,
        label: 'Async Job',
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

  // Template 4: Modern SaaS (Jamstack)
  {
    id: 'modern-saas-jamstack',
    name: 'Modern SaaS (Jamstack)',
    description:
      'High-velocity stack for startups with managed auth, payments, email, and real-time database. Everything you need to launch a SaaS product.',

    projectTypes: ['saas', 'mobile-backend'],
    idealScale: ['startup-mvp', 'growth'],
    budgetCompatible: ['free-tier', 'minimal', 'moderate'],

    nodes: [
      {
        position: { x: 250, y: 50 },
        data: { service: { id: 'vercel' } },
      },
      {
        position: { x: 100, y: 200 },
        data: { service: { id: 'clerk' } },
      },
      {
        position: { x: 250, y: 200 },
        data: { service: { id: 'supabase' } },
      },
      {
        position: { x: 400, y: 200 },
        data: { service: { id: 'stripe' } },
      },
      {
        position: { x: 250, y: 350 },
        data: { service: { id: 'resend' } },
      },
    ],

    edges: [
      {
        sourceIndex: 0, // Vercel
        targetIndex: 1, // Clerk
        animated: true,
        label: 'User Auth',
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 2, // Supabase
        animated: true,
        label: 'Realtime Data',
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 3, // Stripe
        animated: true,
        label: 'Payments',
      },
      {
        sourceIndex: 0, // Vercel
        targetIndex: 4, // Resend
        label: 'Email',
      },
    ],

    estimatedMonthlyCost: { min: 0, max: 50 },
    complexity: 2,

    pros: [
      'Complete SaaS starter with auth, payments, and email',
      'Generous free tiers for early-stage startups',
      'Minimal backend code required',
      'Built-in user management UI with Clerk',
      'Stripe integration for subscriptions',
    ],

    cons: [
      'Vendor lock-in across multiple services',
      'Limited backend customization',
      'May need migration for complex requirements',
    ],
  },

  // Template 5: Event-Driven Serverless
  {
    id: 'event-driven-serverless',
    name: 'Event-Driven Serverless',
    description:
      'Fully decoupled architecture for async processing. Perfect for image processing, video encoding, data pipelines, or complex workflows.',

    projectTypes: ['data-pipeline', 'microservices'],
    idealScale: ['growth', 'enterprise'],
    budgetCompatible: ['minimal', 'moderate'],

    nodes: [
      {
        position: { x: 100, y: 50 },
        data: { service: { id: 'aws-s3' } },
      },
      {
        position: { x: 250, y: 50 },
        data: { service: { id: 'aws-lambda' } },
      },
      {
        position: { x: 400, y: 50 },
        data: { service: { id: 'aws-sqs' } },
      },
      {
        position: { x: 250, y: 200 },
        data: { service: { id: 'dynamodb' } },
      },
      {
        position: { x: 400, y: 200 },
        data: { service: { id: 'aws-sns' } },
      },
    ],

    edges: [
      {
        sourceIndex: 0, // S3
        targetIndex: 1, // Lambda
        animated: true,
        label: 'S3 Event',
      },
      {
        sourceIndex: 1, // Lambda
        targetIndex: 2, // SQS
        animated: true,
        label: 'Queue Job',
      },
      {
        sourceIndex: 2, // SQS
        targetIndex: 1, // Lambda (processor)
        animated: true,
        label: 'Process Batch',
      },
      {
        sourceIndex: 1, // Lambda
        targetIndex: 3, // DynamoDB
        animated: true,
        label: 'Update Status',
      },
      {
        sourceIndex: 1, // Lambda
        targetIndex: 4, // SNS
        label: 'Notify',
      },
    ],

    estimatedMonthlyCost: { min: 10, max: 200 },
    complexity: 4,

    pros: [
      'Fully asynchronous and decoupled',
      'Scales automatically with workload',
      'Pay only for actual processing time',
      'Handles millions of events per day',
      'Built-in retry and dead-letter queues',
    ],

    cons: [
      'Complex debugging and monitoring',
      'Requires understanding of event-driven patterns',
      'Higher AWS expertise needed',
      'Harder to test locally',
    ],
  },

  // Template 6: Containerized Microservices
  {
    id: 'containerized-microservices',
    name: 'Containerized Microservices',
    description:
      'Enterprise-grade architecture with containers, load balancing, caching, and monitoring. Built for scale and reliability.',

    projectTypes: ['microservices', 'ecommerce'],
    idealScale: ['growth', 'enterprise'],
    budgetCompatible: ['flexible', 'enterprise'],

    nodes: [
      {
        position: { x: 250, y: 50 },
        data: { service: { id: 'aws-alb' } },
      },
      {
        position: { x: 100, y: 200 },
        data: { service: { id: 'aws-ecs' } },
      },
      {
        position: { x: 400, y: 200 },
        data: { service: { id: 'aws-ecs' } },
      },
      {
        position: { x: 100, y: 350 },
        data: { service: { id: 'redis-elasticache' } },
      },
      {
        position: { x: 250, y: 350 },
        data: { service: { id: 'postgres-rds' } },
      },
      {
        position: { x: 400, y: 350 },
        data: { service: { id: 'aws-cloudwatch' } },
      },
    ],

    edges: [
      {
        sourceIndex: 0, // ALB
        targetIndex: 1, // ECS Service 1
        animated: true,
        label: 'Route Traffic',
      },
      {
        sourceIndex: 0, // ALB
        targetIndex: 2, // ECS Service 2
        animated: true,
        label: 'Load Balance',
      },
      {
        sourceIndex: 1, // ECS Service 1
        targetIndex: 3, // ElastiCache
        animated: true,
        label: 'Cache Read',
      },
      {
        sourceIndex: 1, // ECS Service 1
        targetIndex: 4, // RDS
        animated: true,
        label: 'DB Query',
      },
      {
        sourceIndex: 2, // ECS Service 2
        targetIndex: 4, // RDS
        animated: true,
        label: 'DB Query',
      },
      {
        sourceIndex: 1, // ECS Service 1
        targetIndex: 5, // CloudWatch
        label: 'Metrics',
      },
    ],

    estimatedMonthlyCost: { min: 150, max: 1000 },
    complexity: 5,

    pros: [
      'Full control over runtime environment',
      'Handles heavy compute workloads',
      'Independent service scaling',
      'Battle-tested for enterprise use',
      'Comprehensive monitoring and logging',
    ],

    cons: [
      'High operational complexity',
      'Requires container expertise',
      'Higher base costs',
      'More infrastructure to manage',
    ],
  },

  // Template 7: Rapid PaaS Monolith
  {
    id: 'rapid-paas-monolith',
    name: 'Rapid PaaS Monolith',
    description:
      'The fastest path from idea to production. Deploy a traditional full-stack app without managing any infrastructure.',

    projectTypes: ['saas', 'content-site'],
    idealScale: ['startup-mvp', 'unsure'],
    budgetCompatible: ['minimal', 'moderate'],

    nodes: [
      {
        position: { x: 250, y: 50 },
        data: { service: { id: 'render' } },
      },
      {
        position: { x: 100, y: 200 },
        data: { service: { id: 'planetscale' } },
      },
      {
        position: { x: 250, y: 200 },
        data: { service: { id: 'upstash-redis' } },
      },
      {
        position: { x: 400, y: 200 },
        data: { service: { id: 'github-actions' } },
      },
    ],

    edges: [
      {
        sourceIndex: 0, // Render
        targetIndex: 1, // PlanetScale
        animated: true,
        label: 'MySQL Query',
      },
      {
        sourceIndex: 0, // Render
        targetIndex: 2, // Upstash Redis
        animated: true,
        label: 'Session Cache',
      },
      {
        sourceIndex: 3, // GitHub Actions
        targetIndex: 0, // Render
        label: 'Deploy',
      },
    ],

    estimatedMonthlyCost: { min: 7, max: 100 },
    complexity: 1,

    pros: [
      'Simplest deployment model',
      'All services have generous free tiers',
      'Automatic deployments with GitHub',
      'Perfect for indie hackers and MVPs',
      'No infrastructure management',
    ],

    cons: [
      'Less control over infrastructure',
      'Monolithic architecture limits scaling',
      'May need refactoring for high traffic',
      'Limited to supported frameworks',
    ],
  },
];
