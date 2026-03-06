import type { SessionUser } from '../../../src/shared/projects'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Read the authenticated user from middleware-provided context.data or request headers.
 * context.data.user is the primary source (Pages Functions middleware).
 * Request headers are the fallback (direct header injection / local dev).
 */
export function getSessionUser(requestOrContext: Request | { data?: any; request: Request }): SessionUser | null {
  // If called with a PagesFunction context object, check context.data first
  if ('data' in requestOrContext && requestOrContext.data?.user) {
    const u = requestOrContext.data.user
    if (u.userId && u.username && u.displayName && (u.role === 'admin' || u.role === 'member')) {
      return {
        userId: u.userId,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        email: u.email ?? null,
      }
    }
  }

  // Fallback: read from request headers
  const request = 'headers' in requestOrContext && requestOrContext instanceof Request
    ? requestOrContext
    : (requestOrContext as any).request as Request

  const userId = request.headers.get('X-User-Id')
  const username = request.headers.get('X-User-Name')
  const displayName = request.headers.get('X-User-Display')
  const role = request.headers.get('X-User-Role')
  const email = request.headers.get('X-User-Email')

  if (!userId || !username || !displayName || (role !== 'admin' && role !== 'member')) {
    return null
  }

  return { userId, username, displayName, role, email }
}

export function requireAdmin(requestOrContext: Request | { data?: any; request: Request }): boolean {
  if ('data' in requestOrContext && requestOrContext.data?.user) {
    return requestOrContext.data.user.role === 'admin'
  }
  const request = requestOrContext instanceof Request ? requestOrContext : (requestOrContext as any).request
  return request.headers.get('X-User-Role') === 'admin'
}

/** Get a specific user field from context.data or request headers */
export function getUserField(context: { data?: any; request: Request }, field: 'userId' | 'username' | 'displayName' | 'role' | 'email'): string {
  if (context.data?.user?.[field]) return context.data.user[field]
  const headerMap: Record<string, string> = {
    userId: 'X-User-Id',
    username: 'X-User-Name',
    displayName: 'X-User-Display',
    role: 'X-User-Role',
    email: 'X-User-Email',
  }
  return context.request.headers.get(headerMap[field]) || ''
}
