# Decisions

- 2026-03-06: `FD_LIGHT_STATE` reuses the former project-data KV namespace so deploy wiring can change without blocking the D1 migration; KV is now reserved for share tokens and other light state.
- 2026-03-06: `wrangler.toml` uses placeholder D1 IDs that must be replaced with real Cloudflare database IDs before remote deploys.
- 2026-03-06: Local dev parity will run through `wrangler pages dev` with local D1/KV/R2 persistence instead of the old `server/api.ts` Notion proxy.
