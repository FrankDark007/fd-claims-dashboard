import { listGmailAlerts, markGmailAlertsRead } from '../_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const unreadOnly = url.searchParams.get('unread') === '1'
  const projectIdParam = url.searchParams.get('projectId')
  const projectId = projectIdParam && projectIdParam.length <= 128 ? projectIdParam : undefined
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '50', 10)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(100, Math.max(1, requestedLimit))
    : 50

  const alerts = await listGmailAlerts(context.env.FD_CLAIMS_DB, {
    unreadOnly,
    projectId,
    limit,
  })

  return Response.json({ alerts })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { alertIds?: string[] }
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.alertIds || !Array.isArray(body.alertIds) || body.alertIds.length === 0) {
    return Response.json({ error: 'alertIds array required' }, { status: 400 })
  }

  const alertIds = [...new Set(body.alertIds)]
  if (
    alertIds.length > 100
    || alertIds.some((id) => typeof id !== 'string' || id.length === 0 || id.length > 128)
  ) {
    return Response.json({ error: 'alertIds must contain 1-100 valid IDs' }, { status: 400 })
  }

  const updated = await markGmailAlertsRead(context.env.FD_CLAIMS_DB, alertIds)

  return Response.json({ updated })
}
