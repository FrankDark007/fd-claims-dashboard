# Project History — fd-claims-dashboard

## 2026-08-15 — Source Reconciliation + Security Hardening

### Work Done
1. Recovered and reconciled production-only contract import, share analytics, business category, and Gmail alert functionality into Git.
2. Added transactional Gmail alert/communication writes, authoritative D1 deduplication, bounded webhook input, and conservative project matching.
3. Removed raw share-token logging, anonymized view analytics, bounded retention, and hardened file download headers and filenames.
4. Added contract size/signature checks, safer PDF extraction, and D1/R2 compensation when an import fails.
5. Added Pages Functions type-checking, current dependencies, production-secret inventory checks, and Google ID-token signature/audience verification.
6. Removed development redirect pages from production output so Cloudflare Pages can provide native SPA fallback routing.

### Decisions
- Only exact sender or claim/Xactimate-strength Gmail matches are auto-filed; weak or ambiguous candidates require review.
- Share analytics retain only a token hash, network-level IP prefix, bounded user agent, and referrer origin for 180 days.
- The checked-in Google OAuth client ID is public configuration; private credentials remain encrypted Pages secrets.

## 2026-03-06 — Production Deployment + Auth Fix + UX Polish

### Work Done
1. Created D1 database fd-claims-dashboard (b1d58d87-7c59-4444-911b-90ce65be1d77)
2. Updated wrangler.toml with real D1 IDs (was placeholders)
3. Applied 3 migrations to remote D1: initial, follow_up_workflow, project_communications
4. Discovered and fixed auth middleware bug — context.request replacement doesn't propagate in Pages Functions
5. Added context.data.user pattern + getUserField() helper across all 10 API handler files
6. Provisioned frank user in production KV with PBKDF2 hashed password
7. Activated R2 (required manual dashboard step), created fd-project-files bucket
8. Re-enabled R2 binding in wrangler.toml and redeployed
9. Added title-case normalization for client names (server + client)
10. Made file upload require explicit document type selection
11. Added auto-status-update: uploading Contract/COC/Dry Logs/Invoice auto-promotes document status
12. Fixed Drew Harmon's mis-categorized file (other→contracts) and status (Missing→Signed) via D1

### Decisions
- Used context.data instead of context.request replacement for passing auth user through Pages Functions middleware — this is the reliable pattern
- Auto-status only promotes from default "Missing"/"Not Started" — won't overwrite manual status changes like "Requested"
- File upload category defaults to empty (must choose) when using generic Upload button; pre-selects when clicking a checklist card

### Bugs
- context.request = newRequest does NOT propagate to downstream handlers in Cloudflare Pages Functions (middleware pattern). Must use context.data.
- R2 cannot be enabled via API/CLI — requires manual Cloudflare Dashboard activation
- KV eventual consistency: session tokens written by auth endpoint may not be immediately readable by middleware on different edge nodes (but this turned out not to be the actual issue — it was the context.request bug)

### Commits
- 3960ee2: Wire real D1 database ID, temporarily disable R2 binding
- 549f7ec: Fix auth middleware: use context.data for user propagation
- a0d8101: Title-case client names on create
- 19fe277: Require document type selection before file upload
- b200842: Auto-update document status when matching file is uploaded
- e0e80b4: Re-enable R2 binding now that R2 is activated

## 2026-03-05 — Initial Build

### Work Done
1. Scaffolded React + Vite + TS + Tailwind CSS v4 project
2. Queried Notion Invoice Tracker DB via MCP to get full schema (16 properties)
3. Built components: Sidebar (dark theme), ClaimsTable (search, filter, 14 columns), StatusPill (color-coded), StatsCard, LoginPage (Tailwind UI dark template)
4. Created Cloudflare Pages Functions: /api/claims (GET/PATCH), /api/auth (password), /api/auth/google (Google OAuth), /api/webhook (Notion webhooks)
5. Auth middleware protecting all /api/* except auth + webhook endpoints
6. Created Cloudflare Pages project via API (wrangler CLI had 8000000 error)
7. Set secrets: NOTION_API_KEY, DASHBOARD_PASSWORD, AUTH_SECRET, ALLOWED_EMAIL
8. Added DNS CNAME: projects.flood.doctor → fd-claims-dashboard.pages.dev
9. Had to temporarily unproxy CNAME for Pages domain verification, then re-enable
10. Added Google Sign-In using Google Identity Services (GSI) library

### Decisions
- Used Cloudflare Pages Functions instead of separate Express server for deployment simplicity
- Kept Express server/api.ts for local dev option
- Password + Google OAuth dual auth — Google restricted to allowed email list
- Used existing GCP OAuth Client ID (904013675236-...) — needs origin config by user
- Design tokens from .interface-design/system.md: #1a73e8 primary, Plus Jakarta Sans, MD3 shadows
- Sidebar colors: custom dark theme (#1e1e2e base)

### Bugs / Issues
- Cloudflare Pages project creation via wrangler CLI fails with error 8000000 — used API directly
- Wrangler OAuth token doesn't have DNS scope — used CF_TOKEN from Mission Control .env for DNS
- Cloudflare Pages deploy sometimes returns 502 — retry works

### Credentials Added
- NOTION_API_KEY added to ~/.claude/credentials.local
- Notion integration token: user created via notion.so/profile/integrations
