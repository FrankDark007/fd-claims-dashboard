import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useClaims } from './hooks/useNotionData'
import { useAuth } from './hooks/useAuth'
import type { User } from './types/claim'
import Sidebar from './components/Sidebar'
import LoginPage from './components/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClaimsPage from './pages/ClaimsPage'
import UsersPage from './pages/UsersPage'

function App() {
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={auth.login} onGoogleLogin={auth.googleLogin} loading={auth.loading} error={auth.error} />
  }

  return (
    <BrowserRouter>
      <AuthenticatedApp token={auth.token!} user={auth.user!} onLogout={auth.logout} />
    </BrowserRouter>
  )
}

function AuthenticatedApp({ token, user, onLogout }: { token: string; user: User; onLogout: () => void }) {
  const { claims, loading, error } = useClaims(token)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto p-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-emergency">
            <strong>Error:</strong> {error}
          </div>
        )}
        <Routes>
          <Route path="/" element={<DashboardPage claims={claims} loading={loading} />} />
          <Route path="/claims" element={<ClaimsPage claims={claims} loading={loading} />} />
          <Route path="/clients" element={<PlaceholderPage title="Clients" />} />
          <Route path="/contracts" element={<PlaceholderPage title="Contracts" />} />
          {user.role === 'admin' && (
            <Route path="/users" element={<UsersPage token={token} />} />
          )}
        </Routes>
      </main>
    </div>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-secondary">Coming soon</p>
    </div>
  )
}

export default App
