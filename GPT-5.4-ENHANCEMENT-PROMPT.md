# GPT-5.4 Enhancement Prompt: Flood Doctor Claims Dashboard

> **This file contains TWO prompts.** Run PROMPT 1 first (audit), review findings, then run PROMPT 2 (enhancement).

---

# TABLE OF CONTENTS

1. [Project Identity](#section-1-project-identity)
2. [Tech Stack](#section-2-tech-stack)
3. [Complete File Tree](#section-3-complete-file-tree)
4. [Architecture](#section-4-architecture)
5. [All API Endpoints](#section-5-all-api-endpoints)
6. [Notion Database Schema](#section-6-notion-database-schema)
7. [All TypeScript Types](#section-7-all-typescript-types)
8. [All React Hooks](#section-8-all-react-hooks)
9. [Known Bugs](#section-9-known-bugs)
10. [Design System](#section-10-design-system)
11. [Tailwind Plus Component Library](#section-11-tailwind-plus-component-library)
12. [Industry Benchmark](#section-12-industry-benchmark)
13. [PROMPT 1: Codebase Audit](#prompt-1-codebase-audit)
14. [PROMPT 2: Enhancement Execution](#prompt-2-enhancement-execution)
15. [Additional Suggestions](#section-15-additional-suggestions)
16. [Constraints](#section-16-constraints)

---

# SECTION 1: PROJECT IDENTITY

| Field | Value |
|-------|-------|
| **Name** | Flood Doctor Claims Dashboard |
| **Internal name** | `fd-claims-dashboard` |
| **Repository** | `https://github.com/FrankDark007/fd-claims-dashboard.git` |
| **Live URL** | `projects.flood.doctor` |
| **Purpose** | Internal project/claims management for Flood Doctor, a water damage restoration company |
| **Users** | Flood Doctor staff (admin + member roles) |
| **Data source** | Notion database (primary), Cloudflare KV (sessions, project data), Cloudflare R2 (file storage) |

---

# SECTION 2: TECH STACK

## Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2.0 | UI framework |
| `react-dom` | 19.2.0 | DOM rendering |
| `react-router-dom` | 7.13.1 | Client-side routing (6 routes) |
| `@headlessui/react` | 2.2.9 | Accessible UI primitives (Dialog, Menu, Listbox, etc.) |
| `@heroicons/react` | 2.2.0 | Icon library |
| `tailwindcss` | 4.2.1 | Utility-first CSS (v4 with `@tailwindcss/vite` plugin) |
| `@tailwindcss/forms` | 0.5.11 | Form element reset |

## Build & Dev
| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 7.3.1 | Build tool & dev server (port 5174) |
| `@vitejs/plugin-react` | 5.1.1 | React Fast Refresh |
| `typescript` | 5.9.3 | Type checking |
| `eslint` | 9.39.1 | Linting |
| `concurrently` | 9.2.1 | Run Vite + Express simultaneously |
| `tsx` | 4.21.0 | TypeScript execution for dev server |

## Backend (Production)
| Service | Purpose |
|---------|---------|
| **Cloudflare Pages** | Static site hosting + serverless functions |
| **Cloudflare Pages Functions** | API endpoints (in `functions/api/`) |
| **Cloudflare KV** | Session storage (`FD_CLAIMS_USERS`), project data (`FD_PROJECTS_DATA`) |
| **Cloudflare R2** | File storage (`FD_PROJECT_FILES`) — **CURRENTLY BROKEN/UNBOUND** |

## Backend (Local Dev)
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 5.2.1 | Local API proxy server (port 3002) |
| `@notionhq/client` | 5.11.1 | Notion SDK for local dev |
| `cors` | 2.8.6 | CORS middleware |
| `dotenv` | 17.3.1 | Environment variable loading |

## Dependency Count
- **Production dependencies**: 12
- **Dev dependencies**: 14

---

# SECTION 3: COMPLETE FILE TREE

```
fd-claims-dashboard/
|-- package.json                                    (46 lines)  Project config & scripts
|-- package-lock.json                               (5358 lines) Lock file
|-- vite.config.ts                                  (16 lines)  Vite config with Tailwind plugin, proxy to :3002
|-- tsconfig.json                                   (7 lines)   Root TS config (references app + node)
|-- tsconfig.app.json                               (28 lines)  App-level TS config
|-- tsconfig.node.json                              (26 lines)  Node-level TS config
|-- tsconfig.server.json                            (12 lines)  Server-level TS config
|-- eslint.config.js                                (23 lines)  ESLint 9 flat config
|-- wrangler.toml                                   (22 lines)  Cloudflare Pages config (KV bindings, R2 commented out)
|-- index.html                                      (13 lines)  SPA entry point
|
|-- server/
|   |-- api.ts                                      (97 lines)  Express dev server (Notion proxy)
|
|-- scripts/
|   |-- seed-admin.ts                               (58 lines)  Admin user seeding script
|
|-- src/
|   |-- main.tsx                                    (10 lines)  React entry point
|   |-- App.tsx                                     (60 lines)  Root component with routing
|   |-- index.css                                   (42 lines)  Theme tokens + Tailwind import
|   |
|   |-- types/
|   |   |-- claim.ts                                (76 lines)  All TypeScript interfaces & type aliases
|   |
|   |-- hooks/
|   |   |-- useAuth.ts                              (92 lines)  Auth state (login, googleLogin, logout, token verify)
|   |   |-- useNotionData.ts                        (64 lines)  Claims fetching + stats/aging computation
|   |   |-- useProject.ts                           (69 lines)  Single project data (files, emails, invoiceEvents)
|   |   |-- useInvoiceEvents.ts                     (66 lines)  Global invoice events CRUD
|   |
|   |-- components/
|   |   |-- AppShell.tsx                            (221 lines) Sidebar nav + top bar layout
|   |   |-- LoginPage.tsx                           (155 lines) Login form + Google OAuth button
|   |   |-- CreateProjectModal.tsx                  (279 lines) New project creation form
|   |   |-- ProjectListItem.tsx                     (92 lines)  Single project row in list
|   |   |-- StatsCard.tsx                           (46 lines)  Dashboard stat card
|   |   |-- StatusPill.tsx                          (44 lines)  Colored status badge
|   |   |-- InvoiceAgingCard.tsx                    (39 lines)  Invoice aging bucket display
|   |   |
|   |   |-- project/
|   |   |   |-- OverviewTab.tsx                     (95 lines)  Project detail overview
|   |   |   |-- FilesTab.tsx                        (90 lines)  File upload + listing container
|   |   |   |-- FileUploader.tsx                    (181 lines) Drag-drop file upload component
|   |   |   |-- FileList.tsx                        (191 lines) File grid with categories
|   |   |   |-- EmailTab.tsx                        (18 lines)  **STUB** - "Coming soon"
|   |   |   |-- TimelineTab.tsx                     (105 lines) Activity timeline
|   |   |   |-- ProgressTracker.tsx                 (100 lines) Contract/COC/Invoice stepper
|   |   |   |-- ShareLinkModal.tsx                  (187 lines) File sharing modal
|   |   |
|   |   |-- calendar/
|   |       |-- AddInvoiceEventModal.tsx            (242 lines) Invoice event creation form
|   |
|   |-- pages/
|       |-- DashboardPage.tsx                       (94 lines)  Main dashboard with stats
|       |-- ProjectsPage.tsx                        (172 lines) Projects list with search/filter
|       |-- ProjectDetailPage.tsx                   (219 lines) Project detail with 4 tabs
|       |-- CalendarPage.tsx                        (408 lines) Calendar with invoice events
|       |-- UsersPage.tsx                           (240 lines) User management (admin only)
|
|-- functions/
    |-- api/
        |-- _middleware.ts                          (51 lines)  Auth middleware (JWT/KV session check)
        |-- auth.ts                                 (79 lines)  Login endpoint (PBKDF2 password verify)
        |-- claims.ts                               (129 lines) Notion database CRUD
        |-- users.ts                                (149 lines) User CRUD (admin only)
        |-- invoice-events.ts                       (107 lines) Invoice event CRUD (KV-backed)
        |-- webhook.ts                              (27 lines)  Notion webhook receiver (stub)
        |
        |-- auth/
        |   |-- google.ts                           (67 lines)  Google OAuth token verification
        |
        |-- projects/
        |   |-- create.ts                           (98 lines)  Create project in Notion
        |   |-- [id]/
        |       |-- data.ts                         (57 lines)  Project data aggregator (files + emails + events)
        |       |-- files.ts                        (120 lines) File upload/list/delete (R2 + KV)
        |       |-- share.ts                        (74 lines)  Share link creation
        |
        |-- share/
            |-- [token].ts                          (55 lines)  Public file download via share token
```

**Total source files**: ~40 (excluding node_modules, dist, lock file)
**Total source lines**: ~4,200 (excluding lock file and build artifacts)

---

# SECTION 4: ARCHITECTURE

## System Diagram

```
+-------------------+       +----------------------+       +------------------+
|  React SPA        |       |  Cloudflare Pages    |       |  Notion API      |
|  (Vite build)     | ----> |  Functions           | ----> |  (Database)      |
|  Port 5174 (dev)  |       |  (Serverless)        |       |                  |
+-------------------+       +----------------------+       +------------------+
                                    |
                            +-------+--------+
                            |                |
                   +--------v---+    +-------v-------+
                   | CF KV      |    | CF R2         |
                   | (Sessions, |    | (File storage)|
                   |  project   |    | **BROKEN**    |
                   |  data)     |    |               |
                   +------------+    +---------------+
```

## Frontend Architecture
- **React SPA** with React Router (6 routes)
- **State management**: React hooks + localStorage (no Redux/Zustand)
- **Routing**:
  - `/` — DashboardPage
  - `/projects` — ProjectsPage
  - `/projects/:id` — ProjectDetailPage (4 tabs: Overview, Files, Email, Timeline)
  - `/calendar` — CalendarPage
  - `/settings` — PlaceholderPage ("Coming soon")
  - `/users` — UsersPage (admin only)

## Backend Architecture
- **Production**: Cloudflare Pages Functions (serverless, file-based routing in `functions/api/`)
- **Local dev**: Express proxy on port 3002 (only implements `/api/claims` GET + PATCH)
- **Auth**: JWT-like tokens stored in Cloudflare KV with 7-day TTL
  - Password hashing: PBKDF2 (SHA-256, 100k iterations)
  - Session tokens: SHA-256 hash of `userId:username:nonce:secret`
  - Middleware (`_middleware.ts`) validates session on every request, injects `X-User-*` headers
- **Data flow**: Notion DB --> Cloudflare Function --> React frontend
- **File storage**: Cloudflare R2 bucket `fd-project-files` — **NOT BOUND in wrangler.toml** (commented out)
- **KV Namespaces**:
  - `FD_CLAIMS_USERS` (id: `b2ed4696a8184c43a3e6c5f9d6b20af9`) — user records + sessions
  - `FD_PROJECTS_DATA` (id: `18281eb24d2a4be2bdb52ac0ef39fa23`) — project files/emails/events metadata

## Build & Deploy
- **Build command**: `tsc -b && vite build`
- **Output**: `dist/` directory
- **Deploy**: Cloudflare Pages (auto-deploy from git)
- **Dev**: `concurrently "vite" "tsx server/api.ts"` (runs both Vite dev server and Express API)

---

# SECTION 5: ALL API ENDPOINTS

## Authentication

### `POST /api/auth`
**Auth**: None (public)
**Request**:
```json
{ "username": "string", "password": "string" }
```
**Response** (200):
```json
{
  "token": "hex-string",
  "user": {
    "userId": "uuid",
    "username": "string",
    "displayName": "string",
    "role": "admin | member",
    "email": "string | null"
  }
}
```
**Errors**: 400 (missing fields), 401 (bad creds), 500

### `POST /api/auth/google`
**Auth**: None (public)
**Request**:
```json
{ "credential": "google-id-token" }
```
**Response**: Same as `/api/auth`
**Flow**: Verifies Google ID token via `oauth2.googleapis.com/tokeninfo`, scans KV for matching email
**Errors**: 400, 401, 403 (no linked account), 500

## Claims / Projects

### `GET /api/claims`
**Auth**: Bearer token
**Response**: Array of `Claim` objects (full Notion database dump, sorted by Date Added desc)
**Pagination**: Handles Notion's 100-item pages internally (fetches all)

### `PATCH /api/claims` (with ID in path — see note)
**Auth**: Bearer token
**Note**: The endpoint parses the claim ID from the URL path segments. The PATCH handler is on the same file as GET.
**Request**: Partial claim update:
```json
{
  "status?": "Draft | Sent | Paid | Overdue",
  "contract?": "Missing | Requested | Signed",
  "coc?": "Missing | Requested | Signed",
  "finalInvoice?": "Not Started | Drafting | Review | Complete",
  "matterport?": "N/A | Missing | Has Scan",
  "rewriteStatus?": "Not Started | In Progress | Review | Done",
  "done?": "boolean",
  "amount?": "number",
  "notes?": "string"
}
```
**Response**: `{ "success": true }`

### `POST /api/projects/create`
**Auth**: Bearer token
**Request**:
```json
{
  "clientName": "string (required)",
  "project?": "string",
  "projectType?": "Water Mitigation | Pack-out | Mold Remediation",
  "amount?": "number",
  "notes?": "string",
  "xactimateNumber?": "string",
  "companyCam?": "url",
  "driveFolder?": "url"
}
```
**Response** (201): `{ "id": "notion-page-id", "url": "notion-url" }`

## Project Data

### `GET /api/projects/:id/data`
**Auth**: Bearer token
**Response**:
```json
{
  "files": "ProjectFile[]",
  "emails": "ProjectEmail[]",
  "invoiceEvents": "InvoiceEvent[]"
}
```

### `PUT /api/projects/:id/data`
**Auth**: Bearer token
**Request**:
```json
{
  "section": "files | emails | invoiceEvents",
  "data": "array"
}
```
**Response**: `{ "success": true }`

## File Management

### `GET /api/projects/:id/files`
**Auth**: Bearer token
**Response**: `{ "files": FileMetadata[] }`

### `POST /api/projects/:id/files`
**Auth**: Bearer token
**Content-Type**: `multipart/form-data`
**Fields**: `file` (File, max 50MB), `category` (contracts|cocs|photos|other)
**Response** (201): `{ "file": FileMetadata }`
**Status**: **BROKEN** — R2 bucket `FD_PROJECT_FILES` not bound in wrangler.toml

### `DELETE /api/projects/:id/files?fileId=xxx`
**Auth**: Bearer token
**Response**: `{ "success": true }`
**Status**: **BROKEN** — same R2 issue

## Share Links

### `POST /api/projects/:id/share`
**Auth**: Bearer token
**Request**:
```json
{
  "fileId": "string (required)",
  "expiresInHours?": "number (default: 72)"
}
```
**Response** (201):
```json
{
  "shareUrl": "https://projects.flood.doctor/api/share/{token}",
  "token": "uuid",
  "expiresAt": "ISO date"
}
```

### `GET /api/share/:token`
**Auth**: None (public)
**Response**: File stream with appropriate Content-Type
**Status**: **BROKEN** — depends on R2

## Invoice Events

### `GET /api/invoice-events`
**Auth**: Bearer token
**Response**: `{ "events": InvoiceEventWithProject[] }` (sorted by date desc)
**Implementation**: Scans all KV keys with prefix `project:` and suffix `:invoiceEvents`

### `POST /api/invoice-events`
**Auth**: Bearer token
**Request**:
```json
{
  "projectId": "string",
  "type": "sent | reminder | paid | disputed",
  "date": "ISO date",
  "amount": "number",
  "notes?": "string"
}
```
**Response** (201): `{ "event": InvoiceEventWithProject }`

## Users (Admin Only)

### `GET /api/users`
**Auth**: Bearer token (admin role required)
**Response**: `{ "users": UserRecord[] }` (password hash + salt stripped)

### `POST /api/users`
**Auth**: Bearer token (admin role required)
**Request**:
```json
{
  "username": "string",
  "password": "string",
  "displayName": "string",
  "role?": "admin | member (default: member)",
  "email?": "string"
}
```
**Response** (201): `{ "user": UserRecord }`

### `DELETE /api/users?username=xxx`
**Auth**: Bearer token (admin role required)
**Cannot delete yourself**
**Response**: `{ "ok": true }`

## Webhook

### `POST /api/webhook`
**Auth**: None (public)
**Purpose**: Notion webhook receiver (currently only logs + handles url_verification challenge)

### `GET /api/webhook`
**Auth**: None (public)
**Response**: `{ "status": "webhook active" }`

---

# SECTION 6: NOTION DATABASE SCHEMA

Database ID: `3a496fa362994550910a04937d747166`

| # | Field Name | Notion Type | Values / Format | Maps to TS |
|---|-----------|-------------|-----------------|------------|
| 1 | Client Name | `title` | Free text | `clientName: string` |
| 2 | Invoice ID | `unique_id` | Auto-increment number | `invoiceId: number \| null` |
| 3 | Project | `rich_text` | Free text (job description) | `project: string` |
| 4 | Project Type | `select` | `Water Mitigation`, `Pack-out`, `Mold Remediation` | `projectType: ProjectType \| null` |
| 5 | Amount | `number` | Dollar amount | `amount: number \| null` |
| 6 | Status | `select` | `Draft`, `Sent`, `Paid`, `Overdue` | `status: InvoiceStatus \| null` |
| 7 | Contract | `select` | `Missing`, `Requested`, `Signed` | `contract: ContractStatus \| null` |
| 8 | COC | `select` | `Missing`, `Requested`, `Signed` | `coc: COCStatus \| null` |
| 9 | Final Invoice | `select` | `Not Started`, `Drafting`, `Review`, `Complete` | `finalInvoice: FinalInvoiceStatus \| null` |
| 10 | CompanyCam | `url` | CompanyCam project URL | `companyCam: string` |
| 11 | Matterport | `select` | `N/A`, `Missing`, `Has Scan` | `matterport: MatterportStatus \| null` |
| 12 | Rewrite Status | `select` | `Not Started`, `In Progress`, `Review`, `Done` | `rewriteStatus: RewriteStatus \| null` |
| 13 | Xactimate # | `rich_text` | Xactimate claim number | `xactimateNumber: string` |
| 14 | Date Added | `date` | ISO date string | `dateAdded: string \| null` |
| 15 | Drive Folder | `url` | Google Drive folder URL | `driveFolder: string` |
| 16 | Notes | `rich_text` | Free text notes | `notes: string` |
| 17 | Done | `checkbox` | boolean | `done: boolean` |

---

# SECTION 7: ALL TYPESCRIPT TYPES

```typescript
// src/types/claim.ts — COMPLETE FILE

export type ContractStatus = 'Missing' | 'Requested' | 'Signed'
export type COCStatus = 'Missing' | 'Requested' | 'Signed'
export type FinalInvoiceStatus = 'Not Started' | 'Drafting' | 'Review' | 'Complete'
export type MatterportStatus = 'N/A' | 'Missing' | 'Has Scan'
export type RewriteStatus = 'Not Started' | 'In Progress' | 'Review' | 'Done'
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue'
export type ProjectType = 'Water Mitigation' | 'Pack-out' | 'Mold Remediation'

export interface Claim {
  id: string
  notionUrl: string
  clientName: string
  invoiceId: number | null
  project: string
  projectType: ProjectType | null
  amount: number | null
  status: InvoiceStatus | null
  contract: ContractStatus | null
  coc: COCStatus | null
  finalInvoice: FinalInvoiceStatus | null
  companyCam: string
  matterport: MatterportStatus | null
  rewriteStatus: RewriteStatus | null
  xactimateNumber: string
  dateAdded: string | null
  driveFolder: string
  notes: string
  done: boolean
}

export interface User {
  userId: string
  username: string
  displayName: string
  role: 'admin' | 'member'
  email: string | null
}

export interface UserRecord {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'member'
  email?: string
  createdAt: string
}

export interface DashboardStats {
  totalClaims: number
  totalRevenue: number
  overdueCount: number
  activeCount: number
  missingContracts: number
  missingCOCs: number
}

// Project is just an alias for Claim
export type Project = Claim

export interface InvoiceAgingBucket {
  label: string
  range: string
  count: number
  totalAmount: number
  color: string // tailwind color class
  projects: Claim[]
}

export interface ProjectActivity {
  id: string
  type: 'status_change' | 'file_upload' | 'email_sent' | 'email_received' | 'invoice_event' | 'note'
  description: string
  person?: string
  date: string
  metadata?: Record<string, unknown>
}
```

### Additional Types (from hooks)

```typescript
// src/hooks/useProject.ts

export interface ProjectFile {
  id: string
  name: string
  r2Key: string
  category: 'contracts' | 'cocs' | 'photos' | 'other'
  size: number
  mimeType: string
  uploadedAt: string
  uploadedBy: string
}

export interface ProjectEmail {
  id: string
  gmailMessageId: string
  threadId: string
  from: string
  to: string
  subject: string
  body: string
  date: string
  direction: 'inbound' | 'outbound'
}

export interface InvoiceEvent {
  id: string
  type: 'sent' | 'reminder' | 'paid' | 'disputed'
  date: string
  amount: number
  notes: string
  createdBy: string
}

// src/hooks/useInvoiceEvents.ts

export interface InvoiceEventWithProject {
  id: string
  projectId: string
  type: 'sent' | 'reminder' | 'paid' | 'disputed'
  date: string
  amount: number
  notes: string
  createdBy: string
}
```

---

# SECTION 8: ALL REACT HOOKS

## `useAuth()` — `src/hooks/useAuth.ts` (92 lines)

```typescript
// Returns:
{
  isAuthenticated: boolean     // true if token + user present
  token: string | null         // Session token (stored in localStorage)
  user: User | null            // Current user object
  login: (username, password) => Promise<boolean>     // POST /api/auth
  googleLogin: (credential) => Promise<boolean>       // POST /api/auth/google
  logout: () => void           // Clears localStorage
  loading: boolean             // True during login request
  error: string | null         // Last error message
}
```
**Behavior**: On mount, if token exists, validates it by calling `GET /api/claims`. If 401, auto-logs out.

## `useClaims(token)` — `src/hooks/useNotionData.ts` (31 lines)

```typescript
// Returns:
{
  claims: Claim[]              // All claims from Notion
  loading: boolean
  error: string | null
  refetch: () => Promise<void> // Manual refresh
}
```

## `computeStats(claims)` — `src/hooks/useNotionData.ts`

```typescript
// Returns DashboardStats computed from claims array
// Counts: total, revenue sum, overdue, active (not done & not paid), missing contracts, missing COCs
```

## `computeAging(claims)` — `src/hooks/useNotionData.ts`

```typescript
// Returns InvoiceAgingBucket[] — 4 buckets:
// Current (0-30 days), Warning (31-60), Late (61-90), Critical (90+)
// Only counts claims with status === 'Sent' and dateAdded set
```

## `useProjectData(projectId, token)` — `src/hooks/useProject.ts` (69 lines)

```typescript
// Returns:
{
  data: {
    files: ProjectFile[]
    emails: ProjectEmail[]
    invoiceEvents: InvoiceEvent[]
  }
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}
```

## `useInvoiceEvents(token)` — `src/hooks/useInvoiceEvents.ts` (66 lines)

```typescript
// Returns:
{
  events: InvoiceEventWithProject[]   // All events across all projects
  loading: boolean
  error: string | null
  addEvent: (params) => Promise<InvoiceEventWithProject>  // POST /api/invoice-events
  refetch: () => Promise<void>
}
```

---

# SECTION 9: KNOWN BUGS

| # | Bug | Severity | Root Cause | File(s) |
|---|-----|----------|------------|---------|
| 1 | **File upload completely broken** | CRITICAL | R2 bucket `fd-project-files` is commented out in `wrangler.toml`. The `FD_PROJECT_FILES` binding doesn't exist at runtime, so any R2 operation throws. | `wrangler.toml` lines 13-19, `functions/api/projects/[id]/files.ts` |
| 2 | **Share links broken** | HIGH | Depends on R2 to serve files. `GET /api/share/:token` calls `FD_PROJECT_FILES.get()` which fails. | `functions/api/share/[token].ts` |
| 3 | **Email tab is a stub** | MEDIUM | `EmailTab.tsx` is 18 lines — just renders "Coming soon". No Gmail integration exists. | `src/components/project/EmailTab.tsx` |
| 4 | **Invoice events incomplete** | MEDIUM | Events are stored in KV but there's no way to edit or delete them. The global event scan is O(n) over all KV keys. | `functions/api/invoice-events.ts` |
| 5 | **Settings page is placeholder** | LOW | Route exists (`/settings`) but renders `PlaceholderPage` with "Coming soon" text. | `src/App.tsx` line 42 |
| 6 | **Google OAuth incomplete** | MEDIUM | The verification endpoint (`/api/auth/google`) works but there's no Google Client ID configured in the frontend `LoginPage.tsx`. The Google button UI exists but won't function without proper OAuth setup. | `functions/api/auth/google.ts`, `src/components/LoginPage.tsx` |

---

# SECTION 10: DESIGN SYSTEM

## Theme Tokens (from `src/index.css`)

```css
@theme {
  /* Primary */
  --color-primary: #1a73e8;
  --color-primary-hover: #1557b0;
  --color-primary-light: #e8f0fe;

  /* Text */
  --color-foreground: #202124;
  --color-secondary: #5f6368;
  --color-muted: #9aa0a6;
  --color-faint: #dadce0;

  /* Surfaces */
  --color-surface: #ffffff;
  --color-surface-alt: #f8f9fa;

  /* Semantic */
  --color-emergency: #d93025;
  --color-success: #188038;
  --color-warning: #f9ab00;

  /* Invoice Aging */
  --color-aging-current: #188038;
  --color-aging-warning: #f9ab00;
  --color-aging-late: #e8710a;
  --color-aging-critical: #d93025;

  /* Sidebar (dark) */
  --color-sidebar: #1e1e2e;
  --color-sidebar-hover: #2a2a3e;
  --color-sidebar-active: #35355a;
  --color-sidebar-text: #a6adc8;
  --color-sidebar-text-active: #ffffff;

  /* Typography */
  --font-sans: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;

  /* Shadows (MD3-inspired) */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-lg: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-xl: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
}
```

## Design Principles
- **Aesthetic**: Google Clean + Material Design 3
- **Font**: Plus Jakarta Sans — 700/800 for display headings, 400/500/600 for body text
- **Spacing**: 8px base unit (use multiples: 4, 8, 12, 16, 24, 32, 48, 64)
- **Border radius**: 8px buttons, 12px cards, 16px modals, 28px pills
- **Shadows**: MD3-inspired elevation (no visible borders on cards — use shadow only)
- **Cards**: No border, shadow-md default, shadow-lg on hover
- **Colors**: Strictly use theme tokens. Primary blue `#1a73e8` for all interactive elements.

## Anti-Patterns (DO NOT USE)
- No purple anywhere
- No Inter as primary font (it's the fallback only)
- No border-heavy cards (use shadow instead)
- No `rounded-full` on buttons (use `rounded-lg`)
- No gradient backgrounds
- No colored section backgrounds (keep it clean white/gray)

---

# SECTION 11: TAILWIND PLUS COMPONENT LIBRARY

## Important: How to Access Components

You have the **complete Tailwind Plus library** (657 components, $299 licensed) uploaded as a JSON file in your project knowledge. The JSON file is named `tailwindplus-components` (336MB).

**To use a component:**
1. Find the component name in the catalog below
2. Search the uploaded `tailwindplus-components` JSON file for that exact component name
3. Extract the full HTML/JSX code
4. Adapt to React/TSX + TailwindCSS v4 syntax

## Full Component Catalog

### Application UI

#### Application Shells
- **Multi-Column Layouts** (6): Constrained three column, Constrained with sticky columns, Full-width secondary column on right, Full-width three-column, Full-width with narrow sidebar, Full-width with narrow sidebar and header
- **Sidebar Layouts** (8): Brand sidebar with header, **Dark sidebar with header** (USE THIS ONE), Sidebar with header, Simple brand sidebar, Simple dark sidebar, Simple sidebar, With constrained content area, With off-white background
- **Stacked Layouts** (9): Brand nav with overlap, Branded nav with compact lighter page header, Branded nav with lighter page header, On subtle background, Two-row navigation with overlap, With bottom border, With compact lighter page header, With lighter page header, With overlap

#### Data Display
- **Calendars** (8): Borderless side-by-side, Borderless stacked, Day view, Double, **Month view** (USE), Small with meetings, **Week view** (USE), Year view
- **Description Lists** (6): Left-aligned, Left-aligned in card, Left-aligned striped, Left-aligned with inline actions, Narrow with hidden labels, **Two-column** (USE)
- **Stats** (5): Simple, **Simple in cards** (USE), **With brand icon** (USE), With shared borders, **With trending** (USE)

#### Elements
- **Avatars** (11): Full set of circular/rounded avatars with various states
- **Badges** (16): Flat, Flat pill, with dots, with remove buttons, various sizes
- **Button Groups** (5): Basic, Icon only, With checkbox and dropdown, With dropdown, With stat
- **Buttons** (8): Primary, Secondary, Soft, Circular, with leading/trailing icons, rounded variants
- **Dropdowns** (5): Simple, With dividers, With icons, With minimal menu icon, With simple header

#### Feedback
- **Alerts** (6): With accent border, With actions, With description, With dismiss button, With link on right, With list
- **Empty States** (6): Simple, With dashed border, With recommendations, With recommendations grid, With starting points, With templates

#### Forms
- **Action Panels** (8): Various layouts with buttons, inputs, toggles
- **Checkboxes** (4): List variants with descriptions
- **Comboboxes** (4): Simple, With image, With secondary text, With status indicator
- **Form Layouts** (4): Labels on left, Stacked, Two-column, Two-column with cards
- **Input Groups** (21): Every input variant (add-ons, icons, labels, validation, keyboard shortcuts, etc.)
- **Radio Groups** (12): Cards, Color picker, various list layouts
- **Select Menus** (7): Branded, custom with avatars/status, native
- **Sign-in and Registration** (4): Simple, Simple card, Simple no labels, Split screen
- **Textareas** (5): Simple, With avatar, preview button, title + pills, underline
- **Toggles** (5): Short, Simple, With icon, With left/right labels

#### Headings
- **Card Headings** (6): Simple, With action, With avatar and actions, With avatar/meta/dropdown, With description, With description and action
- **Page Headings** (9): Card with avatar and stats, With actions, With breadcrumbs, With avatar, With banner, With filters, With logo/meta/actions, With meta/actions, With meta/actions/breadcrumbs
- **Section Headings** (10): Simple, With action, With actions, With tabs, With badge/dropdown, With description, With inline tabs, With input group, With label, With tabs

#### Layout
- **Cards** (10): Basic, with footer, gray body/footer, header, edge-to-edge on mobile, wells
- **Containers** (5): Constrained/padded variants
- **Dividers** (8): With button, icon, label, title, toolbar
- **List containers** (7): Card/flat/simple with dividers
- **Media Objects** (8): Aligned variants, responsive, nested

#### Lists
- **Feeds** (3): Simple with icons, **With comments** (USE), **With multiple item types** (USE)
- **Grid Lists** (7): Actions, Contact cards, Horizontal links, Images, Logos, Simple
- **Stacked Lists** (15): Full width, constrained, with links/badges/avatars/actions
- **Tables** (19): Full width, with avatars, border, checkboxes, condensed, grouped, hidden columns, **sortable headings** (USE), **stacked on mobile** (USE), sticky header, striped, summary rows, vertical lines

#### Navigation
- **Breadcrumbs** (4): Contained, Full-width bar, Simple with chevrons, Simple with slashes
- **Command Palettes** (8): Semi-transparent, Simple, With footer, **With groups** (USE), **With icons** (USE), With images and descriptions, With preview
- **Navbars** (11): Dark variants, Simple, with search, quick action, centered search
- **Pagination** (3): Card footer with page buttons, Centered page numbers, Simple card footer
- **Progress Bars** (8): Bullets, Circles, Panels, Progress bar, Simple
- **Sidebar Navigation** (5): Brand, **Dark** (USE), Light, With expandable sections, With secondary navigation
- **Tabs** (9): Bar with underline, Full-width, Simple, Pills, **with underline and badges** (USE), **with underline and icons** (USE)
- **Vertical Navigation** (6): On gray, Simple, **With badges** (USE), **With icons** (USE), With icons and badges, With secondary navigation

#### Overlays
- **Drawers** (12): Contact list, Create project form, Empty, File details, User profile, Wide variants, With overlay/branded header/close button/sticky footer
- **Modal Dialogs** (6): Centered single/wide action, Simple alert, with dismiss, with gray footer
- **Notifications** (6): Condensed, Simple, With actions/avatar/buttons/split buttons

#### Page Examples
- **Detail Screens** (2): **Sidebar** (USE AS REFERENCE), Stacked
- **Home Screens** (2): **Sidebar** (USE AS REFERENCE), Stacked
- **Settings Screens** (2): **Sidebar** (USE AS REFERENCE), Stacked

---

# SECTION 12: INDUSTRY BENCHMARK

## What Professional Service Management Dashboards Have

### HousecallPro Navigation (8 main tabs)

| Tab | Sub-sections |
|-----|-------------|
| **Home** | Open Items (estimates, invoices, unscheduled jobs, service visits with $ amounts), Reporting Stats (revenue, jobs completed, avg job size, new bookings — customizable, with YoY comparison), Employee Status map (GPS + schedules), Recent Activity feed, Schedule preview |
| **Inbox** | Employee messages, Customer messages, Job inbox |
| **Schedule** | Calendar (Estimates, Events, Jobs — scheduled + unscheduled) |
| **Customers** | Left rail: Jobs list, Estimates list, Leads, Invoices, Customer profiles — all with search, filters, editable columns, bulk actions |
| **My Money** | Financing, Payment processing |
| **Reporting** | Customizable insights dashboard, Invoice tab (cash flow, overdue, receivables) |
| **Marketing** | Email/Text/Postcard campaigns, Reviews, Online booking |
| **Price Book** | Services, Materials, Pricing forms, Estimate templates |

### HousecallPro Job Detail (15+ sections)
- Customer info
- Service line items (from Price Book)
- Material line items
- Team assignment & dispatch
- Scheduling (segments)
- Private notes
- File attachments
- Checklists
- Tags
- Lead source
- Custom job fields
- Deposits
- Payments
- Linked invoice
- Activity feed

### HousecallPro Top-Right Icons
| Icon | Contents |
|------|----------|
| Bell | Notifications for estimates/jobs/tasks/invoices/payments |
| Map | Live GPS tracking |
| Grid | My Apps: Service Plans, Timesheets, Property Profiles |
| Gear | 30+ settings categories |
| Profile | Activity Feed, Account, Tasks |

### HousecallPro Settings (30+ categories)

**Company**: Profile, Business Hours, Service Area, Employees & Permissions, AI Team, Billing, 2FA
**Communication**: Text, Voice, Marketing Center, Customer Portal
**Booking**: Customer Intake, Online Booking
**Jobs & Estimates**: Price Book, Job Fields, Job Costing, Commissions, Material Tracking, Signatures, Appointments, Reminders, Templates, Estimates on Jobs, Estimate Defaults, Estimate Email/SMS, Invoices, Automations, Progress Invoicing, Service Plans, Pipeline, Time Tracking, Lead Sources, Tags, Referrals

### ServiceTitan Project Page (8 tabs)

| Tab | Contents |
|-----|----------|
| **Dashboard** | Customer info, Project info, Contract info |
| **Financials** | Project Summary, Budget vs Actual, Payments, Applications for Payment |
| **Jobs & Appointments** | All jobs, All appointments |
| **Task Management** | All project tasks |
| **Estimates** | Sold + unsold estimates |
| **Purchasing** | Requisitions, Purchase order bills |
| **Documents** | Forms, Photos, Attachments |
| **History** | All events, calls, notes, files, emails |

### Jobber Dashboard Sections
- **Workflow Status**: Jobs + revenue by stage
- **Team Progress**: Daily tracking
- **Financial Overview**: Incoming funds
- **Insights**: Overdue items, projected revenue
- **Reports**: Sales by service/technician, tax, profit margins, expenses, job progress, completion times, productivity, client history

---

# PROMPT 1: CODEBASE AUDIT

> **Copy everything from here to the end of PROMPT 1 into GPT-5.4.**
> Make sure the repository is connected as project knowledge first.

---

## System Instructions

You are a senior full-stack engineer performing a comprehensive audit of the **Flood Doctor Claims Dashboard** (`fd-claims-dashboard`). This is an internal project management tool for a water damage restoration company, deployed on Cloudflare Pages.

## Your Task

Read EVERY file in this repository. Do not skim — read every line. Then produce a structured audit report covering all areas below.

## Context

Refer to the project documentation at the top of this file for:
- Complete tech stack (Section 2)
- File tree with line counts (Section 3)
- Architecture diagram (Section 4)
- All API endpoints with request/response shapes (Section 5)
- Notion database schema (Section 6)
- TypeScript types (Section 7)
- React hooks (Section 8)
- Known bugs (Section 9)
- Design system (Section 10)

## Audit Areas

### 1. Bug Inventory
For each bug found:
- **File**: exact path
- **Line(s)**: line numbers
- **Severity**: Critical / High / Medium / Low
- **Description**: What's broken
- **Root cause**: Why it's broken
- **Fix**: Specific code change needed

Include the 6 known bugs from Section 9 plus any NEW bugs you discover.

### 2. Data Flow Analysis
Map every data flow from source to UI:
- Notion DB → `/api/claims` → `useClaims()` → which components?
- KV → `/api/projects/:id/data` → `useProjectData()` → which components?
- KV → `/api/invoice-events` → `useInvoiceEvents()` → which components?
- Auth flow: Login form → `/api/auth` → KV session → middleware → protected routes

Identify any data flow gaps, race conditions, or inconsistencies.

### 3. Dead Code & Unused Dependencies
- Components imported but never rendered
- Types defined but never used
- API endpoints that no frontend code calls
- npm packages installed but never imported

### 4. UI/UX Gap Analysis
Compare current dashboard against HousecallPro, ServiceTitan, and Jobber (Section 12). For each gap:
- **Feature**: What's missing
- **Priority**: Must-have / Nice-to-have
- **Effort**: Small (1-2 files) / Medium (3-5 files) / Large (6+ files)

### 5. Code Quality Assessment
- **Type safety**: Any `any` types? Untyped function parameters?
- **Error handling**: Which endpoints lack proper error responses? Which UI components don't handle error/loading states?
- **Performance**: Any unnecessary re-renders? Missing memoization? N+1 query patterns?
- **Security**: Auth bypass risks? Input validation gaps? XSS vectors? CORS misconfiguration?

### 6. Architecture Assessment
- Is the Notion-as-database approach sustainable? What are the limits?
- Is the KV data model appropriate for project data?
- Are there any Cloudflare Pages Functions limitations being hit?
- Dev server vs production parity — are there behavior differences?

## Output Format

Produce a report with these exact sections:

```
# AUDIT REPORT: Flood Doctor Claims Dashboard

## Executive Summary
[3-5 sentences]

## Critical Issues (Must Fix Before Enhancement)
[Numbered list]

## Bug Inventory
[Table: #, File, Lines, Severity, Description, Fix]

## Data Flow Map
[Diagram or structured list]

## Dead Code
[List with file paths]

## UI/UX Gap Analysis
[Table: Feature, Current State, Target (HousecallPro/ServiceTitan), Priority, Effort]

## Code Quality
[Subsections for type safety, error handling, performance, security]

## Architecture Assessment
[Subsections for data layer, auth, file storage, dev/prod parity]

## Prioritized Fix List
[Ordered by: Critical bugs → High bugs → Architecture issues → UI gaps]
```

---

**END OF PROMPT 1**

---

# PROMPT 2: ENHANCEMENT EXECUTION

> **Copy everything from here to the end of PROMPT 2 into GPT-5.4.**
> Run this AFTER reviewing the audit findings from Prompt 1.
> Make sure the repository AND the `tailwindplus-components` JSON are both in project knowledge.

---

## System Instructions

You are a senior full-stack React engineer. You are enhancing the **Flood Doctor Claims Dashboard** from a basic CRUD app into a professional-grade project management dashboard comparable to HousecallPro, ServiceTitan, and Jobber.

You have access to:
1. **The full repository** in project knowledge
2. **The Tailwind Plus component library** (657 components) as an uploaded JSON file named `tailwindplus-components`
3. **The audit findings** from your previous analysis

## Critical Rules

1. **Use Tailwind Plus components**: For EVERY UI element, search the uploaded `tailwindplus-components` JSON for the matching component. Extract the full code. Adapt to React/TSX. Do NOT write UI from scratch when a Tailwind Plus component exists.
2. **Follow the design system exactly** (Section 10): Colors, fonts, spacing, shadows, border-radius — all must match the theme tokens.
3. **Maintain existing auth system**: Keep the KV session + middleware pattern. Don't switch to a different auth library.
4. **Keep Notion as primary data source**: Don't migrate to a different database.
5. **TypeScript strict**: No `any` types in new code. Properly type all function parameters and return types.
6. **One dependency addition**: Add `recharts` for charts. No other new major dependencies.
7. **Cloudflare Pages compatible**: All backend code must work as Cloudflare Pages Functions.
8. **Mobile responsive**: All new UI must work down to 375px width.

## Enhancement Phases

Execute ALL phases in order. For each phase, provide the COMPLETE file contents (not diffs, not snippets — full files).

---

### Phase 1: Fix All Broken Features

#### 1.1 Enable R2 Bucket
Update `wrangler.toml` — uncomment the R2 binding:
```toml
[[r2_buckets]]
binding = "FD_PROJECT_FILES"
bucket_name = "fd-project-files"
```

**Note**: The user must also run `npx wrangler r2 bucket create fd-project-files` to create the bucket. Add a comment in the file noting this prerequisite.

#### 1.2 Fix File Upload End-to-End
- Verify `functions/api/projects/[id]/files.ts` works with the R2 binding active
- Add upload progress tracking to `FileUploader.tsx` using XHR instead of fetch (fetch doesn't support upload progress)
- Add proper error messages when upload fails
- Add file size display (human-readable: KB, MB)
- Add upload success toast notification

#### 1.3 Wire Share Links
- Connect `ShareLinkModal.tsx` to the `POST /api/projects/:id/share` endpoint
- Add copy-to-clipboard functionality
- Show expiration countdown
- Add success/error feedback

#### 1.4 Complete Google OAuth
- Add Google Client ID configuration (environment variable `GOOGLE_CLIENT_ID`)
- Load Google Sign-In SDK in `index.html`
- Wire the credential callback in `LoginPage.tsx`
- Add to `wrangler.toml` vars

#### 1.5 Add Error Boundaries
- Create `ErrorBoundary.tsx` component that catches React errors
- Wrap each route in an error boundary
- Show a friendly "Something went wrong" UI with retry button
- Add `ErrorFallback` component using Tailwind Plus Alert ("With actions" variant)

---

### Phase 2: Application Shell Redesign

Replace the current `AppShell.tsx` with a professional layout.

#### Layout
- Use Tailwind Plus **"Dark sidebar with header"** application shell
- Search the `tailwindplus-components` JSON for `"Dark sidebar with header"` and use that as the base

#### Sidebar Navigation
Map to this structure (inspired by HousecallPro, adapted for Flood Doctor):

| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| HomeIcon | Dashboard | `/` | — |
| FolderIcon | Projects | `/projects` | Active count |
| CalendarIcon | Calendar | `/calendar` | — |
| ChartBarIcon | Reports | `/reports` | NEW |
| Cog6ToothIcon | Settings | `/settings` | — |
| UsersIcon | Team | `/users` | Admin only |

#### Top Bar
- **Left**: Breadcrumb navigation (use Tailwind Plus "Simple with chevrons" breadcrumb)
- **Center**: Search input (use Tailwind Plus "Input with keyboard shortcut" — show Cmd+K)
- **Right**: Notification bell icon (with unread count badge), User avatar dropdown

#### Command Palette
- Triggered by `Cmd+K` (Mac) or `Ctrl+K` (Windows)
- Use Tailwind Plus **"With groups"** command palette
- Groups: "Projects" (search by client name), "Actions" (New Project, Upload File), "Navigation" (Dashboard, Calendar, etc.)
- Search across all projects by client name, project name, Xactimate #

#### Mobile
- Sidebar collapses to hamburger menu
- Top bar remains with search + notifications
- Responsive breakpoints: `sm:640px`, `md:768px`, `lg:1024px`

---

### Phase 3: Dashboard Page (Home)

Rebuild `DashboardPage.tsx` to match HousecallPro's home screen.

#### Row 1: Open Items
Use Tailwind Plus **"Stats — With brand icon"** component.
4 cards in a row:
| Stat | Value Source | Icon | Color |
|------|-------------|------|-------|
| Active Projects | `claims.filter(c => !c.done && c.status !== 'Paid').length` | FolderOpenIcon | primary |
| Open Invoices | `claims.filter(c => c.status === 'Sent').reduce(sum, amount)` — show as `$XX,XXX` | CurrencyDollarIcon | warning |
| Missing Documents | `claims.filter(c => c.contract === 'Missing' || c.coc === 'Missing').length` | ExclamationTriangleIcon | emergency |
| Overdue | `claims.filter(c => c.status === 'Overdue').length` | ClockIcon | emergency |

#### Row 2: KPI Stats
Use Tailwind Plus **"Stats — With trending"** component.
4 stats with period selector (Today / This Week / This Month / This Quarter):
| Stat | Calculation |
|------|-------------|
| Revenue Earned | Sum of `amount` where `status === 'Paid'` in selected period |
| Projects Completed | Count where `done === true` in selected period |
| Avg Project Value | Revenue / Completed count |
| Days to Payment | Average of (payment date - date added) for paid projects |

Each stat should show a trend indicator (up/down arrow with percentage) comparing to the previous period.

#### Row 3: Charts (2-column grid)
**Left — Revenue Chart (Recharts BarChart)**:
- Monthly revenue bars, last 6 months
- Bar color: `#1a73e8`
- X-axis: Month names
- Y-axis: Dollar amounts
- Tooltip on hover showing exact amount

**Right — Project Status Donut (Recharts PieChart)**:
- Segments: Draft (gray), Sent (warning yellow), Paid (success green), Overdue (emergency red)
- Center label showing total count
- Legend below

#### Row 4: Two-column layout
**Left — Invoice Aging Bars**:
- Horizontal stacked bars for each aging bucket
- Colors: `--color-aging-current`, `--color-aging-warning`, `--color-aging-late`, `--color-aging-critical`
- Show count and total dollar amount per bucket
- Clickable — navigates to Projects page with that aging filter applied

**Right — Recent Activity Feed**:
Use Tailwind Plus **"Feeds — With multiple item types"** component.
- Show last 10 activities across all projects
- Types: status changes, file uploads, invoice events
- Each item: icon, description, timestamp, link to project
- "View all" link at bottom

#### Row 5: Full-width
**Upcoming Deadlines Widget**:
- Table showing next 7 days of due dates
- Columns: Date, Project, Client, Type (Invoice Due, Contract Due, Follow-up), Amount
- Sort by date ascending
- Use Tailwind Plus **"Tables — Simple in card"**

#### Quick Actions Bar (floating bottom or top of page)
- "New Project" button (opens CreateProjectModal)
- "Upload File" button (navigates to first project's files tab or shows project picker)
- "Send Invoice" button (future — disabled with tooltip "Coming soon")

---

### Phase 4: Projects List Page

Rebuild `ProjectsPage.tsx` to match HousecallPro's Customers tab.

#### Data Table
Use Tailwind Plus **"Tables — With sortable headings"** as base.

**Columns** (all sortable):
| Column | Source | Width |
|--------|--------|-------|
| Invoice # | `invoiceId` | 80px |
| Client | `clientName` | 200px |
| Project | `project` | 200px |
| Type | `projectType` | 120px |
| Amount | `amount` (formatted as `$X,XXX.XX`) | 120px |
| Status | `status` (rendered as `StatusPill`) | 100px |
| Contract | `contract` (color-coded) | 100px |
| COC | `coc` (color-coded) | 80px |
| Date Added | `dateAdded` (relative: "3 days ago") | 120px |
| Actions | Dropdown menu | 60px |

#### Search
- Full-text search across: clientName, project, xactimateNumber, notes
- Debounced (300ms)
- Use Tailwind Plus **"Input with leading icon"** (MagnifyingGlassIcon)

#### Filters
- **Status**: Multi-select dropdown (Draft, Sent, Paid, Overdue)
- **Project Type**: Multi-select dropdown (Water Mitigation, Pack-out, Mold Remediation)
- **Contract**: Multi-select (Missing, Requested, Signed)
- **COC**: Multi-select (Missing, Requested, Signed)
- **Date Range**: Start date + End date pickers
- **Active Filters**: Show as removable pills below the filter bar

#### Saved Filter Views
Dropdown with preset filters stored in localStorage:
- "All Active" (not done, not paid)
- "Overdue Only" (status === Overdue)
- "Missing Contracts" (contract === Missing)
- "Missing COCs" (coc === Missing)
- "Paid This Month" (status === Paid, dateAdded in current month)

Users can save custom filter combinations.

#### Bulk Actions
- Checkbox on each row + "Select All" header checkbox
- When selected, show action bar: "Mark Paid", "Export CSV", "Archive" (mark done)
- CSV export: download all visible (filtered) rows as CSV

#### Inline Status Editing
- Click on Status/Contract/COC cells to toggle via dropdown
- Calls `PATCH /api/claims` endpoint
- Optimistic update + rollback on error

#### Row Actions Dropdown
- "View Details" — navigate to `/projects/:id`
- "Open in Notion" — new tab to `notionUrl`
- "Open CompanyCam" — new tab to `companyCam` (if set)
- "Open Drive" — new tab to `driveFolder` (if set)

#### Kanban Toggle
- Button to switch between Table view and Kanban view
- Kanban columns = InvoiceStatus values (Draft, Sent, Paid, Overdue)
- Cards show: client name, project, amount, date
- Drag-and-drop between columns updates status via API

#### Pagination
- Use Tailwind Plus **"Pagination — Card footer with page buttons"**
- Configurable page size: 10, 25, 50, 100
- Show "Showing X-Y of Z results"

---

### Phase 5: Project Detail Page

Replace current 4-tab layout in `ProjectDetailPage.tsx` with a 7-tab professional layout.

#### Page Header
Use Tailwind Plus **"Page Headings — With meta and actions"**.
- Title: Client name
- Meta: Invoice #{invoiceId} | {projectType} | Added {dateAdded}
- Actions: "Edit in Notion" button, "CompanyCam" button, "Drive Folder" button
- Health score indicator: computed from (contract + COC + invoice status + files uploaded)

#### Tab Navigation
Use Tailwind Plus **"Tabs — With underline and icons"**.

#### Tab 1: Overview
**Left column (2/3 width)**:
- **Customer Info Card** (use Tailwind Plus "Description Lists — Two-column"):
  - Client Name, Project, Project Type, Xactimate #, Amount, Date Added
  - All fields editable inline (click to edit, Enter to save via PATCH)
- **Progress Stepper** (use Tailwind Plus "Progress Bars — Circles with text"):
  - Steps: Contract → COC → Invoice → Payment
  - Each step shows status and date completed
  - Visual indicators: checkmark (done), current (blue circle), pending (gray circle)
- **Notes Section**:
  - Rich text display of `notes` field
  - Edit button opens textarea
  - Save calls PATCH endpoint

**Right column (1/3 width)**:
- **Quick Actions Card**:
  - "Open in Notion" link
  - "CompanyCam" link
  - "Drive Folder" link
  - "Matterport" link (if Has Scan)
- **Project Health Score**:
  - Circular progress indicator
  - Scoring: Contract signed (+25), COC signed (+25), Invoice sent (+25), Files uploaded (+25)
  - Color: green (75-100%), yellow (50-74%), red (0-49%)

#### Tab 2: Financials
- **Invoice Summary Card**:
  - Amount: `$XX,XXX.XX`
  - Status: StatusPill
  - Date Sent (from invoice events)
  - Date Paid (from invoice events)
  - Days Outstanding
- **Invoice Aging**: Show which aging bucket this project falls into
- **Invoice Events Timeline** (use Tailwind Plus "Feeds — With comments"):
  - All invoice events for this project
  - Each event: type icon, date, amount, notes, created by
  - "Add Event" button opens modal
- **Payment History Table** (if multiple payment events exist)

#### Tab 3: Files
Fix and enhance the existing file upload system:
- **Upload Area**: Drag-and-drop zone with progress bars per file
  - Category selector (contracts, cocs, photos, other)
  - Bulk upload support (multiple files at once)
  - Progress bars using XHR upload progress events
  - Success/error state per file
- **File Grid** (use Tailwind Plus "Grid Lists — Images with details"):
  - Thumbnail previews for images
  - File icon for non-images
  - Category filter tabs (All, Contracts, COCs, Photos, Other)
  - File info: name, size, uploaded by, date
  - Actions per file: Download, Share, Delete
- **Share Link**: Click share on a file to generate a share link via API

#### Tab 4: Timeline
Activity/audit log for this project:
- Use Tailwind Plus **"Feeds — With multiple item types"**
- Show all activities: status changes, file uploads, invoice events, notes
- Each entry: icon by type, description, person, timestamp
- **Add Note** button at top — opens inline textarea
- Notes saved to KV as part of project data

#### Tab 5: Documents
Document compliance tracking:
- **Contract Section**:
  - Status indicator (Missing → Requested → Signed)
  - Change status buttons
  - File link (if uploaded in Files tab with category "contracts")
  - Date signed (manual input)
- **Certificate of Completion (COC) Section**:
  - Same structure as Contract
  - Links to files with category "cocs"
- **Final Invoice Section**:
  - Status: Not Started → Drafting → Review → Complete
  - Change status buttons
  - Invoice amount display
- **Matterport Scan**:
  - Status: N/A / Missing / Has Scan
  - Link to scan URL if available

#### Tab 6: Tasks
Project task/checklist management:
- Extends current `ProgressTracker.tsx` concept
- **Task List** (use Tailwind Plus "Stacked Lists — With inline links and actions menu"):
  - Each task: checkbox, title, assignee, due date, status
  - Pre-populated tasks based on project type:
    - Water Mitigation: Site inspection, Moisture mapping, Equipment placement, Drying verification, Final walkthrough
    - Pack-out: Inventory creation, Pack-out execution, Storage confirmation, Delivery scheduling, Client sign-off
    - Mold Remediation: Testing, Containment setup, Remediation, Clearance testing, Documentation
  - Add custom tasks
  - Completion percentage bar at top
- Tasks stored in KV: `project:{id}:tasks`

#### Tab 7: Communication
Future integration placeholder (but well-designed):
- **Email Section** (placeholder):
  - "Connect Gmail" button (disabled, with "Coming soon" badge)
  - Mock UI showing what it will look like using Tailwind Plus "Stacked Lists"
- **Share Links**:
  - List of all active share links for this project's files
  - Show: file name, share URL, expires at, created by
  - Actions: Copy link, Revoke
- **Client Portal Preview** (placeholder):
  - "Enable Client Portal" toggle (disabled)
  - Description of what clients would see

---

### Phase 6: Calendar Page Rebuild

Rebuild `CalendarPage.tsx` with a professional calendar.

#### Calendar Component
Use Tailwind Plus **"Calendars — Month view"** as base.

#### Views
- **Month view** (default): Grid with event dots
- **Week view**: Hourly grid with event blocks
- Toggle between views with segmented control

#### Events
Color-coded by type:
| Type | Color | Source |
|------|-------|--------|
| Invoice Due | `--color-warning` | Claims with status "Sent" — dateAdded + 30 days |
| Overdue | `--color-emergency` | Claims with status "Overdue" |
| Follow-up | `--color-primary` | Manual events from invoice events |
| Paid | `--color-success` | Invoice events with type "paid" |

#### Interactions
- Click on a day → show events in a slide-over panel (use Tailwind Plus "Drawers — Empty")
- Click on an event → navigate to project detail page
- "Add Event" button → opens `AddInvoiceEventModal`
- Auto-populate: compute invoice due dates from Notion data (dateAdded + 30 days for "Sent" invoices)

---

### Phase 7: New Pages

#### Reports Page (`/reports`)

Create `src/pages/ReportsPage.tsx`.

**Section 1: Revenue Report**
- Recharts `BarChart`: Monthly revenue (last 12 months)
- Recharts `LineChart`: Cumulative revenue over time
- Period selector: This Month, This Quarter, This Year, All Time
- Breakdown by project type (stacked bars)

**Section 2: Project Metrics**
- Total projects by status (bar chart)
- Average time to payment (line chart over months)
- Project completion rate (% done per month)
- Document compliance rate: % of projects with signed contracts AND signed COCs

**Section 3: Aging Report**
- Detailed aging breakdown with dollar amounts
- Trend over time (are we getting better or worse at collections?)

**Section 4: Export**
- "Export to CSV" button for each report section
- Download includes: date range, all data points, generated timestamp

Use Recharts for all charts. Chart colors must use theme tokens.

#### Settings Page (`/settings`)

Create `src/pages/SettingsPage.tsx`.
Use Tailwind Plus **"Settings Screens — Sidebar"** page example as the layout.

**Sections**:

1. **Profile**
   - Display name (editable)
   - Email (editable)
   - Password change (current + new + confirm)
   - Uses `PATCH /api/users` endpoint (need to add this)

2. **Company**
   - Business name: "Flood Doctor"
   - Phone, Address (stored in KV as `settings:company`)
   - Logo upload (to R2)

3. **Integrations**
   - Notion: Database ID display, connection status indicator
   - Google: OAuth connection status, "Connect Google" button
   - CompanyCam: API key input (stored in KV)

4. **Notifications** (placeholder for now)
   - Toggle: Email alerts for overdue invoices
   - Toggle: Upload completion notifications
   - Toggle: Daily digest email

5. **Team** (admin only)
   - Move current UsersPage functionality here
   - User list with roles
   - "Invite Member" button
   - Role management (admin/member toggle)

---

### Phase 8: Backend Hardening

#### 8.1 Consistent Error Response Format
All endpoints should return errors in this format:
```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details?": {}
}
```

Error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`, `R2_ERROR`, `NOTION_ERROR`

#### 8.2 Input Validation
Add validation to all POST/PATCH/PUT endpoints:
- String fields: trim whitespace, check max length
- Number fields: check for NaN, negative values
- Enum fields: validate against allowed values
- File uploads: validate MIME type (allow: image/*, application/pdf, application/msword, application/vnd.openxmlformats-*)

#### 8.3 File Upload Enhancement
- Switch to chunked upload for files > 5MB
- Add upload progress events via Server-Sent Events or return progress via polling endpoint
- Add virus scan placeholder (log file hash, flag for review if > certain size)

#### 8.4 Notion Webhook Handler
Enhance `functions/api/webhook.ts`:
- Parse Notion webhook payload
- On page update: invalidate relevant KV cache
- On page create: add to local KV index
- Log all webhook events to KV for debugging

#### 8.5 Request Logging
- Log all API requests to KV with: timestamp, method, path, userId, responseStatus, duration
- Store under `log:{date}:{uuid}` with 7-day TTL
- Add `/api/admin/logs` endpoint (admin only) to retrieve logs

#### 8.6 Add Missing Endpoints
- `PATCH /api/users/:username` — update user profile (display name, email, password)
- `GET /api/projects/:id/tasks` — get project tasks
- `PUT /api/projects/:id/tasks` — update project tasks
- `DELETE /api/invoice-events/:projectId/:eventId` — delete specific invoice event
- `PUT /api/settings/company` — update company settings

---

# SECTION 15: ADDITIONAL SUGGESTIONS

Include these as "Phase 9: Nice-to-Haves" — implement if time allows, in this priority order:

1. **Dark mode toggle**: Sidebar is already dark. Extend to full app with a toggle in the top bar. Store preference in localStorage. Use CSS variables for all colors (already set up in `index.css`). Add `dark:` variants.

2. **Notification center**: Bell icon in top bar opens a dropdown panel (use Tailwind Plus "Notifications — With actions below"). Show recent events: overdue invoices, file uploads, status changes. Mark as read. Store notification state in KV.

3. **Favorites/pinned projects**: Star icon on project rows. Pinned projects appear in sidebar under navigation. Store in localStorage per user.

4. **Batch operations**: Multi-select projects in list view. Bulk status update, bulk mark paid, bulk archive. Confirmation modal before executing.

5. **PDF generation**: Generate invoice PDFs from project data. Use browser's `window.print()` with a print-optimized CSS stylesheet. Or integrate with a PDF library like `jspdf`.

6. **Keyboard shortcuts**: `J/K` to navigate project list, `Enter` to open project, `Esc` to close modals/drawers, `N` for new project, `/` to focus search. Show shortcut hints in tooltips.

7. **Client portal**: Extend share links to full read-only client views. Client enters their email to see project status, uploaded documents, invoice status. No login required — token-based access with 30-day expiry.

8. **Offline support**: Service worker for basic viewing when offline. Cache claims data in IndexedDB. Show "Offline" badge. Queue changes for sync when back online.

9. **Automated reminders**: Cloudflare Workers Cron Trigger to check for overdue invoices daily. Send email notifications via Cloudflare Email Workers or external service. Configurable reminder intervals (7, 14, 30 days overdue).

10. **Dashboard widget customization**: Allow users to rearrange dashboard widgets via drag-and-drop. Save layout to localStorage. Toggle widgets on/off. Use a simple grid system.

---

# SECTION 16: CONSTRAINTS

## Must Follow
- **React 19** + **TypeScript 5.9** + **Vite 7.3** + **TailwindCSS 4.2** — do not downgrade
- **Cloudflare Pages** deployment — all functions must be Pages Functions (file-based routing in `functions/api/`)
- **Notion as primary data source** — do not migrate to Postgres/Supabase/etc.
- **Existing auth system** — keep KV session tokens + PBKDF2 password hashing + middleware pattern
- **Headless UI** (`@headlessui/react` 2.2.9) + **Heroicons** (`@heroicons/react` 2.2.0) — already installed, use them
- **No new CSS frameworks** — no Bootstrap, no Chakra, no shadcn/ui. TailwindCSS only.
- **Mobile responsive** — 375px minimum width, test all pages
- **Design system** (Section 10) — follow exactly. All colors from theme tokens. Plus Jakarta Sans font.
- **Add Recharts** as the only new major dependency. Pin to latest stable version.

## Must NOT Do
- Don't add Redux, Zustand, Jotai, or any state management library — keep React hooks + localStorage
- Don't add Prisma, Drizzle, or any ORM — Notion API is the data layer
- Don't create a separate backend server — everything runs on Cloudflare Pages Functions
- Don't use `any` type in new code — properly type everything
- Don't use inline styles — use Tailwind classes
- Don't add new fonts — use Plus Jakarta Sans + Inter fallback
- Don't change the KV namespace IDs or bindings names
- Don't remove existing functionality — only enhance

## File Organization
- New pages go in `src/pages/`
- New components go in `src/components/` (grouped by feature in subdirectories)
- New hooks go in `src/hooks/`
- New API endpoints go in `functions/api/`
- New types go in `src/types/`
- Keep existing file names unless the audit recommends renaming

---

**END OF PROMPT 2**

---

## Usage Instructions

### Step 1: Prepare GPT-5.4 Project
1. Create a new GPT-5.4 project
2. Connect the GitHub repo: `https://github.com/FrankDark007/fd-claims-dashboard.git`
3. Upload the `tailwindplus-components` JSON file (336MB) to project knowledge
4. Upload this file (`GPT-5.4-ENHANCEMENT-PROMPT.md`) to project knowledge

### Step 2: Run Audit (Prompt 1)
1. Copy everything from `# PROMPT 1: CODEBASE AUDIT` to `**END OF PROMPT 1**`
2. Paste into GPT-5.4 chat
3. Say: "Read the GPT-5.4-ENHANCEMENT-PROMPT.md file in project knowledge for full context (Sections 1-12), then execute this audit."
4. Review the audit findings

### Step 3: Run Enhancement (Prompt 2)
1. Copy everything from `# PROMPT 2: ENHANCEMENT EXECUTION` to `**END OF PROMPT 2**`
2. Paste into GPT-5.4 chat
3. Say: "Read the GPT-5.4-ENHANCEMENT-PROMPT.md file for full context. Use the tailwindplus-components JSON for all UI components. Execute all 8 phases. Output complete files."
4. Apply generated code to your repo

### Step 4: Verify
```bash
cd ~/flood-doctor/fd-claims-dashboard
npm install recharts
npm run build
npx wrangler r2 bucket create fd-project-files
npx wrangler pages deploy dist
```
