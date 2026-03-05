import { useState, useEffect, useCallback } from 'react'
import type { UserRecord } from '../types/claim'

interface UsersPageProps {
  token: string
}

export default function UsersPage({ token }: UsersPageProps) {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<{ username: string; password: string; displayName: string; email: string; role: 'admin' | 'member' }>({ username: '', password: '', displayName: '', email: '', role: 'member' })
  const [submitting, setSubmitting] = useState(false)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')
      setShowForm(false)
      setFormData({ username: '', password: '', displayName: '', email: '', role: 'member' as const })
      await fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (username: string, displayName: string) => {
    if (!confirm(`Remove ${displayName} (${username})?`)) return
    setError(null)
    try {
      const res = await fetch(`/api/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')
      await fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
          <p className="mt-1 text-sm text-secondary">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-emergency">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-lg border border-faint bg-surface p-6 shadow-md">
          <h2 className="text-lg font-semibold text-foreground mb-4">Add Team Member</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData(f => ({ ...f, displayName: e.target.value }))}
                placeholder="Frank D."
                className="block w-full rounded-md border border-faint bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }))}
                placeholder="frank"
                className="block w-full rounded-md border border-faint bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                className="block w-full rounded-md border border-faint bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email (optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                placeholder="For Google Sign-In linking"
                className="block w-full rounded-md border border-faint bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(f => ({ ...f, role: e.target.value as 'admin' | 'member' }))}
                className="block w-full rounded-md border border-faint bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex items-center rounded-md border border-faint px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-alt transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-faint bg-surface shadow-sm">
        <table className="min-w-full divide-y divide-faint">
          <thead className="bg-surface-alt">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Username</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary">Added</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-faint">
            {users.map((u) => (
              <tr key={u.username} className="hover:bg-surface-alt transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {u.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{u.displayName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{u.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{u.email || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    u.role === 'admin'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-alt text-secondary'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleDelete(u.username, u.displayName)}
                    className="text-sm text-emergency hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted">
                  No users yet. Add the first team member above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
