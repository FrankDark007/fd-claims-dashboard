# Decisions

- 2026-03-06: `FD_LIGHT_STATE` reuses the former project-data KV namespace so deploy wiring can change without blocking the D1 migration; KV is now reserved for share tokens and other light state.
- 2026-03-06: `wrangler.toml` uses placeholder D1 IDs that must be replaced with real Cloudflare database IDs before remote deploys.
- 2026-03-06: Local dev parity will run through `wrangler pages dev` with local D1/KV/R2 persistence instead of the old `server/api.ts` Notion proxy.
- 2026-03-06: Milestone 2 adds `projects.next_follow_up_date` as the persisted collections workflow anchor; when an invoice sent date first creates a due date, the next follow-up defaults to that same date and clears automatically when payment is recorded.
- 2026-03-06: Logging a reminder event automatically pushes the next follow-up out 7 days unless a later manual edit changes it, so the collections workflow moves forward without needing a separate task system.
- 2026-03-06: Invoice-event edits and deletes now reconcile the project’s invoice/follow-up fields against the remaining timeline so removing a paid or reminder event does not leave stale billing state behind in D1.
- 2026-03-06: Calendar and queue views treat `next_follow_up_date` as the primary collections schedule and fall back to `due_date` for unpaid projects that have no explicit follow-up date yet.
