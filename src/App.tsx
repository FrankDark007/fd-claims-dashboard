import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useProjects } from './hooks/useProjects'
import { useAuth } from './hooks/useAuth'
import type { User } from './types/claim'
import AppShell from './components/AppShell'
import LoginPage from './components/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import UsersPage from './pages/UsersPage'
import CalendarPage from './pages/CalendarPage'
import ReportsPage from './pages/ReportsPage'

function App() {
  const auth = useAuth()

  if (auth.initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

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
  const { projects, loading, error, refetch } = useProjects(token)

  return (
    <AppShell user={user} onLogout={onLogout}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-emergency">
          <strong>Error:</strong> {error}
        </div>
      )}
      <Routes>
        <Route path="/" element={<DashboardPage projects={projects} loading={loading} />} />
        <Route path="/projects" element={<ProjectsPage projects={projects} loading={loading} token={token} onRefresh={refetch} />} />
        <Route path="/projects/:id" element={<ProjectDetailPage projects={projects} token={token} onProjectsRefresh={refetch} />} />
        <Route path="/calendar" element={<CalendarPage projects={projects} token={token} onProjectsRefresh={refetch} />} />
        <Route path="/reports" element={<ReportsPage projects={projects} loading={loading} />} />
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
