# Archived Variant Code

This directory contains **unique code extracted from variant repositories** before they were deleted.
Each subdirectory corresponds to a deleted repo and contains only the files that were NOT already present in `cortexbuild-pro`.

## Source Repos & What's Unique

### CortexBuild Line
- **`cortexbuild/`** (1259 files) — From `CortexBuild` (635 commits). Unique: ProductionSDKDeveloperView (2075 LOC), DatabaseViewer, PlansViewerScreen, DiffViewer, ReportViewer, plus many .md docs
- **`cortexbuild-supabase/`** (722 files) — From `CortexBuild-1.0.0-supabase`. Unique: 267 components including AI App Builder, AI Workflow Automation, Developer Console, Code Sandbox, 54 Screen components, 18 Widgets. Had Vite 7.x
- **`cortexbuild-final/`** (124 files) — From `cortexbuild-final`. Unique: Newer @google/genai ^1.34.0, DB migration scripts, Supabase seed scripts, tenant provisioning

### BuildPro Line
- **`buildproapp2/`** (112 files) — From `Buildproapp2` (458 commits). Unique: AuditLogService, DB migration scripts, tenant management, newer @google/genai ^1.30.0
- **`buildproapp/`** (19 files) — From `Buildproapp`. Unique views: ArchitectureView, DevSandboxView, IntelligenceHubView, MeshView, PlatformPulseView, VisionView, SystemConsoleView, PunchItemsView
- **`buildprogemini/`** (52 files) — From `-Buildprogemini-`. Unique: Deploy scripts, GitHub Actions, backend Python files

### ConstructAI Line
- **`constructai-5/`** (435 files) — From `constructai--5-` (123 commits). Unique: 169 components including AI Agents Marketplace, SDK screens, Cognitive Insights, Business Development, Advanced ML Dashboard, SQL migration scripts

### AsAgents Line
- **`final-asagents/`** (1757 files) — From `final`. Unique: 337 files including AI Advisor, AI Code Assistant, AI Voice Input, Auth0 integration, Backend Connection system, Bid Package Generator, Cost Estimator, Funding Bot, Risk Bot, Safety Analysis
- **`admin/`** (953 files) — From `admin` monorepo. Contains `open-lovable` (AI IDE with Anthropic, E2B code interpreter, 67 deps), plus copies of other sub-projects
- **`main/`** (44 files) — From `main`. Unique: FundingBot, RiskBot, SafetyAnalysis, WorkforcePlanner, PrincipalAdminDashboard
- **`asagents3/`** (20 files) — From `asagents3`. Bug fixes over asagents2: site management, theme support, reminder service
- **`asagents-couk/`** (126 files) — From `asagents.co.uk-ready`. Unique field-specific features: ForemanDashboard, expense tracking

### Other
- **`project-perplexy/`** (223 files) — Multi-tenant ConstructAI variant with 9 specialized AI agents, offline PWA, Socket.IO real-time sync

## Usage
These files are archived for reference. To integrate any component into the main app:
1. Find the component in the relevant subdirectory
2. Copy it into `src/` with appropriate imports
3. Update dependencies in `package.json` if needed
