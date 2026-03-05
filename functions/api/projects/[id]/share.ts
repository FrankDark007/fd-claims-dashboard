interface Env {
  FD_PROJECTS_DATA: KVNamespace
}

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

  // Look up the file metadata
  const filesJson = await context.env.FD_PROJECTS_DATA.get(`project:${projectId}:files`)
  const files = filesJson ? JSON.parse(filesJson) : []
  const file = files.find((f: { id: string }) => f.id === body.fileId)

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
    fileName: file.name,
    r2Key: file.r2Key,
    mimeType: file.mimeType,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdBy: context.request.headers.get('X-User-Display') || 'Unknown',
  }

  // Store in KV with TTL
  await context.env.FD_PROJECTS_DATA.put(
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
