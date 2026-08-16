interface Env {
  FD_CLAIMS_USERS: KVNamespace
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)

  // Skip auth for public endpoints
  if (
    url.pathname === '/api/auth' ||
    url.pathname === '/api/auth/google' ||
    url.pathname === '/api/webhook' ||
    url.pathname === '/api/gmail/inbound' ||
    url.pathname === '/api/hud/snapshot' ||
    url.pathname.startsWith('/api/share/')
  ) {
    return context.next()
  }

  const authHeader = context.request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)

  // Look up session in KV
  const sessionJson = await context.env.FD_CLAIMS_USERS.get(`session:${token}`)
  if (!sessionJson) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 401 })
  }

  const session = JSON.parse(sessionJson)

  // Pass user info via context.data (request replacement doesn't propagate in Pages Functions)
  context.data = context.data || {}
  context.data.user = {
    userId: session.userId,
    username: session.username,
    displayName: session.displayName,
    role: session.role,
    email: session.email || '',
  }

  return context.next()
}
