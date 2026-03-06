interface Env {
  FD_CLAIMS_USERS: KVNamespace
  AUTH_SECRET: string
}

interface UserRecord {
  id: string
  username: string
  displayName: string
  passwordHash: string
  salt: string
  role: 'admin' | 'member'
  email?: string
  createdAt: string
}

function toSafeUser(user: UserRecord): Omit<UserRecord, 'passwordHash' | 'salt'> {
  const safeUser = { ...user }
  delete safeUser.passwordHash
  delete safeUser.salt
  return safeUser
}

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

function isAdmin(request: Request): boolean {
  return request.headers.get('X-User-Role') === 'admin'
}

// GET /api/users — list all users (admin only)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!isAdmin(context.request)) {
    return Response.json({ error: 'Admin access required' }, { status: 403 })
  }

  const list = await context.env.FD_CLAIMS_USERS.list({ prefix: 'user:' })
  const users: Array<Omit<UserRecord, 'passwordHash' | 'salt'>> = []

  for (const key of list.keys) {
    const json = await context.env.FD_CLAIMS_USERS.get(key.name)
    if (!json) continue
    const user = JSON.parse(json) as UserRecord
    users.push(toSafeUser(user))
  }

  return Response.json({ users })
}

// POST /api/users — create user (admin only)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!isAdmin(context.request)) {
    return Response.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await context.request.json() as {
      username: string
      password: string
      displayName: string
      role?: 'admin' | 'member'
      email?: string
    }

    if (!body.username || !body.password || !body.displayName) {
      return Response.json({ error: 'username, password, and displayName required' }, { status: 400 })
    }

    const username = body.username.toLowerCase().trim()

    // Check if username already exists
    const existing = await context.env.FD_CLAIMS_USERS.get(`user:${username}`)
    if (existing) {
      return Response.json({ error: 'Username already exists' }, { status: 409 })
    }

    // Hash password
    const salt = crypto.randomUUID()
    const passwordHash = await hashPassword(body.password, salt)

    const user: UserRecord = {
      id: crypto.randomUUID(),
      username,
      displayName: body.displayName.trim(),
      passwordHash,
      salt,
      role: body.role || 'member',
      email: body.email?.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
    }

    await context.env.FD_CLAIMS_USERS.put(`user:${username}`, JSON.stringify(user))

    return Response.json({ user: toSafeUser(user) }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/users?username=xxx — remove user (admin only)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  if (!isAdmin(context.request)) {
    return Response.json({ error: 'Admin access required' }, { status: 403 })
  }

  const url = new URL(context.request.url)
  const username = url.searchParams.get('username')?.toLowerCase()

  if (!username) {
    return Response.json({ error: 'username query param required' }, { status: 400 })
  }

  // Prevent deleting yourself
  const currentUser = context.request.headers.get('X-User-Name')
  if (username === currentUser) {
    return Response.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const existing = await context.env.FD_CLAIMS_USERS.get(`user:${username}`)
  if (!existing) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  await context.env.FD_CLAIMS_USERS.delete(`user:${username}`)

  // Also invalidate any active sessions for this user
  const sessions = await context.env.FD_CLAIMS_USERS.list({ prefix: 'session:' })
  for (const key of sessions.keys) {
    const sessionJson = await context.env.FD_CLAIMS_USERS.get(key.name)
    if (!sessionJson) continue
    const session = JSON.parse(sessionJson)
    if (session.username === username) {
      await context.env.FD_CLAIMS_USERS.delete(key.name)
    }
  }

  return Response.json({ ok: true })
}
