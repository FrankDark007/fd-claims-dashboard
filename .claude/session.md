# Session State — fd-claims-dashboard

## Current Task
Evolving claims dashboard into full project management tool at projects.flood.doctor

## Status: Phases 1+2+3+4 Complete

### What's Done
- [x] MVP: React + Vite + TypeScript + Tailwind CSS v4 on Cloudflare Pages
- [x] Multi-user auth with KV-backed sessions + Google Sign-In
- [x] **Phase 1: Layout overhaul** — Headless UI AppShell (dark sidebar, mobile drawer, top bar with search + profile dropdown)
- [x] **Phase 1: Dashboard** — Brand icon stats, invoice aging buckets (0-30/30-60/60-90/90+), recent projects with progress bars
- [x] **Phase 1: Claims -> Projects rename** — ProjectsPage with View buttons linking to detail
- [x] **Phase 2: Project detail page** — Tabs (Overview, Files, Timeline, Email), progress tracker, all 19 Notion properties
- [x] **Phase 2: Backend APIs** — KV namespace FD_PROJECTS_DATA, GET/PUT /api/projects/:id/data
- [x] **Phase 2: Notion pagination** — Fixed to fetch beyond 100 results
- [x] Added @headlessui/react + @heroicons/react
- [x] **Phase 3: File Management (R2)** — Upload, download, share with expiring tokens
- [x] **Phase 4: Invoice Calendar** — Monthly grid, event tracking, Mark Sent/Paid modal
- [x] **Deployment** — Live at projects.flood.doctor, Google OAuth (Web app client), SPA fallback
- [x] **Create Project** — Modal on Projects page, writes to Notion DB with defaults

### Phase 3 Details (commit 1454708)
- R2 bucket binding added to wrangler.toml (FD_PROJECT_FILES)
- **BLOCKER**: R2 needs to be enabled in Cloudflare Dashboard before bucket creation
  - After enabling: `npx wrangler r2 bucket create fd-project-files`
- Backend: POST/GET/DELETE /api/projects/:id/files (R2 + KV metadata)
- Backend: POST /api/projects/:id/share (expiring share tokens via KV TTL)
- Backend: GET /api/share/:token (public, no-auth file streaming)
- Frontend: FileUploader (drag-drop, category selector, multi-file queue)
- Frontend: FileList (grouped by category, download/share/delete)
- Frontend: ShareLinkModal (Headless UI, configurable expiry, copy-to-clipboard)
- Updated FilesTab, ProjectDetailPage to wire everything together
- Middleware updated: /api/share/ is public (no auth)

### Cloudflare Resources
- KV: FD_CLAIMS_USERS (b2ed4696a8184c43a3e6c5f9d6b20af9) — users, sessions
- KV: FD_PROJECTS_DATA (18281eb24d2a4be2bdb52ac0ef39fa23) — files, emails, invoice events per project
- R2: FD_PROJECT_FILES (fd-project-files) — **PENDING: enable R2 in dashboard**
- DNS: projects.flood.doctor CNAME -> fd-claims-dashboard.pages.dev
- Secrets: NOTION_API_KEY, AUTH_SECRET, ALLOWED_EMAIL

### Notion DB
- Database ID: 3a496fa362994550910a04937d747166
- Properties: Client Name, Invoice ID, Project, Project Type, Amount, Status, Contract, COC, Final Invoice, CompanyCam, Matterport, Rewrite Status, Xactimate #, Date Added, Drive Folder, Notes, Done

### Phase 4 Details (commit 69aaa34)
- Monthly calendar grid with day cells showing invoice events
- Month summary cards: sent/paid/reminder/disputed counts + amounts
- Click any day to add invoice event (project selector, type, amount, notes)
- AddInvoiceEventModal with auto-fill from project amount
- GET /api/invoice-events — aggregates across all projects via KV list prefix scan
- POST /api/invoice-events — adds event to project's KV store
- useInvoiceEvents hook with optimistic add
- Recent events list with project detail links
- CalendarPage wired into /calendar route (replaced placeholder)

## Next Steps (Phase 5)
- [ ] **Phase 5: Gmail Integration** — OAuth2 for 2-3 accounts, send/receive from project Email tab

## Remaining TODO
- [x] ~~Add SPA routing fallback~~ — done (public/_redirects)
- [ ] Create GitHub repo (private) and push
- [ ] Add inline status editing (click pill -> dropdown to update Notion)
- [ ] **Enable R2 in Cloudflare Dashboard** then uncomment binding in wrangler.toml

## Key Files
```
src/
├── components/
│   ├── AppShell.tsx          # Headless UI dark sidebar + top bar
│   ├── InvoiceAgingCard.tsx  # 4-bucket aging display
│   ├── LoginPage.tsx         # Auth page
│   ├── ProjectListItem.tsx   # List row with progress bar
│   ├── StatsCard.tsx         # Brand icon stats card
│   ├── CreateProjectModal.tsx # Create new project -> Notion
│   ├── StatusPill.tsx        # Color-coded status badges
│   ├── calendar/
│   │   └── AddInvoiceEventModal.tsx # Add sent/paid/reminder/disputed
│   └── project/
│       ├── EmailTab.tsx      # Placeholder (Phase 5)
│       ├── FileList.tsx      # File grid by category + actions
│       ├── FilesTab.tsx      # Orchestrates upload/list
│       ├── FileUploader.tsx  # Drag-drop upload + category
│       ├── OverviewTab.tsx   # All Notion properties
│       ├── ProgressTracker.tsx # Contract->COC->Invoice->Paid
│       ├── ShareLinkModal.tsx # Expiring share link creation
│       └── TimelineTab.tsx   # Activity feed
├── hooks/
│   ├── useAuth.ts
│   ├── useInvoiceEvents.ts   # All events + create
│   ├── useNotionData.ts      # + computeAging()
│   └── useProject.ts         # Per-project KV data
├── pages/
│   ├── CalendarPage.tsx       # Monthly invoice calendar
│   ├── DashboardPage.tsx
│   ├── ProjectDetailPage.tsx
│   ├── ProjectsPage.tsx
│   └── UsersPage.tsx
└── types/claim.ts            # + Project, InvoiceAgingBucket, ProjectActivity

functions/api/
├── _middleware.ts            # Auth + /api/share/ public bypass
├── auth.ts / auth/google.ts
├── claims.ts                 # Paginated Notion queries
├── projects/create.ts        # POST new project to Notion
├── projects/[id]/data.ts     # KV project data CRUD
├── projects/[id]/files.ts    # R2 file upload/download/delete
├── projects/[id]/share.ts    # Create share tokens
├── invoice-events.ts         # GET all / POST new invoice events
├── share/[token].ts          # Public file streaming
├── users.ts
└── webhook.ts
```
