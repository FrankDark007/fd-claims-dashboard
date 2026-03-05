import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useClaims } from './hooks/useNotionData'
import { useAuth } from './hooks/useAuth'
import type { User } from './types/claim'
import AppShell from './components/AppShell'
import LoginPage from './components/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
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
    <AppShell user={user} onLogout={onLogout}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-emergency">
          <strong>Error:</strong> {error}
        </div>
      )}
      <Routes>
        <Route path="/" element={<DashboardPage claims={claims} loading={loading} />} />
        <Route path="/projects" element={<ProjectsPage claims={claims} loading={loading} />} />
        <Route path="/projects/:id" element={<ProjectDetailPage claims={claims} token={token} />} />
        <Route path="/calendar" element={<PlaceholderPage title="Calendar" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        {user.role === 'admin' && (
          <Route path="/users" element={<UsersPage token={token} />} />
        )}
      </Routes>
    </AppShell>
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
