import { Link } from 'react-router-dom'
import type { Project } from '../types/claim'
import { computeStats, computeAging } from '../hooks/useProjects'
import StatsCard from '../components/StatsCard'
import InvoiceAgingCard from '../components/InvoiceAgingCard'
import ProjectListItem from '../components/ProjectListItem'
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

interface DashboardPageProps {
  projects: Project[]
  loading: boolean
}

export default function DashboardPage({ projects, loading }: DashboardPageProps) {
  const stats = computeStats(projects)
  const agingBuckets = computeAging(projects)
  const today = new Date().toISOString().slice(0, 10)
  const followUpQueue = projects
    .filter((project) => project.invoiceStatus !== 'Paid')
    .map((project) => ({
      project,
      followUpDate: project.nextFollowUpDate ?? project.dueDate,
    }))
    .filter((item) => item.followUpDate !== null)
    .sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!))
  const followUpQueuePreview = followUpQueue.slice(0, 6)

  const followUpTodayCount = followUpQueue.filter((item) => item.followUpDate === today).length
  const followUpThisWeekCount = followUpQueue.filter((item) => {
    if (!item.followUpDate) {
      return false
    }

    const diff = Math.floor(
      (new Date(`${item.followUpDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000
    )
    return diff >= 0 && diff <= 7
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-secondary mt-1">Overview of all projects and invoices</p>
      </div>

      {/* Stats Grid */}
      <dl className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Projects"
          value={stats.activeCount}
          subtitle={`${stats.totalProjects} total`}
          color="blue"
          icon={<DocumentTextIcon className="size-6 text-white" />}
          linkText="View all"
          linkHref="/projects"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subtitle="All invoices"
          color="green"
          icon={<CurrencyDollarIcon className="size-6 text-white" />}
        />
        <StatsCard
          title="Overdue"
          value={stats.overdueCount}
          subtitle={`${followUpTodayCount} due today, ${followUpThisWeekCount} this week`}
          color="red"
          icon={<ExclamationTriangleIcon className="size-6 text-white" />}
        />
        <StatsCard
          title="Missing Docs"
          value={stats.missingContracts + stats.missingCOCs}
          subtitle={`${stats.missingContracts} contracts, ${stats.missingCOCs} COCs`}
          color="yellow"
          icon={<DocumentMagnifyingGlassIcon className="size-6 text-white" />}
        />
      </dl>

      {/* Invoice Aging */}
      <div className="mb-8">
        <InvoiceAgingCard buckets={agingBuckets} />
      </div>

      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Collections Queue</h2>
            <p className="mt-1 text-sm text-secondary">Next projects that need a call, reminder, or payment check-in.</p>
          </div>
          <Link to="/projects" className="text-sm font-medium text-primary hover:text-primary-hover">
            View project list
          </Link>
        </div>

        {followUpQueuePreview.length === 0 ? (
          <div className="py-10 text-sm text-muted">No unpaid projects with follow-up dates are scheduled yet.</div>
        ) : (
          <ul className="mt-5 divide-y divide-gray-100">
            {followUpQueuePreview.map(({ project, followUpDate }) => (
              <li key={project.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <Link to={`/projects/${project.id}`} className="text-sm font-semibold text-foreground hover:text-primary">
                    {project.clientName}
                  </Link>
                  <p className="mt-1 text-sm text-secondary">
                    {project.projectName || project.projectType || 'Uncategorized project'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${followUpTone(followUpDate!, today)}`}>
                    {formatDate(followUpDate!)}
                  </p>
                  <p className="mt-1 text-xs text-muted">{followUpLabel(followUpDate!, today)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Projects</h2>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <ul role="list" className="divide-y divide-gray-200">
            {projects.slice(0, 10).map((project) => (
              <li key={project.id}>
                <ProjectListItem project={project} />
              </li>
            ))}
          </ul>
          {projects.length === 0 && (
            <div className="py-12 text-center text-muted">No projects yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function followUpTone(date: string, today: string) {
  if (date < today) {
    return 'text-red-700'
  }

  if (date === today) {
    return 'text-amber-700'
  }

  return 'text-foreground'
}

function followUpLabel(date: string, today: string) {
  const diff = Math.floor(
    (new Date(`${date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000
  )

  if (diff < 0) {
    const overdueDays = Math.abs(diff)
    return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`
  }

  if (diff === 0) {
    return 'Follow up today'
  }

  return `In ${diff} day${diff === 1 ? '' : 's'}`
}
