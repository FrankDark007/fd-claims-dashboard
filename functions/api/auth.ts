interface Env {
  AUTH_SECRET: string
  FD_CLAIMS_USERS: KVNamespace
}

interface AuthUserRecord {
  id: string
  username: string
  displayName: string
  passwordHash: string
  salt: string
  role: string
  email?: string
  createdAt?: string
}

const LOCAL_ADMIN = {
  username: 'frank',
  displayName: 'Frank',
  email: 'darakhshan.farough@gmail.com',
  password: 'codex-local',
  role: 'admin',
} as const

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function createSessionToken(userId: string, username: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const nonce = crypto.randomUUID()
  const data = encoder.encode(`${userId}:${username}:${nonce}:${secret}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function shouldBootstrapLocalAdmin(request: Request, username: string, password: string): boolean {
  const hostname = new URL(request.url).hostname
  return (
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    username === LOCAL_ADMIN.username &&
    password === LOCAL_ADMIN.password
  )
}

async function upsertLocalAdmin(env: Env): Promise<AuthUserRecord> {
  const salt = crypto.randomUUID()
  const passwordHash = await hashPassword(LOCAL_ADMIN.password, salt)
  const user: AuthUserRecord = {
    id: crypto.randomUUID(),
    username: LOCAL_ADMIN.username,
    displayName: LOCAL_ADMIN.displayName,
    passwordHash,
    salt,
    role: LOCAL_ADMIN.role,
    email: LOCAL_ADMIN.email,
    createdAt: new Date().toISOString(),
  }
  await env.FD_CLAIMS_USERS.put(`user:${LOCAL_ADMIN.username}`, JSON.stringify(user))
  return user
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { username, password } = await context.request.json() as { username: string; password: string }

    if (!username || !password) {
      return Response.json({ error: 'Username and password required' }, { status: 400 })
    }

    const normalizedUsername = username.toLowerCase().trim()
    let user: AuthUserRecord

    if (shouldBootstrapLocalAdmin(context.request, normalizedUsername, password)) {
      user = await upsertLocalAdmin(context.env)
    } else {
      const userJson = await context.env.FD_CLAIMS_USERS.get(`user:${normalizedUsername}`)
      if (!userJson) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      user = JSON.parse(userJson) as AuthUserRecord
    }

    // Verify password
    const hash = await hashPassword(password, user.salt)
    if (hash !== user.passwordHash) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create session token and store in KV (7 day TTL)
    const token = await createSessionToken(user.id, user.username, context.env.AUTH_SECRET)
    const session = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      email: user.email || null,
    }
    await context.env.FD_CLAIMS_USERS.put(`session:${token}`, JSON.stringify(session), {
      expirationTtl: 60 * 60 * 24 * 7, // 7 days
    })

    return Response.json({ token, user: session })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
