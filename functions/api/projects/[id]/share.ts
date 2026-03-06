import { getProjectFileById } from '../../_shared/project-store'
import { getUserField } from '../../_shared/auth'

interface ShareToken {
  token: string
  projectId: string
  fileId: string
  fileName: string
  r2Key: string
  mimeType: string
  createdAt: string
  expiresAt: string
  createdBy: string
}

interface Env {
  FD_CLAIMS_DB: D1Database
  FD_LIGHT_STATE: KVNamespace
}

// POST /api/projects/:id/share — create a share token for a file
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const body = await context.request.json() as {
    fileId: string
    expiresInHours?: number
  }

  if (!body.fileId) {
    return Response.json({ error: 'fileId required' }, { status: 400 })
  }

  const file = await getProjectFileById(context.env.FD_CLAIMS_DB, projectId, body.fileId)
  if (!file) {
    return Response.json({ error: 'File not found' }, { status: 404 })
  }

  const expiresInHours = body.expiresInHours || 72 // default 3 days
  const token = crypto.randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000)

  const shareToken: ShareToken = {
    token,
    projectId,
    fileId: body.fileId,
    fileName: file.originalName,
    r2Key: file.r2Key,
    mimeType: file.mimeType,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdBy: getUserField(context, 'displayName') || 'Unknown',
  }

  // Store in KV with TTL
  await context.env.FD_LIGHT_STATE.put(
    `share:${token}`,
    JSON.stringify(shareToken),
    { expirationTtl: expiresInHours * 60 * 60 }
  )

  const url = new URL(context.request.url)
  const shareUrl = `${url.origin}/api/share/${token}`

  return Response.json({
    shareUrl,
    token,
    expiresAt: expiresAt.toISOString(),
  }, { status: 201 })
}
