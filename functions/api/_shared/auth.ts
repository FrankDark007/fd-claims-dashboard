import type { SessionUser } from '../../../src/shared/projects'

export function getSessionUser(request: Request): SessionUser | null {
  const userId = request.headers.get('X-User-Id')
  const username = request.headers.get('X-User-Name')
  const displayName = request.headers.get('X-User-Display')
  const role = request.headers.get('X-User-Role')
  const email = request.headers.get('X-User-Email')

  if (!userId || !username || !displayName || (role !== 'admin' && role !== 'member')) {
    return null
  }

  return {
    userId,
    username,
    displayName,
    role,
    email,
  }
}

export function requireAdmin(request: Request): boolean {
  return request.headers.get('X-User-Role') === 'admin'
}
