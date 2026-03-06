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
          subtitle="Need attention"
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
