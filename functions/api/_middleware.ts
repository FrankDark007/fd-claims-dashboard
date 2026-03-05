interface Env {
  DASHBOARD_PASSWORD: string
  AUTH_SECRET: string
}

async function generateToken(password: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + secret + 'fd-claims')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)

  // Skip auth for public endpoints
  if (url.pathname === '/api/auth' || url.pathname === '/api/webhook') {
    return context.next()
  }

  const authHeader = context.request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const expectedToken = await generateToken(
    context.env.DASHBOARD_PASSWORD,
    context.env.AUTH_SECRET
  )

  if (token !== expectedToken) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  return context.next()
}
