# Project History — fd-claims-dashboard

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
