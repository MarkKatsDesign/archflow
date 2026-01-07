# ArchFlow - Phase 5 Complete

Visual System Architecture Designer - A drag-and-drop webapp for designing system architectures.

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

## Getting Started

```bash
# Install dependencies (already done)
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
9. **Navigate Canvas**:
   - Pan by dragging the background
   - Zoom with mouse wheel or controls
   - Use minimap for overview
   - Click the canvas background to deselect nodes
10. **Start New Project**: Click "New Project" in header to run the wizard again
11. **View Cost Estimates**: Check the bottom-left panel for:
    - Total monthly cost based on your selected scale
    - Cost breakdown by category (Frontend, Backend, Database, etc.)
    - Budget status and warnings
    - Individual service costs (expand categories to see details)
12. **Adjust Scale**: Change scale tier (Startup MVP → Growth → Enterprise) to see cost changes

## Architecture Templates

### SaaS MVP Starter
- **Services**: Vercel, Supabase, Cloudflare CDN
- **Cost**: $0-20/month
- **Best for**: Startups, MVPs, free tier projects
- **Pros**: Free tier, quick setup, built-in auth

### E-commerce Standard
- **Services**: Vercel, Auth0, RDS Postgres, S3, Algolia
- **Cost**: $100-500/month
- **Best for**: Growth stage, e-commerce platforms
- **Pros**: Scalable, robust search, secure payments ready

### Serverless AWS
- **Services**: Lambda, DynamoDB, S3, CloudFront, SQS
- **Cost**: $20-150/month
- **Best for**: Variable workloads, pay-per-use
- **Pros**: Auto-scaling, no server management

## Available Services (28)

### Categories
- Frontend (3): Vercel, Netlify, Cloudflare Pages
- CDN (2): Cloudflare CDN, AWS CloudFront
- Backend (5): AWS Lambda, AWS ECS, GCP Cloud Run, Railway, Render
- Database (5): RDS Postgres, Supabase, PlanetScale, MongoDB Atlas, DynamoDB
- Cache (2): ElastiCache, Upstash Redis
- Queue (3): SQS, SNS, RabbitMQ
- Storage (2): S3, Cloudflare R2
- Auth (3): Auth0, Clerk, Supabase Auth
- Search (2): Algolia, Elasticsearch
- Monitoring (2): Datadog, CloudWatch

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Diagramming**: React Flow (Xyflow)
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Icons**: Lucide React
- **Build**: Vite

## Next Steps (Future Phases)

- Phase 6: Export functionality (PNG, PDF, JSON, Markdown, Terraform stubs)

## Project Structure

```
src/
├── components/
│   ├── Canvas/
│   │   ├── ArchitectureCanvas.tsx  # Main React Flow canvas
│   │   └── CustomNode.tsx          # Service node component
│   ├── Panels/
│   │   └── NodeDetailPanel.tsx     # Service detail panel
│   └── Sidebar/
│       └── ComponentPalette.tsx    # Draggable components list
├── data/
│   └── services.ts                 # Service definitions with enhanced metadata
├── store/
│   └── useArchitectureStore.ts     # Zustand store with selection state
└── types/
    ├── architecture.ts             # Node/Edge types
    └── service.ts                  # Service types with Phase 2 metadata
```

## Development

The application runs at http://localhost:5173 when you run `npm run dev`.

All changes will hot-reload automatically thanks to Vite's HMR.
