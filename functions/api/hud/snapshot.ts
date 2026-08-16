import { timingSafeEqualStrings } from '../_shared/secure-compare'
import {
  listAllProjectTasks,
  listInvoiceEvents,
  listProjectCommunications,
  listProjects,
} from '../_shared/project-store'
import { buildClaimsHudSnapshot, type ClaimsHudSnapshot } from '../../../src/shared/claims-hud-snapshot'

interface HudEnv {
  FD_CLAIMS_DB: D1Database
  HUD_CLAIMS_TOKEN: string
}

type SnapshotLoader = (db: D1Database, observedAt: string) => Promise<ClaimsHudSnapshot>

const headers = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  Vary: 'Authorization',
}

async function loadSnapshot(db: D1Database, observedAt: string): Promise<ClaimsHudSnapshot> {
  const [projects, tasks, communications, invoiceEvents] = await Promise.all([
    listProjects(db), listAllProjectTasks(db), listProjectCommunications(db), listInvoiceEvents(db),
  ])
  return buildClaimsHudSnapshot({ projects, tasks, communications, invoiceEvents, observedAt })
}

export async function createHudSnapshotResponse(
  request: Request,
  env: HudEnv,
  loader: SnapshotLoader = loadSnapshot,
): Promise<Response> {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: { ...headers, Allow: 'GET' } })
  }
  const url = new URL(request.url)
  if (url.search !== '') return Response.json({ error: 'Query not allowed' }, { status: 400, headers })

  const authorization = request.headers.get('Authorization')
  const supplied = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  if (!await timingSafeEqualStrings(supplied, env.HUD_CLAIMS_TOKEN)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers })
  }

  try {
    return Response.json(await loader(env.FD_CLAIMS_DB, new Date().toISOString()), { headers })
  } catch {
    return Response.json({ error: 'Snapshot unavailable' }, { status: 503, headers })
  }
}

export const onRequest: PagesFunction<HudEnv> = (context) =>
  createHudSnapshotResponse(context.request, context.env)
