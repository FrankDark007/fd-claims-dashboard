import { createRemoteJWKSet, errors, jwtVerify } from 'jose'

interface Env {
  AUTH_SECRET: string
  FD_CLAIMS_USERS: KVNamespace
  GOOGLE_CLIENT_ID: string
}

interface AuthUserRecord {
  id: string
  username: string
  displayName: string
  role: string
  email?: string
}

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com']
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

async function createSessionToken(userId: string, username: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const nonce = crypto.randomUUID()
  const data = encoder.encode(`${userId}:${username}:${nonce}:${secret}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    if (!context.env.GOOGLE_CLIENT_ID) {
      return Response.json({ error: 'Google sign-in is not configured' }, { status: 503 })
    }

    let body: { credential?: unknown }
    try {
      body = await context.request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (typeof body.credential !== 'string' || body.credential.length === 0 || body.credential.length > 10_000) {
      return Response.json({ error: 'No valid credential provided' }, { status: 400 })
    }

    const { payload } = await jwtVerify(body.credential, GOOGLE_JWKS, {
      audience: context.env.GOOGLE_CLIENT_ID,
      issuer: GOOGLE_ISSUERS,
    })

    const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : ''
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true'
    if (!email || !emailVerified || typeof payload.sub !== 'string' || payload.sub.length === 0) {
      return Response.json({ error: 'Invalid Google token' }, { status: 401 })
    }

    const userList = await context.env.FD_CLAIMS_USERS.list({ prefix: 'user:' })
    let matchedUser: AuthUserRecord | null = null

    for (const key of userList.keys) {
      const userJson = await context.env.FD_CLAIMS_USERS.get(key.name)
      if (!userJson) continue
      const user = JSON.parse(userJson) as AuthUserRecord
      if (user.email?.toLowerCase() === email) {
        matchedUser = user
        break
      }
    }

    if (!matchedUser) {
      return Response.json({ error: 'No linked account found' }, { status: 403 })
    }

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
    if (error instanceof errors.JOSEError) {
      return Response.json({ error: 'Invalid Google token' }, { status: 401 })
    }

    console.error('Google authentication failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    })
    return Response.json({ error: 'Google sign-in is temporarily unavailable' }, { status: 503 })
  }
}
