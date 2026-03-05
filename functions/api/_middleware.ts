interface Env {
  FD_CLAIMS_USERS: KVNamespace
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)

  // Skip auth for public endpoints
  if (
    url.pathname === '/api/auth' ||
    url.pathname === '/api/auth/google' ||
    url.pathname === '/api/webhook'
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

  // Attach user info to request via header for downstream functions
  const headers = new Headers(context.request.headers)
  headers.set('X-User-Id', session.userId)
  headers.set('X-User-Name', session.username)
  headers.set('X-User-Display', session.displayName)
  headers.set('X-User-Role', session.role)

  // Create new request with user headers
  const newRequest = new Request(context.request.url, {
    method: context.request.method,
    headers,
    body: context.request.body,
  })

  // Replace the request in context
  context.request = newRequest

  return context.next()
}
