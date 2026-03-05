import { useState } from 'react'

interface LoginPageProps {
  onLogin: (password: string) => Promise<boolean>
  loading: boolean
  error: string | null
}

export default function LoginPage({ onLogin, loading, error }: LoginPageProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onLogin(password)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Flood Doctor</h1>
          <p className="mt-1 text-sm text-sidebar-text">Claims Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-surface p-8 shadow-xl">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter dashboard password"
                autoFocus
                required
                className="w-full rounded-lg border border-faint bg-surface-alt px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-emergency">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-sidebar-text/60">
          Flood Doctor Internal Dashboard
        </p>
      </div>
    </div>
  )
}
