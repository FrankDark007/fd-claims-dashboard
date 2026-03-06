# Decisions

- 2026-03-06: `FD_LIGHT_STATE` reuses the former project-data KV namespace so deploy wiring can change without blocking the D1 migration; KV is now reserved for share tokens and other light state.
- 2026-03-06: `wrangler.toml` uses placeholder D1 IDs that must be replaced with real Cloudflare database IDs before remote deploys.
- 2026-03-06: Local dev parity will run through `wrangler pages dev` with local D1/KV/R2 persistence instead of the old `server/api.ts` Notion proxy.
- 2026-03-06: Milestone 2 adds `projects.next_follow_up_date` as the persisted collections workflow anchor; when an invoice sent date first creates a due date, the next follow-up defaults to that same date and clears automatically when payment is recorded.
- 2026-03-06: Logging a reminder event automatically pushes the next follow-up out 7 days unless a later manual edit changes it, so the collections workflow moves forward without needing a separate task system.
- 2026-03-06: Invoice-event edits and deletes now reconcile the project’s invoice/follow-up fields against the remaining timeline so removing a paid or reminder event does not leave stale billing state behind in D1.
- 2026-03-06: Calendar and queue views treat `next_follow_up_date` as the primary collections schedule and fall back to `due_date` for unpaid projects that have no explicit follow-up date yet.
- 2026-03-06: Local `localhost` auth now auto-upserts the known `frank` / `codex-local` admin account inside the auth function because Wrangler CLI KV writes and `wrangler pages dev` do not share the same local KV backend reliably enough for Milestone 2 QA.
- 2026-03-06: Local D1 migrations must use `--persist-to .wrangler/state` so `wrangler d1 migrations apply --local` targets the same sqlite database that `wrangler pages dev --persist-to .wrangler/state` serves.
- 2026-03-06: Project-store queries now self-bootstrap the D1 schema on first missing-table or missing-column errors so local Pages dev initializes the exact runtime database it is serving before Milestone 2 QA continues.
- 2026-03-06: The local `public/` shell now only exists to hand `wrangler pages dev` requests off to the Vite app on `localhost:5174`, so root and missing client routes stay usable during local Pages-based QA.
- 2026-03-06: Local QA seed data uses stable `QA-CLM-*` claim numbers and event-note markers so the seeding script can upsert the Milestone 2 regression dataset over the local API without blindly duplicating projects.
