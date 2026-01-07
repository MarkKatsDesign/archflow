# ArchFlow - Phase 3 Complete

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

- Phase 4: Onboarding wizard
- Phase 5: Cost estimation
- Phase 6: Templates and export functionality

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
