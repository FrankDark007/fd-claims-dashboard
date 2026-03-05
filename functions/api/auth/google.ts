interface Env {
  AUTH_SECRET: string
  ALLOWED_EMAIL: string
  DASHBOARD_PASSWORD: string
}

async function generateToken(password: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + secret + 'fd-claims')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { credential } = await context.request.json() as { credential: string }

    if (!credential) {
      return Response.json({ error: 'No credential provided' }, { status: 400 })
    }

    // Verify the Google ID token
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
    if (!verifyRes.ok) {
      return Response.json({ error: 'Invalid Google token' }, { status: 401 })
    }

    const payload = await verifyRes.json() as { email: string; email_verified: string; name: string }

    // Check email is allowed
    const allowedEmails = (context.env.ALLOWED_EMAIL || '').split(',').map(e => e.trim().toLowerCase())
    if (!allowedEmails.includes(payload.email.toLowerCase())) {
      return Response.json({ error: `Access denied for ${payload.email}` }, { status: 403 })
    }

    // Generate the same token format as password auth so middleware accepts it
    const token = await generateToken(
      context.env.DASHBOARD_PASSWORD,
      context.env.AUTH_SECRET
    )

    return Response.json({ token, email: payload.email, name: payload.name })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
