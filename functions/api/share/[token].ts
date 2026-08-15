import {
  anonymizeIpAddress,
  parseStoredShareToken,
  safeContentDispositionFilename,
  sanitizeReferrer,
  sanitizeUserAgent,
  sha256Hex,
} from '../_shared/share-security'

interface Env {
  FD_PROJECT_FILES: R2Bucket
  FD_LIGHT_STATE: KVNamespace
  FD_CLAIMS_DB: D1Database
}

// GET /api/share/:token — public file download via share token
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const token = context.params.token as string
  if (!token) {
    return new Response('Invalid share link', { status: 400 })
  }

  // Look up share token in KV
  const shareJson = await context.env.FD_LIGHT_STATE.get(`share:${token}`)
  if (!shareJson) {
    return new Response('Share link expired or invalid', { status: 404 })
  }

  const share = parseStoredShareToken(shareJson)
  if (!share) {
    return new Response('Share link expired or invalid', { status: 404 })
  }

  // Check expiration (belt & suspenders — KV TTL should handle this)
  if (new Date(share.expiresAt) < new Date()) {
    await context.env.FD_LIGHT_STATE.delete(`share:${token}`)
    return new Response('Share link has expired', { status: 410 })
  }

  // Fetch file from R2
  const object = await context.env.FD_PROJECT_FILES.get(share.r2Key)
  if (!object) {
    return new Response('File not found', { status: 404 })
  }

  // Keep analytics useful without retaining a bearer token, full IP, full URL,
  // or an unbounded user-agent string.
  const rawIpAddress = context.request.headers.get('CF-Connecting-IP')
    || context.request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || ''
  const logView = Promise.all([
    import('../_shared/project-store'),
    sha256Hex(token),
  ]).then(([{ logShareLinkView }, shareTokenHash]) => logShareLinkView(context.env.FD_CLAIMS_DB, {
    shareTokenHash,
    projectId: share.projectId,
    fileId: share.fileId,
    ipAddress: anonymizeIpAddress(rawIpAddress),
    userAgent: sanitizeUserAgent(context.request.headers.get('User-Agent') || ''),
    referrer: sanitizeReferrer(context.request.headers.get('Referer') || ''),
  })).catch(() => undefined)
  context.waitUntil(logView)

  const headers = new Headers()
  headers.set('Content-Type', share.mimeType || 'application/octet-stream')
  headers.set('Content-Disposition', `inline; filename="${safeContentDispositionFilename(share.fileName)}"`)
  headers.set('Cache-Control', 'private, no-store')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Content-Type-Options', 'nosniff')

  if (object.size) {
    headers.set('Content-Length', object.size.toString())
  }

  return new Response(object.body, { headers })
}
