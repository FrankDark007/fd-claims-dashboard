interface Env {
  FD_PROJECT_FILES: R2Bucket
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

// GET /api/share/:token — public file download via share token
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const token = context.params.token as string
  if (!token) {
    return new Response('Invalid share link', { status: 400 })
  }

  // Look up share token in KV
  const shareJson = await context.env.FD_PROJECTS_DATA.get(`share:${token}`)
  if (!shareJson) {
    return new Response('Share link expired or invalid', { status: 404 })
  }

  const share: ShareToken = JSON.parse(shareJson)

  // Check expiration (belt & suspenders — KV TTL should handle this)
  if (new Date(share.expiresAt) < new Date()) {
    await context.env.FD_PROJECTS_DATA.delete(`share:${token}`)
    return new Response('Share link has expired', { status: 410 })
  }

  // Fetch file from R2
  const object = await context.env.FD_PROJECT_FILES.get(share.r2Key)
  if (!object) {
    return new Response('File not found', { status: 404 })
  }

  const headers = new Headers()
  headers.set('Content-Type', share.mimeType || 'application/octet-stream')
  headers.set('Content-Disposition', `inline; filename="${share.fileName}"`)
  headers.set('Cache-Control', 'private, max-age=3600')

  if (object.size) {
    headers.set('Content-Length', object.size.toString())
  }

  return new Response(object.body, { headers })
}
