import { Category } from "../types/service";
import type { Service } from "../types/service";

// Category color mapping for visual consistency
export const categoryColors: Record<Category, string> = {
  [Category.Frontend]: "#3b82f6", // Blue
  [Category.Backend]: "#8b5cf6", // Purple
  [Category.Database]: "#10b981", // Green
  [Category.Cache]: "#f59e0b", // Amber
  [Category.Queue]: "#ec4899", // Pink
  [Category.Storage]: "#06b6d4", // Cyan
  [Category.CDN]: "#6366f1", // Indigo
  [Category.Auth]: "#f97316", // Orange
  [Category.Analytics]: "#84cc16", // Lime
  [Category.AIml]: "#a855f7", // Purple
  [Category.Monitoring]: "#14b8a6", // Teal
  [Category.Search]: "#eab308", // Yellow
  [Category.Networking]: "#0ea5e9", // Sky Blue
  [Category.DevOps]: "#64748b", // Slate
  [Category.Integrations]: "#22c55e", // Green
};

export const services: Service[] = [
  // Frontend/CDN
  {
    id: "vercel",
    name: "Vercel",
    shortName: "Vercel",
    category: Category.Frontend,
    provider: "Vercel",
    description:
      "Full-stack platform for frontend with serverless functions, edge runtime, and automatic CI/CD",
    color: categoryColors.Frontend,
    compatibleWith: [
      "supabase",
      "planetscale",
      "postgres-rds",
      "mongodb-atlas",
      "aws-s3",
      "cloudflare-r2",
      "auth0",
      "clerk",
      "algolia",
      "stripe",
      "resend",
    ],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 50 },
      lastUpdated: "2026-01",
      pricingUrl: "https://vercel.com/pricing",
      confidence: "medium",
      assumptions:
        "Hobby plan is free forever for personal projects. Pro plan starts at $20/mo + additional usage; estimate assumes low-to-moderate usage.",
    },
    scalability: 5,
    complexity: 1,
    managedLevel: "fully",
    useCases: ["saas-mvp", "content-site", "ecommerce"],
    documentation: "https://vercel.com/docs",
    tags: [
      "serverless",
      "hosting",
      "ci-cd",
      "edge",
      "full-stack",
      "api-routes",
    ],
  },
  {
    id: "netlify",
    name: "Netlify",
    shortName: "Netlify",
    category: Category.Frontend,
    provider: "Netlify",
    description:
      "Full-stack platform with serverless functions, edge handlers, and automatic deployments",
    color: categoryColors.Frontend,
    compatibleWith: [
      "supabase",
      "planetscale",
      "postgres-rds",
      "mongodb-atlas",
      "aws-s3",
      "auth0",
      "clerk",
      "stripe",
      "resend",
      "sanity",
      "contentful",
    ],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 40 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.netlify.com/pricing/",
      confidence: "medium",
      assumptions:
        "Free tier available. Personal plan at $9/mo. Pro plan starts at $20/member per month plus usage-based charges.",
    },
    scalability: 5,
    complexity: 1,
    managedLevel: "fully",
    useCases: ["saas-mvp", "content-site", "ecommerce"],
    documentation: "https://docs.netlify.com",
    tags: ["serverless", "hosting", "ci-cd", "full-stack", "functions"],
  },
  {
    id: "cloudflare-pages",
    name: "Cloudflare Pages",
    shortName: "CF Pages",
    category: Category.Frontend,
    provider: "Cloudflare",
    description:
      "Full-stack platform with Pages Functions, Workers, and global edge network",
    color: categoryColors.Frontend,
    compatibleWith: [
      "supabase",
      "planetscale",
      "cloudflare-r2",
      "aws-s3",
      "auth0",
      "clerk",
      "stripe",
      "sanity",
    ],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 30 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.cloudflare.com/en-au/plans/developer-platform/",
      confidence: "medium",
      assumptions:
        "Static hosting is free. Pages Functions use Cloudflare Workers pricing: Free tier includes 100k requests/day; Paid plan starts at $5/mo with usage-based charges.",
    },
    scalability: 5,
    complexity: 1,
    managedLevel: "fully",
    useCases: ["saas-mvp", "content-site"],
    documentation: "https://developers.cloudflare.com/",
    tags: ["serverless", "hosting", "edge", "full-stack", "workers"],
  },
  {
    id: "cloudflare-cdn",
    name: "Cloudflare CDN",
    shortName: "CF CDN",
    category: Category.CDN,
    provider: "Cloudflare",
    description:
      "Global content delivery network with 330+ data centers, unmetered DDoS protection, and edge caching",
    color: categoryColors.CDN,
    compatibleWith: [
      "vercel",
      "netlify",
      "cloudflare-pages",
      "aws-s3",
      "cloudflare-r2",
    ],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 200 },
      lastUpdated: "2026-01",
      pricingUrl:
        "https://www.cloudflare.com/en-au/application-services/products/cdn/#pricing",
      confidence: "medium",
      assumptions:
        "CDN included in all plans. Free tier available. Pro at $20/mo (annual), Business at $200/mo (annual). CDN usage does not incur per-GB fees; higher tiers add security and performance features.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "content-site", "general"],
    documentation: "https://developers.cloudflare.com/cache/",
    tags: ["cdn", "cache", "ddos-protection", "edge"],
  },
  {
    id: "aws-cloudfront",
    name: "AWS CloudFront",
    shortName: "CloudFront",
    category: Category.CDN,
    provider: "AWS",
    description:
      "Global content delivery network with flat-rate plans, built-in security, and no overage charges",
    color: categoryColors.CDN,
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: {
        min: 0,
        max: 1000,
      },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/cloudfront/pricing/",
      confidence: "high",
      assumptions:
        "CloudFront uses flat-rate pricing plans with no overage charges. Free plan includes 1M requests and 100GB data transfer. Pro is $15/mo, Business $200/mo, Premium $1,000/mo. Higher tiers include larger usage allowances and advanced security features.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "content-site", "general"],
    documentation: "https://docs.aws.amazon.com/cloudfront/",
    tags: ["cdn", "cache", "edge", "global"],
  },

  // Backend/Compute
  {
    id: "aws-lambda",
    name: "AWS Lambda",
    shortName: "Lambda",
    category: Category.Backend,
    provider: "AWS",
    description:
      "Serverless compute service that runs code in response to events",
    color: categoryColors.Backend,
    compatibleWith: [
      "aws-s3",
      "dynamodb",
      "aws-sqs",
      "aws-sns",
      "postgres-rds",
      "redis-elasticache",
    ],
    incompatibleWith: ["gcp-cloud-run"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 150 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/lambda/pricing/",
      confidence: "medium",
      assumptions:
        "Free tier includes 1M requests and 400k GB-seconds per month. Pricing scales with request count, memory size, and execution duration. Additional charges apply for Provisioned Concurrency, ephemeral storage, SnapStart, and data transfer.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "mobile-backend", "data-pipeline", "general"],
    documentation: "https://docs.aws.amazon.com/lambda/",
    tags: ["serverless", "compute", "event-driven"],
  },
  {
    id: "aws-ecs",
    name: "Amazon ECS",
    shortName: "ECS",
    category: Category.Backend,
    provider: "AWS",
    description:
      "Fully managed container orchestration service supporting EC2, Fargate, and ECS Managed Instances",
    color: categoryColors.Backend,
    compatibleWith: [
      "aws-fargate",
      "aws-ecs-ec2",
      "aws-ecs-managed",
      "postgres-rds",
      "dynamodb",
      "redis-elasticache",
      "aws-s3",
      "aws-sqs",
      "aws-sns",
    ],
    costModel: {
      type: "free",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 0 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/ecs/pricing",
      confidence: "high",
      assumptions:
        "ECS control plane is free. Compute costs depend on the chosen launch type (EC2, Fargate, or Managed Instances).",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "partially",
    useCases: ["microservices", "enterprise", "orchestration"],
    documentation: "https://docs.aws.amazon.com/ecs/",
    tags: ["containers", "orchestration", "cluster", "scheduler"],
  },
  {
    id: "aws-ecs-ec2",
    name: "ECS on EC2",
    shortName: "ECS EC2",
    category: Category.Backend,
    provider: "AWS",
    description:
      "ECS using EC2 instances as compute capacity. You manage instance types, scaling, and capacity.",
    color: categoryColors.Backend,
    compatibleWith: [
      "aws-ecs",
      "postgres-rds",
      "dynamodb",
      "redis-elasticache",
      "aws-s3",
      "aws-sqs",
      "aws-sns",
    ],
    costModel: {
      type: "usage",
      baseCost: 15,
      freeTierAvailable: false,
      estimatedMonthlyCost: { min: 40, max: 800 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/ec2/pricing/on-demand",
      confidence: "medium",
      assumptions:
        "Assumes 1–4 EC2 instances (t3/t4g to m5), Linux, always-on. Excludes optional but common costs like ALB, NAT Gateway, and data transfer.",
    },
    scalability: 5,
    complexity: 4,
    managedLevel: "partially",
    useCases: ["microservices", "ecommerce", "enterprise", "general"],
    documentation: "https://docs.aws.amazon.com/ecs/",
    tags: ["containers", "ec2", "orchestration", "compute"],
  },

  {
    id: "aws-fargate",
    name: "AWS Fargate",
    shortName: "Fargate",
    category: Category.Backend,
    provider: "AWS",
    description:
      "Serverless compute engine for containers, billed per vCPU-second, GB-second, and storage",
    color: categoryColors.Backend,
    compatibleWith: [
      "postgres-rds",
      "dynamodb",
      "redis-elasticache",
      "aws-s3",
      "aws-sqs",
      "aws-sns",
      "cloudflare-r2",
    ],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: false,
      estimatedMonthlyCost: { min: 10, max: 600 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/fargate/pricing/",
      confidence: "high",
      assumptions:
        "Pricing is based on vCPU-seconds, GB-seconds, and additional ephemeral storage beyond the included 20GB. Linux tasks have a 1-minute minimum billing. Estimate assumes 0.25–2 vCPU tasks, either intermittent jobs or small numbers of long-running services.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["microservices", "event-driven", "batch-jobs", "saas-mvp"],
    documentation: "https://docs.aws.amazon.com/ecs/",
    tags: ["containers", "serverless", "fargate", "compute"],
  },

  {
    id: "gcp-cloud-run",
    name: "GCP Cloud Run",
    shortName: "Cloud Run",
    category: Category.Backend,
    provider: "GCP",
    description:
      "Fully managed serverless container platform with automatic scaling, per‑use billing, and support for HTTP services, jobs, and worker pools",
    color: categoryColors.Backend,
    compatibleWith: [
      "gcp-cloud-sql",
      "gcp-pubsub",
      "gcp-storage",
      "gcp-firestore",
      "gcp-bigquery",
      "cloudflare-r2",
    ],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 200 },
      lastUpdated: "2026-01",
      pricingUrl: "https://cloud.google.com/run/pricing",
      confidence: "medium",
      assumptions:
        "Pricing is based on vCPU-seconds, GiB-seconds, and request volume. Free tier includes CPU, memory, and 2M requests. Costs vary by region and billing mode (instance-based vs request-based). Estimate assumes moderate traffic and 0.25–1 vCPU services.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "api-backend", "event-driven", "batch-jobs"],
    documentation: "https://docs.cloud.google.com/docs",
    tags: ["serverless", "containers", "compute", "gcp"],
  },

  {
    id: "railway",
    name: "Railway",
    shortName: "Railway",
    category: Category.Backend,
    provider: "Railway",
    description:
      "Usage‑based platform for deploying and scaling applications with automatic resource metering",
    color: categoryColors.Backend,
    compatibleWith: [
      "postgres-rds",
      "supabase",
      "planetscale",
      "aws-s3",
      "cloudflare-r2",
      "mongodb-atlas",
    ],
    costModel: {
      type: "usage", // Minimum spend + metered compute
      baseCost: 0, // Free plan starts at $0, then $1/mo after trial
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 40 },
      lastUpdated: "2026-01",
      pricingUrl: "https://railway.com/pricing",
      confidence: "medium",
      assumptions:
        "Railway charges per vCPU-second, GB-second, and storage. Free plan includes limited resources. Hobby plan has a $5 minimum usage with $5 credits; Pro has a $20 minimum with $20 credits. Estimate assumes small to moderate workloads.",
    },
    scalability: 4,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "hobby-project", "api-backend", "full-stack-app"],
    documentation: "https://docs.railway.com",
    tags: ["serverless", "containers", "hosting", "usage-based", "deployments"],
  },

  {
    id: "render",
    name: "Render",
    shortName: "Render",
    category: Category.Backend,
    provider: "Render",
    description:
      "Fully managed cloud platform for deploying web services, workers, cron jobs, static sites, and databases with per-second compute billing",
    color: categoryColors.Backend,
    compatibleWith: [
      "postgres-rds",
      "supabase",
      "planetscale",
      "aws-s3",
      "cloudflare-r2",
      "mongodb-atlas",
    ],
    costModel: {
      type: "tiered",
      baseCost: 7,
      freeTierAvailable: true,
      estimatedMonthlyCost: {
        min: 0,
        max: 100,
      },
      lastUpdated: "2026-01",
      pricingUrl: "https://render.com/pricing",
      confidence: "high",
      assumptions:
        "Pricing has two main layers: 1) Workspace Plan (Hobby $0, Professional $19/user, Organization $29/user)[citation:1]. 2) Compute/Service Cost: Each Web Service, Database (Postgres, Key Value), or Cron Job incurs separate, prorated charges based on its instance type. Free tier is for Static Sites and specific 'Free' instance types for other services, which have limits. Bandwidth overages cost $0.10/GB (Americas/Europe) or $0.20/GB (other regions).",
    },
    scalability: 4,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "api-backend", "full-stack-app", "workers"],
    documentation: "https://render.com/docs",
    tags: ["containers", "hosting", "serverless", "deployments", "usage-based"],
  },

  // Databases
  {
    id: "postgres-rds",
    name: "Amazon RDS PostgreSQL",
    shortName: "RDS Postgres",
    category: Category.Database,
    provider: "AWS",
    description:
      "Managed PostgreSQL database with automated backups, patching, monitoring, and Multi-AZ options",
    color: categoryColors.Database,
    compatibleWith: [
      "aws-lambda",
      "aws-ecs",
      "aws-ecs-ec2",
      "aws-fargate",
      "vercel",
      "netlify",
      "render",
      "railway",
      "redis-elasticache",
    ],
    incompatibleWith: ["gcp-cloud-run"],
    costModel: {
      type: "tiered", // instance class + storage + backup + data transfer
      baseCost: 0, // free tier covers db.t3.micro for 12 months
      freeTierAvailable: true,
      estimatedMonthlyCost: {
        min: 0, // free tier
        max: 800, // large instances + Multi-AZ + storage
      },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/rds/postgresql/pricing/",
      confidence: "medium",
      assumptions:
        "Free tier includes 750 hours/mo of db.t3.micro, 20GB gp2 storage, and 20GB backup for 12 months. Costs scale with instance class, Multi-AZ deployments, storage type (gp2/gp3/io1/io2), provisioned IOPS, backup retention, and data transfer.",
    },
    scalability: 4,
    complexity: 4,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "general", "enterprise"],
    documentation: "https://docs.aws.amazon.com/rds/",
    tags: ["relational", "sql", "managed", "postgres", "database"],
  },

  {
    id: "supabase",
    name: "Supabase",
    shortName: "Supabase",
    category: Category.Database,
    provider: "Supabase",
    description:
      "Open source Firebase alternative built on PostgreSQL with authentication, storage, edge functions, and realtime APIs",
    color: categoryColors.Database,
    compatibleWith: ["vercel", "netlify", "cloudflare-pages"],
    costModel: {
      type: "tiered", // Free, Pro, Team/Enterprise
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: {
        min: 0,
        max: 150, // Pro starts at $25 + usage; real-world apps often exceed $25
      },
      lastUpdated: "2026-01",
      pricingUrl: "https://supabase.com/pricing",
      confidence: "medium",
      assumptions:
        "Free tier: 500MB DB, 50k MAU, 5GB egress, 1GB storage. Pro plan: $25/mo base, includes 8GB DB, 100k MAU, 250GB egress, 100GB storage, and $10 compute credits. Key overages: DB Storage $0.125/GB, MAU $0.00325/user, Bandwidth $0.09/GB, Edge Functions $2/million invocations.",
    },
    scalability: 4,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "mobile-backend", "real-time-app", "full-stack-app"],
    documentation: "https://supabase.com/docs",
    tags: ["postgres", "realtime", "auth", "storage", "functions", "baas"],
  },

  {
    id: "planetscale",
    name: "PlanetScale",
    shortName: "PlanetScale",
    category: Category.Database,
    provider: "SaaS",
    description:
      "Serverless MySQL and Postgres platform with high-availability clusters, branching, and autoscaling storage",
    color: categoryColors.Database,
    compatibleWith: [
      "vercel",
      "netlify",
      "cloudflare-pages",
      "aws-lambda",
      "aws-fargate",
    ],
    costModel: {
      type: "tiered",
      baseCost: 5, // Minimum is now $5 for single-node Postgres
      freeTierAvailable: false,
      estimatedMonthlyCost: {
        min: 5,
        max: 5600,
      },
      lastUpdated: "2026-01",
      pricingUrl: "https://planetscale.com/pricing",
      confidence: "high",
      assumptions:
        "Pricing is based on fixed SKUs. The minimum cost is for a single-node, non-HA Postgres PS-5 cluster at $5/mo. HA clusters (3-node) start at $15/mo (PS-5). All production HA clusters include 10GB storage, with additional storage billed at $0.50/GB for network-attached storage. Key add-ons: SSO ($199/mo), Business Support (extra fee). Cluster sizes are capped at PS-160 until a $100 invoice is paid; larger sizes require contacting sales.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "enterprise", "global-app"],
    documentation: "https://planetscale.com/docs",
    tags: ["mysql", "serverless", "ha", "branching", "database"],
  },

  // Cache
  {
    id: "redis-elasticache",
    name: "AWS ElastiCache Redis",
    shortName: "ElastiCache",
    category: Category.Cache,
    provider: "AWS",
    description:
      "Fully managed Redis-compatible in-memory cache with support for serverless, on-demand nodes, clustering, and data tiering",
    color: categoryColors.Cache,
    compatibleWith: ["aws-lambda", "aws-ecs", "postgres-rds"],
    requiresOneOf: ["aws-lambda", "aws-ecs"],
    costModel: {
      type: "usage", // Serverless, On-demand, Reserved, and Savings Plans
      baseCost: 0,
      freeTierAvailable: true, // Available to all, structure changed in July 2025
      estimatedMonthlyCost: {
        min: 10, // e.g., small serverless cache or t4g.micro node
        max: 1500, // e.g., large multi-node r7g cluster
      },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/elasticache/pricing/",
      confidence: "high", // Confidence increased with verified details
      assumptions:
        "Free Tier: For sign-ups before July 15, 2025, includes 750 hrs of cache.t3.micro. For sign-ups after, includes $100 AWS credits. Pricing varies by engine (Valkey, Redis OSS, Memcached) and model: Serverless (GB-hours + ECPUs), On-demand node hours, Reserved Nodes (1-3 year commitments), and Database Savings Plans. Valkey Serverless has a 100 MB minimum; others have 1 GB. Backup storage is $0.085/GB/month.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: [
      "saas-mvp",
      "ecommerce",
      "real-time-app",
      "gaming",
      "leaderboards",
    ],
    documentation: "https://docs.aws.amazon.com/elasticache/",
    tags: ["cache", "redis", "in-memory", "managed", "serverless"],
  },

  {
    id: "upstash-redis",
    name: "Upstash Redis",
    shortName: "Upstash",
    category: Category.Cache,
    provider: "SaaS",
    description:
      "Serverless Redis with per-request pricing, global replication, and built-in HTTP/REST access",
    color: categoryColors.Cache,
    compatibleWith: [
      "vercel",
      "netlify",
      "cloudflare-pages",
      "aws-lambda",
      "gcp-cloud-run",
      "railway",
      "render",
    ],
    costModel: {
      type: "tiered", // Offers both tiered (Fixed) and usage-based (Pay-as-you-go) models.
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: {
        min: 0,
        max: 100, // For Pay-as-you-go usage. Fixed Plans can cost up to $1,500/month.
      },
      lastUpdated: "2026-01",
      pricingUrl: "https://upstash.com/pricing/redis",
      confidence: "high",
      assumptions:
        "Free tier includes one database with 256MB data size and 500K commands/month. Primary paid models are 1) Pay-as-you-go: $0.20 per 100K commands, $0.25/GB for storage, first 200GB bandwidth free then $0.03/GB. 2) Fixed Plans: Flat monthly fee ($10 to $1,500) for set storage/bandwidth with unlimited commands. The 'Prod Pack' add-on (SLA, RBAC, monitoring) costs $200/month per database.",
    },
    scalability: 4,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "edge-functions", "rate-limiting", "real-time-app"],
    documentation: "https://upstash.com/docs/redis",
    tags: ["redis", "serverless", "cache", "edge", "usage-based"],
  },

  // Queues
  {
    id: "aws-sqs",
    name: "AWS SQS",
    shortName: "SQS",
    category: Category.Queue,
    provider: "AWS",
    description:
      "Fully managed message queue service for decoupling and scaling microservices",
    color: categoryColors.Queue,
    compatibleWith: ["aws-lambda", "aws-ecs", "aws-sns"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 50 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/sqs/pricing/",
      confidence: "high",
      assumptions:
        "Free tier includes 1M requests per month across all regions (except GovCloud). Pricing for Standard and FIFO queues is tiered based on monthly volume (e.g., in US East (Ohio): Standard: $0.40, $0.30, $0.24 per million; FIFO: $0.50, $0.40, $0.35 per million). Fair queues add a $0.10 per million request surcharge on applicable Standard queue requests. Each 64KB of payload counts as one request, and a single API call can batch up to 10 messages.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["microservices", "data-pipeline", "saas-mvp", "general"],
    documentation: "https://docs.aws.amazon.com/sqs/",
    tags: ["queue", "messaging", "async", "decoupling"],
  },

  {
    id: "aws-sns",
    name: "AWS SNS",
    shortName: "SNS",
    category: Category.Queue,
    provider: "AWS",
    description:
      "Fully managed pub/sub messaging service supporting fan-out, mobile push, email, HTTP/S, SQS, Lambda, and FIFO delivery",
    color: categoryColors.Queue,
    compatibleWith: ["aws-lambda", "aws-sqs", "aws-ecs"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 50 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/sns/pricing/",
      confidence: "high",
      assumptions:
        "Free tier includes monthly: 1M publishes, 1M mobile push, 1k emails, 100k HTTP/s notifications. Standard topics: $0.50 per million requests post-free tier. FIFO topics: Publish requests are $0.30 per million + $0.017/GB payload; subscription messages are $0.01 per million + $0.001/GB payload. Delivery charges vary by endpoint (e.g., Email: $2.00/100k; HTTP/s: $0.60/million). SMS pricing is country-specific via AWS End User Messaging. Data transfer out, payload-based filtering, and archiving incur additional costs.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["mobile-backend", "data-pipeline", "saas-mvp", "general"],
    documentation: "https://docs.aws.amazon.com/sns/",
    tags: ["pubsub", "notifications", "messaging", "push"],
  },

  {
    id: "rabbitmq",
    name: "RabbitMQ",
    shortName: "RabbitMQ",
    category: Category.Queue,
    provider: "OpenSource",
    description:
      "Open-source messaging and streaming broker supporting AMQP, MQTT, and flexible routing patterns",
    color: categoryColors.Queue,
    compatibleWith: [
      "aws-ecs",
      "aws-ecs-ec2",
      "aws-fargate",
      "gcp-cloud-run",
      "vercel",
      "netlify",
      "render",
      "railway",
    ],
    costModel: {
      type: "free",
      baseCost: 0, // RabbitMQ itself is free
      freeTierAvailable: true,
      estimatedMonthlyCost: {
        min: 0, // local/dev
        max: 100, // typical small VM hosting cost
      },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.rabbitmq.com",
      confidence: "high",
      assumptions:
        "The RabbitMQ broker software is free and open-source under MPL 2.0. A commercial enterprise version (Tanzu RabbitMQ) with support is available separately. All runtime costs are for hosting infrastructure (VMs, containers, storage, network). Estimate assumes small cloud VMs or container hosting.",
    },
    scalability: 4,
    complexity: 3,
    managedLevel: "self-hosted",
    useCases: [
      "microservices",
      "event-driven",
      "real-time-app",
      "iot",
      "streaming",
    ],
    documentation: "https://www.rabbitmq.com/docs",
    tags: ["queue", "messaging", "broker", "amqp", "mqtt", "open-source"],
  },

  // Storage
  {
    id: "aws-s3",
    name: "AWS S3",
    shortName: "S3",
    category: Category.Storage,
    provider: "AWS",
    description:
      "Highly durable, infinitely scalable object storage with multiple storage classes, lifecycle policies, and global availability",
    color: categoryColors.Storage,
    compatibleWith: ["aws-lambda", "aws-ecs", "aws-cloudfront"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 200 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/s3/pricing/",
      confidence: "high",
      assumptions:
        "Free tier includes 5 GB of S3 Standard storage, 20,000 GET requests, and 2,000 PUT, COPY, POST, or LIST requests per month for 12 months. Pricing varies by storage class (Standard, Intelligent-Tiering, IA, Glacier tiers). Request costs depend on volume. Data transfer out to the internet or across AWS regions is billed, but transfers within the same region or to CloudFront are free. Intelligent-Tiering adds monthly monitoring charges. Glacier classes have minimum storage durations and retrieval fees. S3 Tables is a separate analytics-optimized offering with its own pricing model.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: [
      "saas-mvp",
      "ecommerce",
      "content-site",
      "data-pipeline",
      "analytics",
      "backup",
      "general",
    ],
    documentation: "https://docs.aws.amazon.com/s3/",
    tags: [
      "storage",
      "object-storage",
      "static-assets",
      "backup",
      "archival",
      "data-lake",
    ],
  },

  {
    id: "cloudflare-r2",
    name: "Cloudflare R2",
    shortName: "R2",
    category: Category.Storage,
    provider: "Cloudflare",
    description:
      "S3-compatible object storage with zero egress fees and simple per-GB and per-request pricing",
    color: categoryColors.Storage,
    compatibleWith: [
      "cloudflare-workers",
      "cloudflare-pages",
      "vercel",
      "netlify",
      "aws-lambda",
      "gcp-cloud-run",
    ],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 50 },
      lastUpdated: "2026-01",
      pricingUrl: "https://developers.cloudflare.com/r2/pricing",
      confidence: "high",
      assumptions:
        "Pricing includes $0.015/GB-month for Standard storage and $0.01/GB-month for Infrequent Access. Class A operations cost $4.50 per million (Standard) or $9.00 per million (IA). Class B operations cost $0.36 per million (Standard) or $0.90 per million (IA). Infrequent Access has a 30-day minimum storage duration and $0.01/GB retrieval fee. Egress to the Internet is free. Free tier includes 10GB storage, 1M Class A ops, and 10M Class B ops per month.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: [
      "static-assets",
      "edge-functions",
      "saas-mvp",
      "content-site",
      "data-pipeline",
      "backup",
    ],
    documentation: "https://developers.cloudflare.com/r2",
    tags: [
      "storage",
      "object-storage",
      "s3-compatible",
      "cloudflare",
      "zero-egress",
    ],
  },

  // Auth
  {
    id: "auth0",
    name: "Auth0",
    shortName: "Auth0",
    category: Category.Auth,
    provider: "SaaS",
    description:
      "Authentication and authorization platform with SSO, MFA, social login, organizations, and customizable login flows",
    color: categoryColors.Auth,
    compatibleWith: ["vercel", "aws-lambda", "aws-ecs"],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 150 },
      lastUpdated: "2026-01",
      pricingUrl: "https://auth0.com/pricing",
      confidence: "high",
      assumptions:
        "Free tier includes up to 25,000 monthly active users (MAU) with unlimited social connections, custom domains (credit card verification required), SSO via Okta, and branded login. Essentials plan pricing depends on use case: starts at $35/mo for B2C or $150/mo for B2B for up to 500 MAU, adding MFA, RBAC, higher limits, and log streaming. Professional plan starts at $240/mo (B2C). Special programs exist for Startups (1 year free B2B Professional) and Nonprofits (50% off paid plans).",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "mobile-backend", "enterprise-sso"],
    documentation: "https://auth0.com/docs",
    tags: ["auth", "sso", "mfa", "oauth", "oidc", "identity"],
  },

  {
    id: "clerk",
    name: "Clerk",
    shortName: "Clerk",
    category: Category.Auth,
    provider: "SaaS",
    description:
      "User management and authentication with pre-built UI components, MFA, organizations, and enterprise SSO",
    color: categoryColors.Auth,
    compatibleWith: ["vercel", "netlify"],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 350 },
      lastUpdated: "2026-01",
      pricingUrl: "https://clerk.com/pricing",
      confidence: "high",
      assumptions:
        "Free tier includes 10,000 monthly active users (MAUs) and 100 monthly active organizations (MAOs). Pro plan starts at $25/mo and charges $0.02 per additional MAU and $1 per additional MAO. Key add-ons are available at $100/mo each: Enhanced Authentication (MFA, Enterprise SSO), Enhanced Administration (user impersonation, audit logs), and Enhanced Organizations (verified domains, custom roles). Additional dashboard seats cost $10/mo each.",
    },
    scalability: 4,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "content-site", "b2b-saas", "mobile-backend"],
    documentation: "https://clerk.com/docs",
    tags: ["auth", "user-management", "ui-components", "mfa", "sso"],
  },

  {
    id: "supabase-auth",
    name: "Supabase Auth",
    shortName: "Supabase Auth",
    category: Category.Auth,
    provider: "Supabase",
    description:
      "Open-source authentication with email/password, magic links, OAuth, phone auth, MFA, and full Postgres integration",
    color: categoryColors.Auth,
    compatibleWith: ["vercel", "netlify", "cloudflare-pages", "aws-lambda"],
    costModel: {
      type: "tiered", // Pricing is based on tiered plans (Free, Pro, Team, Enterprise) with usage-based overages.
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 200 }, // Note: Can scale significantly with MAU overages.
      lastUpdated: "2026-01",
      pricingUrl: "https://supabase.com/pricing",
      confidence: "high",
      assumptions:
        "Auth pricing is tied to platform plans. Free tier includes 50,000 MAUs. Pro includes 100,000 MAUs, then $0.00325 per MAU. Advanced MFA (phone) costs $75/mo for the first project and $10/mo for each additional project. Branding removal is included in Pro and above. Auth audit logs: 1 hour (Free), 7 days (Pro), 28 days (Team). SMS/phone auth requires a separate provider (e.g., Twilio) with its own costs.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "mobile-backend", "real-time-app", "full-stack-app"],
    documentation: "https://supabase.com/docs",
    tags: ["auth", "oauth", "mfa", "magic-links", "postgres-integrated"],
  },

  // Search
  {
    id: "algolia",
    name: "Algolia",
    shortName: "Algolia",
    category: Category.Search,
    provider: "SaaS",
    description:
      "Hosted AI-powered search with typo tolerance, neural search, faceting, and instant results",
    color: categoryColors.Search,
    compatibleWith: [
      "vercel",
      "netlify",
      "cloudflare-pages",
      "aws-lambda",
      "aws-ecs",
    ],
    costModel: {
      type: "tiered", // Tiers with usage-based overages for searches and records
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 300 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.algolia.com/pricing/",
      confidence: "high",
      assumptions:
        "Build plan (Free) includes 10K search requests/month, 1M records, and basic AI features. Grow plan (pay-as-you-go) includes 10K free searches/mo ($0.50/1k thereafter) and 100K free records ($0.40/1k/mo thereafter). Grow Plus plan includes AI features (AI Synonyms, Personalization), 10K free searches/mo ($1.75/1k thereafter). Premium and Elevate plans are custom-priced for enterprise, including full AI suite and neural search. Costs scale primarily with search requests and records stored.",
    },
    scalability: 5,
    complexity: 3, // Appropriate due to multiple cost metrics (searches, records, optional features)
    managedLevel: "fully",
    useCases: ["ecommerce", "saas-mvp", "content-site", "general"],
    documentation: "https://www.algolia.com/doc/",
    tags: ["search", "instant-search", "autocomplete", "api", "ai-search"],
  },

  {
    id: "elasticsearch",
    name: "Elasticsearch",
    shortName: "Elasticsearch",
    category: Category.Search,
    provider: "OpenSource",
    description:
      "Open-source search and analytics engine supporting full-text search, vector search, aggregations, and real-time analytics",
    color: categoryColors.Search,
    compatibleWith: [
      "aws-ecs",
      "aws-ec2",
      "gcp-cloud-run",
      "vercel",
      "netlify",
      "cloudflare-pages",
    ],
    costModel: {
      type: "tiered", // Primary model for the Cloud Hosted service; self-hosted is free, serverless is usage-based.
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 500 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.elastic.co/pricing",
      confidence: "high",
      assumptions:
        "Three deployment models: 1) Self-hosted: free and open-source, with costs for your own infrastructure. 2) Elastic Cloud Hosted: subscription tiers (Standard $99, Gold $114, Platinum $131, Enterprise $184+/mo) based on provisioned RAM/hour and storage. 3) Elasticsearch Serverless: usage-based pricing for Ingest VCUs (~$0.14/hr), Search VCUs (~$0.09/hr), ML VCUs (~$0.07/hr), storage (~$0.047/GB-month), egress, plus optional LLM ($4.5/M input tokens) and ELSER ($0.08/M tokens) fees. Free options include a 14-day cloud trial and the self-managed Basic features.",
    },
    scalability: 5,
    complexity: 4,
    managedLevel: "self-hosted-or-managed",
    useCases: [
      "ecommerce",
      "analytics",
      "log-search",
      "vector-search",
      "observability",
      "security-analytics",
    ],
    documentation: "https://www.elastic.co/docs",
    tags: [
      "search",
      "analytics",
      "open-source",
      "vector-search",
      "observability",
    ],
  },

  // Monitoring
  {
    id: "datadog",
    name: "Datadog",
    shortName: "Datadog",
    category: Category.Monitoring,
    provider: "SaaS",
    description:
      "Unified observability platform with metrics, logs, traces, security, and APM across cloud and containerized environments",
    color: categoryColors.Monitoring,
    compatibleWith: ["aws-lambda", "aws-ecs", "vercel", "netlify"],
    costModel: {
      type: "tiered",
      baseCost: 15, // Minimum paid plan (Infrastructure Pro) starts at $15/host/month.
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 1000 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.datadoghq.com/pricing/",
      confidence: "high",
      assumptions:
        "Free tier (Infrastructure) includes up to 5 hosts with 1-day metric retention. Infrastructure Pro starts at $15/host/mo (annual) or $18 on-demand; Enterprise at $23/host/mo (annual) or $27 on-demand. DevSecOps Pro ($22/host/mo annual) and Enterprise ($34) are bundled SKUs with security features. Major additional products: APM ($31/host/mo), Log Management ($0.10/GB ingest, $1.70/M events indexed). Additional charges apply for custom metrics ($1 per 100), containers, and workflow executions.",
    },
    scalability: 5,
    complexity: 4,
    managedLevel: "fully",
    useCases: [
      "microservices",
      "saas-mvp",
      "ecommerce",
      "observability",
      "security-monitoring",
    ],
    documentation: "https://docs.datadoghq.com/",
    tags: ["monitoring", "apm", "logs", "traces", "observability", "security"],
  },

  {
    id: "aws-cloudwatch",
    name: "AWS CloudWatch",
    shortName: "CloudWatch",
    category: Category.Monitoring,
    provider: "AWS",
    description:
      "Native AWS observability service for metrics, logs, alarms, dashboards, traces, and application monitoring",
    color: categoryColors.Monitoring,
    compatibleWith: [
      "aws-lambda",
      "aws-ecs",
      "postgres-rds",
      "aws-alb",
      "aws-api-gateway",
    ],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 1000 }, // Updated to reflect potential production costs
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/cloudwatch/pricing/",
      confidence: "high",
      assumptions:
        "Free tier includes 5GB logs ingestion, 1,800 minutes of Live Tail, 10 custom metrics, 3 dashboards, 10 alarms, and 1M API requests. Paid usage includes logs ingestion and storage, Logs Insights queries, custom metrics, alarms, dashboards, X-Ray traces, Application Signals, RUM, Synthetics, Contributor Insights, and cross-account observability.",
    },
    scalability: 5,
    complexity: 4,
    managedLevel: "fully",
    useCases: [
      "microservices",
      "saas-mvp",
      "ecommerce",
      "observability",
      "general",
    ],
    documentation: "https://docs.aws.amazon.com/cloudwatch/",
    tags: ["monitoring", "logs", "metrics", "alarms", "traces", "aws"],
  },

  // Networking
  {
    id: "aws-api-gateway",
    name: "AWS API Gateway",
    shortName: "API Gateway",
    category: Category.Networking,
    provider: "AWS",
    description:
      "Fully managed service for building, deploying, and securing REST, HTTP, and WebSocket APIs at scale",
    color: categoryColors.Networking,
    compatibleWith: ["aws-lambda", "aws-ecs", "dynamodb", "postgres-rds"],
    requiresOneOf: ["aws-lambda", "aws-ecs"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 500 }, // Updated: Realistic for moderate usage
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/api-gateway/pricing/",
      confidence: "high",
      assumptions:
        "Free tier includes 1M REST calls, 1M HTTP calls, 1M WebSocket messages, and 750k connection minutes per month for 12 months. New AWS accounts (after July 2025) also receive $200 in service credits. HTTP APIs: $1.00 per million requests (first 300M). REST APIs: tiered at $3.50 per million (first 333M), $2.80 (next 667M), $2.38 (next 19B). WebSocket APIs: $1.00 per million messages + $0.25 per million connection minutes. Optional caching adds hourly charges. API Gateway Portals are a separate product with monthly fees.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["saas-mvp", "mobile-backend", "microservices", "general"],
    documentation: "https://docs.aws.amazon.com/apigateway/",
    tags: ["api", "gateway", "serverless", "rest", "websocket"],
  },

  {
    id: "aws-alb",
    name: "AWS Application Load Balancer",
    shortName: "ALB",
    category: Category.Networking,
    provider: "AWS",
    description:
      "Layer 7 load balancer for HTTP/HTTPS traffic with advanced routing, SSL termination, and health checks",
    color: categoryColors.Networking,
    compatibleWith: ["aws-ecs", "postgres-rds", "redis-elasticache"],
    requiresOneOf: ["aws-ecs"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 20, max: 250 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/elasticloadbalancing/pricing/",
      confidence: "high",
      assumptions:
        "ALB pricing includes $0.0225 per ALB-hour plus $0.008 per LCU-hour. LCUs are based on the highest of new connections, active connections, processed bytes (note: 1 LCU = 1GB/hr for EC2 targets, 0.4GB/hr for Lambda targets), or rule evaluations (first 10 rules free). Free tier includes 750 ALB hours and 15 LCUs per month for new AWS accounts. Data transfer and public IPv4 addresses are billed separately.",
    },
    scalability: 5,
    complexity: 4,
    managedLevel: "fully",
    useCases: ["ecommerce", "microservices", "general"],
    documentation: "https://docs.aws.amazon.com/elasticloadbalancing/",
    tags: ["load-balancer", "networking", "ssl", "routing"],
  },

  {
    id: "route53",
    name: "AWS Route 53",
    shortName: "Route53",
    category: Category.Networking,
    provider: "AWS",
    description:
      "Highly available and scalable DNS, domain registration, health checking, and traffic routing service",
    color: categoryColors.Networking,
    compatibleWith: ["aws-cloudfront", "aws-alb", "aws-lambda"],
    costModel: {
      type: "usage", // Pay-as-you-go for hosted zones, queries, health checks, etc.
      baseCost: 0, // No base fee, pay per component used
      freeTierAvailable: true, // 50 free health checks for AWS endpoints
      estimatedMonthlyCost: { min: 1, max: 20 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/route53/pricing/",
      confidence: "high",
      assumptions:
        "Hosted zones cost $0.50/mo for the first 25 zones and $0.10/mo thereafter. Standard DNS queries cost $0.40 per million (first 1B). Latency, geo, and IP-based routing queries cost more. First 50 health checks for AWS endpoints are free; beyond that, basic checks cost $0.50 (AWS) or $0.75 (non-AWS) per month. Optional features (HTTPS, fast interval) add $1–$2 per feature per month. Traffic Flow policies cost $50 per policy record per month.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "content-site", "general"],
    documentation: "https://docs.aws.amazon.com/route53/",
    tags: ["dns", "routing", "domains", "health-checks"],
  },

  {
    id: "cloudflare-dns",
    name: "Cloudflare DNS",
    shortName: "CF DNS",
    category: Category.Networking,
    provider: "Cloudflare",
    description:
      "Fast, secure, unmetered DNS with DNSSEC, DDoS protection, and global anycast performance",
    color: categoryColors.Networking,
    compatibleWith: ["cloudflare-cdn", "cloudflare-pages", "vercel"],
    costModel: {
      type: "free",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 0 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.cloudflare.com/plans",
      confidence: "high",
      assumptions:
        "Cloudflare DNS is fully free and unmetered across all plans. Paid Cloudflare plans add features such as WAF, bot mitigation, advanced rules, and support, but DNS hosting and queries remain free.",
    },
    scalability: 5,
    complexity: 1,
    managedLevel: "fully",
    useCases: ["saas-mvp", "content-site", "general"],
    documentation: "https://developers.cloudflare.com/dns/",
    tags: ["dns", "free", "ddos-protection", "dnssec"],
  },

  // DevOps
  {
    id: "github-actions",
    name: "GitHub Actions",
    shortName: "GH Actions",
    category: Category.DevOps,
    provider: "SaaS",
    description:
      "CI/CD automation platform integrated with GitHub for building, testing, and deploying code",
    color: categoryColors.DevOps,
    compatibleWith: ["vercel", "aws-ecs", "aws-lambda", "render", "railway"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 100 },
      lastUpdated: "2026-01",
      pricingUrl:
        "https://docs.github.com/en/billing/concepts/product-billing/github-actions",
      confidence: "high",
      assumptions:
        "Free monthly minutes depend on the GitHub plan: Free organization accounts get 500 minutes, paid Team plans get 3,000 minutes for private repositories. Usage for public repositories and self-hosted runner **execution time** is free. Additional GitHub-hosted runner minutes are billed per-minute ($0.008 to $0.064/min based on OS and hardware). Artifact and package storage beyond the free allowance is billed per GB per month.",
    },
    scalability: 4,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "microservices", "general"],
    documentation: "https://docs.github.com/actions",
    tags: ["ci-cd", "automation", "deployment", "testing"],
  },

  {
    id: "aws-secrets-manager",
    name: "AWS Secrets Manager",
    shortName: "Secrets Manager",
    category: Category.DevOps,
    provider: "AWS",
    description:
      "Securely store, rotate, and manage API keys, database credentials, and other secrets",
    color: categoryColors.DevOps,
    compatibleWith: ["aws-lambda", "aws-ecs", "postgres-rds"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true, // Corrected: New accounts get $200 in service credits.
      estimatedMonthlyCost: { min: 1, max: 200 }, // Corrected: Max cost increased to reflect realistic scaling.
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/secrets-manager/pricing",
      confidence: "high",
      assumptions:
        "Pricing is $0.40 per secret per month (prorated hourly) and $0.05 per 10,000 API calls. New AWS accounts (after July 15, 2025) receive up to $200 in AWS Free Tier service credits usable for Secrets Manager. Replica secrets are billed separately. No charge for creating new secret versions.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "microservices", "general"],
    documentation: "https://docs.aws.amazon.com/secretsmanager/",
    tags: ["security", "secrets", "encryption", "rotation"],
  },

  {
    id: "doppler",
    name: "Doppler",
    shortName: "Doppler",
    category: Category.DevOps,
    provider: "SaaS",
    description:
      "Universal secrets manager with environment syncing, access controls, and developer-friendly workflows",
    color: categoryColors.DevOps,
    compatibleWith: ["vercel", "render", "railway", "aws-lambda"],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 200 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.doppler.com/pricing",
      confidence: "high",
      assumptions:
        "Developer plan is free for up to 3 users, additional users cost $8/month each. Includes 3 days of activity logs, 5 config syncs. Team plan costs $21 per user per month (14-day trial available), adding SAML SSO, RBAC, 90-day logs, auto rotation, 100 syncs. Key add-ons (Custom Roles, User Groups, Integration Syncs) cost $9 per user per month each. Enterprise plan is custom-priced.",
    },
    scalability: 4,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "general", "team-collaboration"],
    documentation: "https://docs.doppler.com/",
    tags: ["secrets", "environment-variables", "security", "rotation"],
  },

  {
    id: "aws-ecr",
    name: "AWS Elastic Container Registry",
    shortName: "ECR",
    category: Category.DevOps,
    provider: "AWS",
    description:
      "Fully managed container registry for storing, managing, and deploying Docker and OCI images",
    color: categoryColors.DevOps,
    compatibleWith: ["aws-ecs", "aws-lambda"],
    requiresOneOf: ["aws-ecs"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 40 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/ecr/pricing/",
      confidence: "high",
      assumptions:
        "New AWS accounts receive 500 MB of private repository storage free per month for 12 months. Public repositories include 50 GB of long-term free storage. Standard storage is priced at $0.10 per GB-month. Data transfer out from private repositories to the internet starts at $0.09 per GB; crucially, data transfer to AWS services in the same Region (e.g., EC2, ECS, Lambda) is free. Public repositories include monthly free data transfer allowances (500 GB anonymous, 5 TB authenticated). Please refer to the latest official pricing page to confirm details on Archive storage tier pricing.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["microservices", "general", "container-builds"],
    documentation: "https://docs.aws.amazon.com/ecr/",
    tags: ["docker", "containers", "registry", "images"],
  },

  {
    id: "docker-hub",
    name: "Docker Hub",
    shortName: "Docker Hub",
    category: Category.DevOps,
    provider: "SaaS",
    description:
      "Public and private container registry with image distribution, vulnerability scanning, and integrated build and test tooling",
    color: categoryColors.DevOps,
    compatibleWith: ["aws-ecs", "gcp-cloud-run", "render", "railway"],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 24 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.docker.com/pricing/",
      confidence: "high",
      assumptions:
        "Four main tiers: Personal ($0) for 1 user, 1 private repo, 100 pulls/hr. Pro ($9/user/mo annual) for individuals: unlimited private repos/pull rate, 2 Scout repos, 200 Build Cloud & 100 Testcontainers Cloud mins. Team ($15/user/mo annual) for up to 100 users: includes RBAC, audit logs, 500 build/runtime mins. Business ($24/user/mo annual) for unlimited users: adds SSO, SCIM, Hardened Desktop, 1500 mins.",
    },
    scalability: 4,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "microservices", "general"],
    documentation: "https://docs.docker.com/docker-hub/",
    tags: ["docker", "containers", "registry", "build", "ci"],
  },

  // Integrations
  {
    id: "stripe",
    name: "Stripe",
    shortName: "Stripe",
    category: Category.Integrations,
    provider: "SaaS",
    description:
      "Complete payment platform with APIs for online payments, subscriptions, and financial services",
    color: categoryColors.Integrations,
    compatibleWith: ["vercel", "aws-lambda", "aws-ecs", "supabase"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 100 },
      lastUpdated: "2026-01",
      pricingUrl: "https://stripe.com/pricing",
      confidence: "high",
      assumptions:
        "No monthly fee. 2.9% + 30¢ per successful transaction. Estimate based on moderate transaction volume.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce"],
    documentation: "https://stripe.com/docs",
    tags: ["payments", "subscriptions", "checkout", "billing"],
  },

  {
    id: "resend",
    name: "Resend",
    shortName: "Resend",
    category: Category.Integrations,
    provider: "SaaS",
    description:
      "Modern email API for developers with templates, analytics, and reliable delivery",
    color: categoryColors.Integrations,
    compatibleWith: ["vercel", "aws-lambda", "supabase"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 20 },
      lastUpdated: "2026-01",
      pricingUrl: "https://resend.com/pricing",
      confidence: "high",
      assumptions:
        "Free tier: 3,000 emails/mo, 100 emails/day. Pro plan at $20/mo for 50K emails/mo.",
    },
    scalability: 5,
    complexity: 1,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "general"],
    documentation: "https://resend.com/docs",
    tags: ["email", "transactional", "notifications"],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    shortName: "SendGrid",
    category: Category.Integrations,
    provider: "SaaS",
    description:
      "Email delivery platform for transactional and marketing emails with templates and analytics",
    color: categoryColors.Integrations,
    compatibleWith: ["aws-lambda", "aws-ecs", "vercel"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 30 },
      lastUpdated: "2026-01",
      pricingUrl: "https://sendgrid.com/pricing/",
      confidence: "medium",
      assumptions:
        "Free tier: 100 emails/day (3K/mo). Essentials plan at $19.95/mo for 50K emails/mo.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "general"],
    documentation: "https://docs.sendgrid.com/",
    tags: ["email", "marketing", "transactional"],
  },
  {
    id: "aws-ses",
    name: "AWS Simple Email Service",
    shortName: "SES",
    category: Category.Integrations,
    provider: "AWS",
    description:
      "Cost-effective email sending service for transactional, marketing, and bulk email",
    color: categoryColors.Integrations,
    compatibleWith: ["aws-lambda", "aws-ecs"],
    costModel: {
      type: "usage",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 10 },
      lastUpdated: "2026-01",
      pricingUrl: "https://aws.amazon.com/ses/pricing/",
      confidence: "high",
      assumptions:
        "Free tier: 3K emails/mo when sent from EC2. $0.10 per 1K emails thereafter. Very cost-effective.",
    },
    scalability: 5,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["saas-mvp", "ecommerce", "general"],
    documentation: "https://docs.aws.amazon.com/ses/",
    tags: ["email", "aws", "transactional"],
  },
  {
    id: "sanity",
    name: "Sanity",
    shortName: "Sanity",
    category: Category.Integrations,
    provider: "SaaS",
    description:
      "Headless CMS with real-time collaboration, structured content, and powerful query language",
    color: categoryColors.Integrations,
    compatibleWith: ["vercel", "netlify", "cloudflare-pages", "aws-lambda"],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 100 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.sanity.io/pricing",
      confidence: "high",
      assumptions:
        "Free tier for non-commercial use. Growth plan at $99/mo for commercial projects.",
    },
    scalability: 4,
    complexity: 2,
    managedLevel: "fully",
    useCases: ["content-site", "ecommerce"],
    documentation: "https://www.sanity.io/docs",
    tags: ["cms", "headless", "content", "real-time"],
  },
  {
    id: "contentful",
    name: "Contentful",
    shortName: "Contentful",
    category: Category.Integrations,
    provider: "SaaS",
    description:
      "Enterprise headless CMS for managing content across websites, apps, and digital products",
    color: categoryColors.Integrations,
    compatibleWith: ["vercel", "netlify", "cloudflare-pages"],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 500 },
      lastUpdated: "2026-01",
      pricingUrl: "https://www.contentful.com/pricing/",
      confidence: "medium",
      assumptions:
        "Free tier for 2 users, basic features. Team plan at $489/mo. Enterprise pricing varies significantly.",
    },
    scalability: 5,
    complexity: 3,
    managedLevel: "fully",
    useCases: ["content-site", "ecommerce"],
    documentation: "https://www.contentful.com/developers/docs/",
    tags: ["cms", "headless", "enterprise", "content"],
  },
  {
    id: "strapi",
    name: "Strapi",
    shortName: "Strapi",
    category: Category.Integrations,
    provider: "OpenSource",
    description:
      "Open-source headless CMS with customizable API, admin panel, and self-hosting options",
    color: categoryColors.Integrations,
    compatibleWith: ["postgres-rds", "mongodb-atlas", "aws-ecs", "render"],
    requiresOneOf: ["postgres-rds", "mongodb-atlas"],
    costModel: {
      type: "tiered",
      baseCost: 0,
      freeTierAvailable: true,
      estimatedMonthlyCost: { min: 0, max: 200 },
      lastUpdated: "2026-01",
      pricingUrl: "https://strapi.io/pricing",
      confidence: "medium",
      assumptions:
        "Open-source, self-hosted (free). Cloud hosting starts at $99/mo. Costs include hosting infrastructure.",
    },
    scalability: 3,
    complexity: 3,
    managedLevel: "self",
    useCases: ["content-site", "ecommerce"],
    documentation: "https://docs.strapi.io/",
    tags: ["cms", "headless", "open-source", "self-hosted"],
  },
];
