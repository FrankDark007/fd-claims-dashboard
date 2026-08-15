import { getProjectFileById, listShareLinkViews } from '../../_shared/project-store'
import { getUserField } from '../../_shared/auth'
import type { StoredShareToken } from '../../_shared/share-security'

interface Env {
  FD_CLAIMS_DB: D1Database
  FD_LIGHT_STATE: KVNamespace
}

const MAX_KV_TTL_SECONDS = 365 * 24 * 60 * 60
const MAX_EXPIRY_HOURS = MAX_KV_TTL_SECONDS / 60 / 60

// POST /api/projects/:id/share — create a share token for a file
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  let body: { fileId?: unknown; expiresInHours?: unknown }
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.fileId !== 'string' || body.fileId.length === 0 || body.fileId.length > 128) {
    return Response.json({ error: 'fileId required' }, { status: 400 })
  }

  const expiresInHours = body.expiresInHours ?? 72
  if (
    typeof expiresInHours !== 'number'
    || !Number.isInteger(expiresInHours)
    || expiresInHours < 1
    || expiresInHours > MAX_EXPIRY_HOURS
  ) {
    return Response.json({ error: 'expiresInHours must be an integer from 1 to 8760' }, { status: 400 })
  }

  const file = await getProjectFileById(context.env.FD_CLAIMS_DB, projectId, body.fileId)
  if (!file) {
    return Response.json({ error: 'File not found' }, { status: 404 })
  }

  const token = crypto.randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000)

  const shareToken: StoredShareToken = {
    projectId,
    fileId: body.fileId,
    fileName: file.originalName,
    r2Key: file.r2Key,
    mimeType: file.mimeType,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdBy: getUserField(context, 'displayName') || 'Unknown',
  }

  const ttlSeconds = expiresInHours * 60 * 60
  await context.env.FD_LIGHT_STATE.put(
    `share:${token}`,
    JSON.stringify(shareToken),
    { expirationTtl: ttlSeconds }
  )

  const url = new URL(context.request.url)
  const shareUrl = `${url.origin}/api/share/${token}`

  return Response.json({
    shareUrl,
    token,
    expiresAt: expiresAt.toISOString(),
  }, { status: 201 })
}

// GET /api/projects/:id/share — list share link view history
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const url = new URL(context.request.url)
  const fileId = url.searchParams.get('fileId') || undefined
  if (fileId && fileId.length > 128) {
    return Response.json({ error: 'Invalid fileId' }, { status: 400 })
  }

  const views = await listShareLinkViews(context.env.FD_CLAIMS_DB, projectId, fileId)
  return Response.json({ views })
}
