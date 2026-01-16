# ArchFlow - Phase 9 Complete

Visual System Architecture Designer - A drag-and-drop webapp for designing, documenting, and sharing production-ready system architectures.

**[Start Building Now](https://markkatsdesign.github.io/archflow/)** - No installation required, works directly in your browser.

## What's Implemented

### Phase 1: Foundation (Core Canvas) ✅
- ✅ Vite + React + TypeScript setup
- ✅ React Flow canvas with zoom, pan, minimap
- ✅ Custom node component with category-based styling
- ✅ Drag-and-drop from sidebar to canvas
- ✅ 28 initial services across 12 categories
- ✅ Service categorization and filtering
- ✅ Search functionality
- ✅ Edge creation between nodes
- ✅ Zustand state management

### Phase 2: Knowledge Base ✅
- ✅ Expanded TypeScript data models with compatibility, cost, and metadata
- ✅ Enhanced service definitions with:
  - Compatibility rules (compatible/incompatible services)
  - Cost models (free tiers, monthly estimates)
  - Scalability and complexity ratings (1-5 scale)
  - Managed level (fully/partial/self-hosted)
  - Use case tags
  - Documentation links
- ✅ NodeDetailPanel component showing:
  - Full service description
  - Provider and category
  - Scalability/complexity ratings
  - Cost estimates with free tier indicators
  - Compatible/incompatible services
  - Best use cases
  - Tags and documentation links
- ✅ Interactive node selection (click to view details, click pane to deselect)

### Phase 3: Smart Constraints ✅
- ✅ Compatibility checking system (useCompatibility hook)
- ✅ Real-time service filtering based on canvas state:
  - Incompatible services grayed out and non-draggable
  - Compatible services highlighted with green background
  - Visual indicators (sparkles for recommended, ban icon for incompatible)
  - Helpful reason tooltips explaining why services are recommended/blocked
- ✅ RecommendationsPanel with smart suggestions:
  - Shows recommended services based on current architecture
  - Displays warnings for anti-patterns (e.g., database without backend)
  - Detects missing requirements (e.g., services that need specific dependencies)
  - Draggable recommendation cards with service details
  - Shows "Architecture looks good!" when no issues
- ✅ Anti-pattern detection:
  - Database without backend warning
  - Backend without database suggestion
  - Missing required services alerts

### Phase 4: Onboarding Wizard ✅
- ✅ Multi-step wizard UI with Radix Dialog:
  - 6 interactive steps with progress tracking
  - Smooth navigation (back/next buttons, keyboard shortcuts)
  - Skip functionality with confirmation dialog
  - Responsive design with gradient headers
- ✅ Comprehensive questionnaire:
  - Project type selection (SaaS, E-commerce, Serverless, etc.)
  - Scale expectations (Startup MVP, Growth, Enterprise)
  - Budget range (Free tier to Enterprise)
  - Existing infrastructure (AWS, GCP, Azure, etc.)
  - Priority ranking (Cost, Performance, Simplicity, Scalability)
- ✅ Intelligent template matching:
  - Scoring algorithm (40pts project type, 20pts scale, 20pts budget, 10pts provider, 10pts priorities)
  - 3 starter templates (SaaS MVP, E-commerce Standard, Serverless AWS)
  - Real-time template recommendations with match reasons
  - Template preview with services, costs, pros/cons
- ✅ Template application to canvas:
  - One-click template deployment
  - Auto-generates nodes with proper positioning
  - Creates edges between services
  - "Start from scratch" option available
- ✅ First-time user experience:
  - Auto-launches wizard on first visit
  - Saves completion state to localStorage
  - "Get Started" button prominent when canvas empty
  - "New Project" button available when canvas has nodes

### Phase 5: Real-Time Cost Estimation ✅
- ✅ Cost calculation engine (useCostCalculator hook):
  - Real-time cost calculations based on canvas services
  - Intelligent scaling formula: baseCost * (scalingFactor ^ scaleExponent)
  - Support for 3 scale tiers (Startup MVP, Growth, Enterprise)
  - Automatic grouping by service category
  - Excludes services without cost data
- ✅ Cost Estimate Panel (bottom-left):
  - Collapsible panel to save screen space
  - Displays total monthly cost range ($min - $max)
  - Expandable category breakdowns with individual service costs
  - Color-coded budget status (green/amber/red)
  - Scale selector with dropdown (Startup MVP, Growth, Enterprise)
  - Real-time updates when adding/removing services
- ✅ Budget warnings:
  - Within budget (<80%): green checkmark
  - Approaching limit (80-100%): amber warning
  - Exceeds budget (>100%): red alert
  - Budget thresholds: Free ($0), Minimal ($50), Moderate ($500), Flexible ($5K), Enterprise (unlimited)
- ✅ Smart cost scaling:
  - Defaults to 'startup-mvp' scale if onboarding not completed
  - Applies service-specific scaling factors at different tiers
  - Growth tier: applies scaling factor once
  - Enterprise tier: applies scaling factor twice
  - Example: RDS with baseCost=$15, scalingFactor=2 → MVP: $15, Growth: $30, Enterprise: $60

### Phase 6: Production-Ready Architecture Library ✅
- ✅ Expanded service library (28 → 54 services):
  - **Networking** (4 services): AWS API Gateway, AWS ALB, Route53, Cloudflare DNS
  - **DevOps** (5 services): GitHub Actions, AWS Secrets Manager, Doppler, AWS ECR, Docker Hub
  - **Integrations** (7 services): Stripe, Resend, SendGrid, AWS SES, Sanity, Contentful, Strapi
  - All new services include full metadata (compatibility, costs, scalability, complexity)
- ✅ Enhanced templates (3 → 7 production-ready architectures):
  - **Modern SaaS (Jamstack)**: Vercel + Clerk + Supabase + Stripe + Resend - Complete SaaS starter
  - **Event-Driven Serverless**: S3 + Lambda + SQS + DynamoDB + SNS - Async processing workflows
  - **Containerized Microservices**: ALB + ECS + ElastiCache + RDS + CloudWatch - Enterprise-grade
  - **Rapid PaaS Monolith**: Render + PlanetScale + Upstash + GitHub Actions - Indie hacker friendly
  - Existing templates updated with edge labels
- ✅ Connection labeling system:
  - All template edges now include descriptive labels
  - Shows HOW services communicate (e.g., "Auth Token", "SQL Queries", "S3 Event")
  - Teaches users about connection patterns and protocols
- ✅ Real-world architecture patterns:
  - API Gateway + Lambda serverless pattern
  - Load Balancer + Container orchestration
  - Event-driven async processing with queues
  - Payments, email, and CMS integrations
  - CI/CD pipeline connections
  - Secrets management and security best practices

### Phase 7: Export & Documentation ✅
- ✅ **JSON Export/Import** - Save and load architectures:
  - Export current architecture as JSON with full metadata
  - Import previously saved architectures
  - Preserves all nodes, edges, and configuration
  - Enables project versioning and sharing
- ✅ **PNG Export** - High-resolution image export:
  - Export canvas as publication-quality PNG
  - 2x pixel ratio for crisp rendering
  - Auto-excludes UI controls and minimap
  - Perfect for presentations, documentation, and sharing
- ✅ **Markdown Export** - Comprehensive text documentation:
  - Auto-generates markdown documentation
  - Includes service details, categories, and connections
  - Contains cost estimates and scalability ratings
  - Ready for GitHub READMEs, wikis, and documentation sites
- ✅ **PDF Export** - Professional multi-page documents:
  - Page 1: Full architecture diagram
  - Page 2+: Detailed service documentation
  - Includes metadata footer with cost estimates
  - Suitable for client deliverables and reports
- ✅ **Export Panel UI**:
  - Convenient top-left dropdown menu
  - Color-coded export options with icons
  - Shows export progress for image/PDF generation
  - Hides when canvas is empty
  - One-click operations for all export types

### Phase 8: Infrastructure as Code (Terraform) ✅
- ✅ **Terraform Code Generation** - Export architecture as Infrastructure as Code:
  - Generates complete Terraform configuration from visual design
  - Multi-file structure (main.tf, variables.tf, outputs.tf, terraform.tfvars.example)
  - Comprehensive README with setup instructions and prerequisites
  - Downloads as convenient ZIP file for immediate use
- ✅ **AWS Service Support** - Full resource definitions for popular AWS services:
  - **Compute**: Lambda (with IAM roles), ECS (Fargate with task definitions)
  - **Database**: RDS Postgres (with security groups, subnet groups)
  - **Storage**: S3 (versioning, encryption, public access blocks), DynamoDB
  - **Networking**: API Gateway (HTTP API), ALB (with target groups), VPC infrastructure
  - **Messaging**: SQS (with DLQ), SNS
  - **Cache**: ElastiCache Redis (with subnet groups, security groups)
  - **CDN**: CloudFront (with OAI for S3)
- ✅ **Smart Infrastructure Generation**:
  - Automatic VPC creation when needed (public/private subnets, NAT gateways, route tables)
  - Security groups with proper ingress/egress rules
  - IAM roles and policies for service-to-service communication
  - CloudWatch log groups for monitoring
  - Subnet groups for database and cache services
  - Load balancer target groups and listeners
- ✅ **SaaS Service Documentation**:
  - Smart handling of managed SaaS services (Vercel, Auth0, Stripe, etc.)
  - Generates documentation comments with setup instructions
  - Links to provider dashboards and documentation
  - Cost estimates and configuration guidance
- ✅ **Production-Ready Configuration**:
  - Parameterized variables for easy customization
  - Example terraform.tfvars with sensible defaults
  - Output values for endpoints, ARNs, and connection strings
  - Security best practices (encryption, private subnets, least privilege IAM)
  - Resource tagging for organization and cost tracking
  - Backup and monitoring configurations

### Phase 9: Network Boundary Groups ✅
- ✅ **Infrastructure Category** - New sidebar category for network boundaries:
  - Dedicated "Infrastructure" tab in the component palette
  - Visual distinction with dashed/solid/dotted borders
  - Search and filter support for zones
- ✅ **Boundary Zone Types** (10 zones):
  - **AWS-specific**: VPC, Public Subnet, Private Subnet, Availability Zone, Security Group, NAT Gateway
  - **Generic/Cloud-agnostic**: Network Zone, Public Zone, Private Zone, DMZ
  - Each zone has unique styling (border style, color, transparency)
- ✅ **Resizable Group Nodes**:
  - Drag zones from sidebar onto canvas
  - Resize groups by dragging corner/edge handles
  - Minimum size constraints (200×150px)
  - Visual feedback when selected
- ✅ **Auto-Grouping System**:
  - Services dropped inside zones automatically become children
  - Child nodes move with parent group
  - Position automatically converted to relative coordinates
  - Nested groups supported (e.g., VPC > Subnet > Service)
- ✅ **Smart Group Operations**:
  - Delete group → children are preserved (unparented, not deleted)
  - Children positions converted back to absolute coordinates
  - Groups render behind services (proper z-ordering)
  - Connection handles on all sides for group-to-group edges
- ✅ **Cost Model for NAT Gateway**:
  - NAT Gateway includes cost estimate (~$32-100/month)
  - Factors in base hourly cost + data processing charges

## Getting Started

### Use Online (Recommended)
Visit **[https://markkatsdesign.github.io/archflow/](https://markkatsdesign.github.io/archflow/)** to start designing your architecture instantly - no setup required.

### Run Locally
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## How to Use

### First-Time Setup
1. **Launch Wizard**: On first visit, the onboarding wizard automatically appears (or click "Get Started")
2. **Answer Questions**: Go through 6 steps to define your project:
   - Choose project type (SaaS, E-commerce, etc.)
   - Select expected scale (MVP, Growth, Enterprise)
   - Set budget range ($0 to Enterprise)
   - Specify existing infrastructure (if any)
   - Rank your priorities (Cost, Performance, Simplicity, Scalability)
3. **Choose Template**: Review personalized template recommendations with match scores
4. **Apply & Customize**: Click "Use This Template" to populate your canvas, then customize as needed

### Building Your Architecture
1. **Browse Components**: Use the sidebar to browse available services
2. **Filter by Category**: Click category badges to filter services
3. **Search**: Use the search bar to find specific services
4. **Smart Suggestions**: Services are automatically filtered based on compatibility:
   - Green background with ✨ = Recommended (works well with your current setup)
   - Grayed out with 🚫 = Incompatible (conflicts with existing services)
   - Normal appearance = Compatible but not specifically recommended
5. **Drag & Drop**: Drag any compatible service from the sidebar onto the canvas
6. **Connect Services**: Click and drag from one node's handle to another to create connections
7. **View Details**: Click on any service node to see detailed information in the right panel
8. **Smart Recommendations**: Check the bottom-right panel for:
   - Recommended services based on your architecture
   - Warnings about potential issues
   - Suggestions to complete your setup
9. **Add Network Boundaries**: Click "Infrastructure" category to:
   - Drag VPCs, Subnets, Security Groups onto canvas
   - Drop services inside zones to auto-group them
   - Resize zones by selecting and dragging handles
   - Nest zones (e.g., Subnet inside VPC)
10. **Navigate Canvas**:
    - Pan by dragging the background
    - Zoom with mouse wheel or controls
    - Use minimap for overview
    - Click the canvas background to deselect nodes
11. **Start New Project**: Click "New Project" in header to run the wizard again
12. **View Cost Estimates**: Check the bottom-left panel for:
    - Total monthly cost based on your selected scale
    - Cost breakdown by category (Frontend, Backend, Database, etc.)
    - Budget status and warnings
    - Individual service costs (expand categories to see details)
13. **Adjust Scale**: Change scale tier (Startup MVP → Growth → Enterprise) to see cost changes
14. **Export & Share**: Click the "Export" button (top-left) to:
    - **Save Progress**: Export to JSON to save your architecture and reload it later
    - **Share Visually**: Export to PNG for presentations, Slack, or documentation
    - **Document**: Export to Markdown for GitHub READMEs or wikis
    - **Professional Reports**: Export to PDF for client deliverables
    - **Deploy Infrastructure**: Export to Terraform for Infrastructure as Code deployment

## Architecture Templates

### SaaS MVP Starter
- **Services**: Vercel, Supabase, Cloudflare CDN
- **Cost**: $0-20/month
- **Complexity**: Low (1/5)
- **Best for**: Startups, MVPs, free tier projects
- **Pros**: Free tier, quick setup, built-in auth

### E-commerce Standard
- **Services**: Vercel, Auth0, RDS Postgres, S3, Algolia
- **Cost**: $100-500/month
- **Complexity**: Medium (3/5)
- **Best for**: Growth stage, e-commerce platforms
- **Pros**: Scalable, robust search, secure payments ready

### Serverless AWS
- **Services**: Lambda, DynamoDB, S3, CloudFront, SQS
- **Cost**: $20-150/month
- **Complexity**: Medium (3/5)
- **Best for**: Variable workloads, pay-per-use
- **Pros**: Auto-scaling, no server management

### Modern SaaS (Jamstack)
- **Services**: Vercel, Clerk, Supabase, Stripe, Resend
- **Cost**: $0-50/month
- **Complexity**: Low-Medium (2/5)
- **Best for**: SaaS products needing auth, payments, and email
- **Pros**: Complete starter kit, generous free tiers, minimal backend

### Event-Driven Serverless
- **Services**: S3, Lambda, SQS, DynamoDB, SNS
- **Cost**: $10-200/month
- **Complexity**: High (4/5)
- **Best for**: Async processing, data pipelines, workflows
- **Pros**: Fully decoupled, scales automatically, pay-per-use

### Containerized Microservices
- **Services**: ALB, ECS (×2), ElastiCache, RDS, CloudWatch
- **Cost**: $150-1000/month
- **Complexity**: Very High (5/5)
- **Best for**: Enterprise applications, heavy compute
- **Pros**: Full control, independent scaling, battle-tested

### Rapid PaaS Monolith
- **Services**: Render, PlanetScale, Upstash Redis, GitHub Actions
- **Cost**: $7-100/month
- **Complexity**: Very Low (1/5)
- **Best for**: Indie hackers, MVPs, simple full-stack apps
- **Pros**: Simplest deployment, all free tiers, auto-deploy

## Available Services (54) + Infrastructure Zones (10)

### Multi-Cloud & Platform Coverage
ArchFlow provides a comprehensive catalog of services across AWS, GCP, Azure, and popular SaaS providers, covering all layers of modern cloud architectures.

### Services by Category
- **Frontend** (3): Vercel, Netlify, Cloudflare Pages
- **CDN** (2): Cloudflare CDN, AWS CloudFront
- **Backend** (11): AWS Lambda, AWS ECS, AWS ECS on EC2, AWS Fargate, GCP Cloud Run, Azure Functions, Azure Container Apps, Railway, Render, Fly.io, DigitalOcean App Platform
- **Database** (7): RDS Postgres, Supabase, PlanetScale, DynamoDB, MongoDB Atlas, Neon, Firebase/Firestore
- **Cache** (2): ElastiCache Redis, Upstash Redis
- **Queue & Workflow** (7): AWS SQS, AWS SNS, GCP Pub/Sub, Confluent Cloud (Kafka), RabbitMQ, Inngest, Temporal
- **Storage** (3): AWS S3, Cloudflare R2, GCP Cloud Storage
- **Auth** (3): Auth0, Clerk, Supabase Auth
- **Search** (2): Algolia, Elasticsearch
- **Monitoring** (3): Datadog, CloudWatch, Sentry
- **Analytics** (1): PostHog
- **Networking** (4): AWS API Gateway, AWS ALB, Route53, Cloudflare DNS
- **DevOps** (5): GitHub Actions, AWS Secrets Manager, Doppler, AWS ECR, Docker Hub
- **Integrations** (8): Stripe, Pusher, Resend, SendGrid, AWS SES, Sanity, Contentful, Strapi

### Infrastructure Zones (Phase 9)
- **AWS**: VPC, Public Subnet, Private Subnet, Availability Zone, Security Group, NAT Gateway
- **Generic**: Network Zone, Public Zone, Private Zone, DMZ

### Provider Breakdown
- **AWS**: 16 services + 6 infrastructure zones
- **GCP**: 4 services (Cloud Run, Pub/Sub, Cloud Storage, Firebase)
- **Azure**: 2 services (Functions, Container Apps)
- **Multi-Provider SaaS**: 28+ services (databases, auth, monitoring, integrations)
- **Open Source**: 2 services (Elasticsearch, RabbitMQ)
- **Generic Infrastructure**: 4 zones (cloud-agnostic network boundaries)

### What's New in Phase 6
The service library has been expanded to include the "glue" services that real production architectures need:

**Networking Layer**: No more direct Frontend → Database connections. Now you can add API Gateways for serverless architectures and Load Balancers for containerized services, showing realistic traffic flow.

**DevOps & Security**: Include CI/CD pipelines (GitHub Actions), secrets management (AWS Secrets Manager, Doppler), and container registries (ECR, Docker Hub) to show complete deployment workflows.

**Third-Party Integrations**: Add payments (Stripe), transactional email (Resend, SendGrid, SES), and headless CMS (Sanity, Contentful, Strapi) to build complete SaaS and e-commerce architectures.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Diagramming**: React Flow (Xyflow)
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Icons**: Lucide React
- **Build**: Vite
- **Export**: html-to-image, jsPDF, JSZip, FileSaver

## Next Steps (Future Phases)

- Phase 10: Collaboration features (real-time editing, comments, version history)
- Phase 11: Multi-cloud support (GCP and Azure Terraform generation)
- Phase 12: Advanced diagramming (custom icons, annotations, multi-page layouts)

## Project Structure

```
src/
├── components/
│   ├── Canvas/
│   │   ├── ArchitectureCanvas.tsx  # Main React Flow canvas
│   │   ├── CustomNode.tsx          # Service node component
│   │   ├── GroupNode.tsx           # Network boundary group component
│   │   └── AlignmentGuides.tsx     # Smart alignment guide overlays
│   ├── Panels/
│   │   ├── NodeDetailPanel.tsx     # Service detail panel
│   │   ├── EdgeDetailPanel.tsx     # Connection properties panel
│   │   └── ExportPanel.tsx         # Export/import menu
│   └── Sidebar/
│       └── ComponentPalette.tsx    # Draggable components list
├── data/
│   ├── services.ts                 # Service definitions with enhanced metadata
│   └── infrastructure.ts           # Network boundary zone definitions
├── hooks/
│   ├── useAlignmentGuides.ts       # Smart alignment detection
│   ├── useCompatibility.ts         # Service compatibility checking
│   └── useCostCalculator.ts        # Real-time cost estimation
├── store/
│   └── useArchitectureStore.ts     # Zustand store with group operations
└── types/
    ├── architecture.ts             # Node/Edge types (ServiceNode, GroupNode, ArchNode)
    ├── infrastructure.ts           # BoundaryZone types
    └── service.ts                  # Service types with Phase 2 metadata
```

## Development

The application runs at http://localhost:5173 when you run `npm run dev`.

All changes will hot-reload automatically thanks to Vite's HMR.
