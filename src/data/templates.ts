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
      // Index 0: VPC (group) - must come first
      {
        type: 'group',
        position: { x: 175, y: 170 },
        data: { zone: { id: 'vpc' }, label: 'AWS VPC' },
        style: { width: 250, height: 180 },
      },
      // Index 1: Vercel (external)
      {
        position: { x: 100, y: 50 },
        data: { service: { id: 'vercel' } },
      },
      // Index 2: Auth0 (external)
      {
        position: { x: 400, y: 50 },
        data: { service: { id: 'auth0' } },
      },
      // Index 3: RDS (inside VPC) - relative position to VPC
      {
        position: { x: 50, y: 50 },
        parentIndex: 0,
        data: { service: { id: 'postgres-rds' } },
      },
      // Index 4: S3 (outside VPC - S3 is regional)
      {
        position: { x: 100, y: 400 },
        data: { service: { id: 'aws-s3' } },
      },
      // Index 5: Algolia (external)
      {
        position: { x: 400, y: 400 },
        data: { service: { id: 'algolia' } },
      },
    ],

    edges: [
      {
        sourceIndex: 1, // Vercel
        targetIndex: 2, // Auth0
        animated: true,
        label: 'Auth Token',
      },
      {
        sourceIndex: 1, // Vercel
        targetIndex: 3, // Postgres RDS
        animated: true,
        label: 'SQL Queries',
      },
      {
        sourceIndex: 1, // Vercel
        targetIndex: 4, // S3
        label: 'File Upload',
      },
      {
        sourceIndex: 1, // Vercel
        targetIndex: 5, // Algolia
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
      // Index 0: VPC (outermost group)
      {
        type: 'group',
        position: { x: 150, y: 130 },
        data: { zone: { id: 'vpc' }, label: 'VPC' },
        style: { width: 300, height: 200 },
      },
      // Index 1: Public Subnet (nested in VPC)
      {
        type: 'group',
        position: { x: 20, y: 40 },
        parentIndex: 0,
        data: { zone: { id: 'public-subnet' }, label: 'Public Subnet' },
        style: { width: 260, height: 130 },
      },
      // Index 2: CloudFront (edge, external)
      {
        position: { x: 225, y: 30 },
        data: { service: { id: 'aws-cloudfront' } },
      },
      // Index 3: Lambda (in public subnet)
      {
        position: { x: 55, y: 35 },
        parentIndex: 1,
        data: { service: { id: 'aws-lambda' } },
      },
      // Index 4: DynamoDB (regional service, outside VPC)
      {
        position: { x: 75, y: 400 },
        data: { service: { id: 'dynamodb' } },
      },
      // Index 5: S3 (regional service)
      {
        position: { x: 250, y: 400 },
        data: { service: { id: 'aws-s3' } },
      },
      // Index 6: SQS (regional service)
      {
        position: { x: 425, y: 400 },
        data: { service: { id: 'aws-sqs' } },
      },
    ],

    edges: [
      {
        sourceIndex: 2, // CloudFront
        targetIndex: 3, // Lambda
        animated: true,
        label: 'HTTP Request',
      },
      {
        sourceIndex: 3, // Lambda
        targetIndex: 4, // DynamoDB
        animated: true,
        label: 'NoSQL Query',
      },
      {
        sourceIndex: 3, // Lambda
        targetIndex: 5, // S3
        label: 'Object Storage',
      },
      {
        sourceIndex: 3, // Lambda
        targetIndex: 6, // SQS
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
      // Index 0: VPC
      {
        type: 'group',
        position: { x: 175, y: 100 },
        data: { zone: { id: 'vpc' }, label: 'VPC' },
        style: { width: 250, height: 200 },
      },
      // Index 1: Private Subnet (for Lambda)
      {
        type: 'group',
        position: { x: 20, y: 40 },
        parentIndex: 0,
        data: { zone: { id: 'private-subnet' }, label: 'Private Subnet' },
        style: { width: 210, height: 130 },
      },
      // Index 2: S3 (event source, outside VPC)
      {
        position: { x: 50, y: 30 },
        data: { service: { id: 'aws-s3' } },
      },
      // Index 3: Lambda (in private subnet)
      {
        position: { x: 30, y: 35 },
        parentIndex: 1,
        data: { service: { id: 'aws-lambda' } },
      },
      // Index 4: SQS (regional)
      {
        position: { x: 475, y: 30 },
        data: { service: { id: 'aws-sqs' } },
      },
      // Index 5: DynamoDB (regional)
      {
        position: { x: 175, y: 370 },
        data: { service: { id: 'dynamodb' } },
      },
      // Index 6: SNS (regional)
      {
        position: { x: 375, y: 370 },
        data: { service: { id: 'aws-sns' } },
      },
    ],

    edges: [
      {
        sourceIndex: 2, // S3
        targetIndex: 3, // Lambda
        animated: true,
        label: 'S3 Event',
      },
      {
        sourceIndex: 3, // Lambda
        targetIndex: 4, // SQS
        animated: true,
        label: 'Queue Job',
      },
      {
        sourceIndex: 4, // SQS
        targetIndex: 3, // Lambda (processor)
        animated: true,
        label: 'Process Batch',
      },
      {
        sourceIndex: 3, // Lambda
        targetIndex: 5, // DynamoDB
        animated: true,
        label: 'Update Status',
      },
      {
        sourceIndex: 3, // Lambda
        targetIndex: 6, // SNS
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
      // Index 0: VPC
      {
        type: 'group',
        position: { x: 50, y: 30 },
        data: { zone: { id: 'vpc' }, label: 'Production VPC' },
        style: { width: 500, height: 470 },
      },
      // Index 1: Public Subnet
      {
        type: 'group',
        position: { x: 25, y: 40 },
        parentIndex: 0,
        data: { zone: { id: 'public-subnet' }, label: 'Public Subnet' },
        style: { width: 450, height: 130 },
      },
      // Index 2: Private Subnet
      {
        type: 'group',
        position: { x: 25, y: 190 },
        parentIndex: 0,
        data: { zone: { id: 'private-subnet' }, label: 'Private Subnet' },
        style: { width: 450, height: 250 },
      },
      // Index 3: ALB (in public subnet)
      {
        position: { x: 150, y: 35 },
        parentIndex: 1,
        data: { service: { id: 'aws-alb' } },
      },
      // Index 4: ECS Service 1 (in private subnet)
      {
        position: { x: 25, y: 35 },
        parentIndex: 2,
        data: { service: { id: 'aws-ecs' } },
      },
      // Index 5: ECS Service 2 (in private subnet)
      {
        position: { x: 250, y: 35 },
        parentIndex: 2,
        data: { service: { id: 'aws-ecs' } },
      },
      // Index 6: ElastiCache (in private subnet)
      {
        position: { x: 25, y: 145 },
        parentIndex: 2,
        data: { service: { id: 'redis-elasticache' } },
      },
      // Index 7: RDS (in private subnet)
      {
        position: { x: 250, y: 145 },
        parentIndex: 2,
        data: { service: { id: 'postgres-rds' } },
      },
      // Index 8: CloudWatch (regional, outside VPC)
      {
        position: { x: 600, y: 200 },
        data: { service: { id: 'aws-cloudwatch' } },
      },
    ],

    edges: [
      {
        sourceIndex: 3, // ALB
        targetIndex: 4, // ECS Service 1
        animated: true,
        label: 'Route Traffic',
      },
      {
        sourceIndex: 3, // ALB
        targetIndex: 5, // ECS Service 2
        animated: true,
        label: 'Load Balance',
      },
      {
        sourceIndex: 4, // ECS Service 1
        targetIndex: 6, // ElastiCache
        animated: true,
        label: 'Cache Read',
      },
      {
        sourceIndex: 4, // ECS Service 1
        targetIndex: 7, // RDS
        animated: true,
        label: 'DB Query',
      },
      {
        sourceIndex: 5, // ECS Service 2
        targetIndex: 7, // RDS
        animated: true,
        label: 'DB Query',
      },
      {
        sourceIndex: 4, // ECS Service 1
        targetIndex: 8, // CloudWatch
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

  // Template 8: ML Training & Inference Platform
  {
    id: 'ml-training-inference-platform',
    name: 'ML Training & Inference Platform',
    description:
      'Production-ready ML platform with the full lifecycle from data ingestion to model deployment. Includes training infrastructure, model registry, real-time inference endpoints, and MLOps tooling.',

    projectTypes: ['ai-ml', 'data-pipeline'],
    idealScale: ['growth', 'enterprise'],
    budgetCompatible: ['moderate', 'flexible', 'enterprise'],

    nodes: [
      // Index 0: VPC (outermost container)
      {
        type: 'group',
        position: { x: 50, y: 80 },
        data: { zone: { id: 'vpc' }, label: 'ML Platform VPC' },
        style: { width: 520, height: 380 },
      },
      // Index 1: Private Subnet (for ML workloads)
      {
        type: 'group',
        position: { x: 25, y: 40 },
        parentIndex: 0,
        data: { zone: { id: 'private-subnet' }, label: 'Private Subnet' },
        style: { width: 470, height: 310 },
      },
      // Index 2: S3 Data Lake (external - regional service)
      {
        position: { x: 50, y: 30 },
        data: { service: { id: 'aws-s3' } },
      },
      // Index 3: SageMaker Training (in private subnet)
      {
        position: { x: 30, y: 40 },
        parentIndex: 1,
        data: { service: { id: 'aws-sagemaker' } },
      },
      // Index 4: SageMaker Inference Endpoint (in private subnet)
      {
        position: { x: 260, y: 40 },
        parentIndex: 1,
        data: { service: { id: 'aws-sagemaker' } },
      },
      // Index 5: Lambda Preprocessing (in private subnet)
      {
        position: { x: 30, y: 180 },
        parentIndex: 1,
        data: { service: { id: 'aws-lambda' } },
      },
      // Index 6: ECR Model Registry (in private subnet)
      {
        position: { x: 260, y: 180 },
        parentIndex: 1,
        data: { service: { id: 'aws-ecr' } },
      },
      // Index 7: API Gateway (external - edge service)
      {
        position: { x: 620, y: 150 },
        data: { service: { id: 'aws-api-gateway' } },
      },
      // Index 8: CloudWatch Monitoring (external)
      {
        position: { x: 620, y: 300 },
        data: { service: { id: 'aws-cloudwatch' } },
      },
      // Index 9: W&B Experiment Tracking (external SaaS)
      {
        position: { x: 620, y: 450 },
        data: { service: { id: 'wandb' } },
      },
    ],

    edges: [
      {
        sourceIndex: 2, // S3
        targetIndex: 3, // SageMaker Training
        animated: true,
        label: 'Training Data',
      },
      {
        sourceIndex: 3, // SageMaker Training
        targetIndex: 6, // ECR
        animated: true,
        label: 'Push Model',
      },
      {
        sourceIndex: 6, // ECR
        targetIndex: 4, // SageMaker Endpoint
        animated: true,
        label: 'Deploy Model',
      },
      {
        sourceIndex: 7, // API Gateway
        targetIndex: 5, // Lambda
        animated: true,
        label: 'Request',
      },
      {
        sourceIndex: 5, // Lambda
        targetIndex: 4, // SageMaker Endpoint
        animated: true,
        label: 'Inference',
      },
      {
        sourceIndex: 5, // Lambda
        targetIndex: 2, // S3
        label: 'Fetch Features',
      },
      {
        sourceIndex: 3, // SageMaker Training
        targetIndex: 9, // W&B
        label: 'Log Metrics',
      },
      {
        sourceIndex: 4, // SageMaker Endpoint
        targetIndex: 8, // CloudWatch
        label: 'Metrics',
      },
    ],

    estimatedMonthlyCost: { min: 200, max: 5000 },
    complexity: 4,

    pros: [
      'Complete ML lifecycle from data to deployment',
      'Fully managed training and inference infrastructure',
      'Built-in experiment tracking with W&B',
      'Auto-scaling inference endpoints',
      'Enterprise-grade security with VPC isolation',
      'Model versioning and registry with ECR',
    ],

    cons: [
      'Higher costs for GPU training instances',
      'Requires ML engineering expertise',
      'AWS vendor lock-in',
      'Complex debugging across distributed components',
    ],
  },

  // Template 9: GenAI/LLM Application
  {
    id: 'genai-llm-application',
    name: 'GenAI/LLM Application',
    description:
      'Modern architecture for building LLM-powered applications with managed foundation models, conversation history, and RAG (Retrieval-Augmented Generation) support.',

    projectTypes: ['ai-ml', 'saas'],
    idealScale: ['startup-mvp', 'growth'],
    budgetCompatible: ['minimal', 'moderate', 'flexible'],

    nodes: [
      // Index 0: Vercel Frontend
      {
        position: { x: 50, y: 50 },
        data: { service: { id: 'vercel' } },
      },
      // Index 1: API Gateway
      {
        position: { x: 250, y: 50 },
        data: { service: { id: 'aws-api-gateway' } },
      },
      // Index 2: Lambda Orchestration
      {
        position: { x: 250, y: 200 },
        data: { service: { id: 'aws-lambda' } },
      },
      // Index 3: Bedrock LLM
      {
        position: { x: 450, y: 200 },
        data: { service: { id: 'aws-bedrock' } },
      },
      // Index 4: DynamoDB (conversation history)
      {
        position: { x: 100, y: 350 },
        data: { service: { id: 'dynamodb' } },
      },
      // Index 5: S3 (RAG documents)
      {
        position: { x: 300, y: 350 },
        data: { service: { id: 'aws-s3' } },
      },
    ],

    edges: [
      {
        sourceIndex: 0, // Vercel
        targetIndex: 1, // API Gateway
        animated: true,
        label: 'Chat Request',
      },
      {
        sourceIndex: 1, // API Gateway
        targetIndex: 2, // Lambda
        animated: true,
        label: 'Invoke',
      },
      {
        sourceIndex: 2, // Lambda
        targetIndex: 3, // Bedrock
        animated: true,
        label: 'LLM Request',
      },
      {
        sourceIndex: 2, // Lambda
        targetIndex: 4, // DynamoDB
        animated: true,
        label: 'Chat History',
      },
      {
        sourceIndex: 2, // Lambda
        targetIndex: 5, // S3
        label: 'RAG Fetch',
      },
    ],

    estimatedMonthlyCost: { min: 20, max: 500 },
    complexity: 2,

    pros: [
      'Quick to deploy LLM-powered features',
      'Access to Claude, Llama, and other top models via Bedrock',
      'Serverless scales from zero to millions',
      'Built-in RAG support with S3 documents',
      'Conversation memory with DynamoDB',
      'Pay-per-token pricing keeps costs low initially',
    ],

    cons: [
      'Token costs can scale quickly with usage',
      'Cold starts may affect latency',
      'Limited model customization vs self-hosted',
      'Requires prompt engineering expertise',
    ],
  },
];
