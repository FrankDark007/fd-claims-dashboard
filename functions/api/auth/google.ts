interface Env {
  AUTH_SECRET: string
  FD_CLAIMS_USERS: KVNamespace
}

async function createSessionToken(userId: string, username: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const nonce = crypto.randomUUID()
  const data = encoder.encode(`${userId}:${username}:${nonce}:${secret}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
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
    const email = payload.email.toLowerCase()

    // Look up user by email in KV — scan for matching email
    const userList = await context.env.FD_CLAIMS_USERS.list({ prefix: 'user:' })
    let matchedUser: { id: string; username: string; displayName: string; role: string; email?: string } | null = null

    for (const key of userList.keys) {
      const userJson = await context.env.FD_CLAIMS_USERS.get(key.name)
      if (!userJson) continue
      const user = JSON.parse(userJson)
      if (user.email && user.email.toLowerCase() === email) {
        matchedUser = user
        break
      }
    }

    if (!matchedUser) {
      return Response.json({ error: `No account linked to ${payload.email}` }, { status: 403 })
    }

    // Create session token
    const token = await createSessionToken(matchedUser.id, matchedUser.username, context.env.AUTH_SECRET)
    const session = {
      userId: matchedUser.id,
      username: matchedUser.username,
      displayName: matchedUser.displayName,
      role: matchedUser.role,
      email: matchedUser.email || null,
    }
    await context.env.FD_CLAIMS_USERS.put(`session:${token}`, JSON.stringify(session), {
      expirationTtl: 60 * 60 * 24 * 7,
    })

    return Response.json({ token, user: session })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
