import { Link } from 'react-router-dom'
import type { Project } from '../shared/projects'

interface ReportsPageProps {
  projects: Project[]
  loading: boolean
}

export default function ReportsPage({ projects, loading }: ReportsPageProps) {
  const today = new Date().toISOString().slice(0, 10)

  const outstandingProjects = projects.filter((project) => project.invoiceStatus !== 'Paid')
  const followUpQueue = outstandingProjects
    .map((project) => ({
      project,
      followUpDate: project.nextFollowUpDate ?? project.dueDate,
    }))
    .filter((item) => item.followUpDate)
    .sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!))

  const overdueProjects = outstandingProjects.filter((project) => project.invoiceStatus === 'Overdue')
  const outstandingBalance = outstandingProjects.reduce((sum, project) => sum + (project.amount ?? 0), 0)
  const overdueBalance = overdueProjects.reduce((sum, project) => sum + (project.amount ?? 0), 0)
  const documentsReady = projects.filter((project) => project.contractStatus === 'Signed' && project.cocStatus === 'Signed').length

  const projectTypeBreakdown = ['Water Mitigation', 'Pack-out', 'Mold Remediation'].map((type) => {
    const matching = projects.filter((project) => project.projectType === type)
    return {
      type,
      count: matching.length,
      revenue: matching.reduce((sum, project) => sum + (project.amount ?? 0), 0),
    }
  })

  const documentGaps = [
    {
      label: 'Missing Contracts',
      count: projects.filter((project) => project.contractStatus === 'Missing').length,
    },
    {
      label: 'Missing COCs',
      count: projects.filter((project) => project.cocStatus === 'Missing').length,
    },
    {
      label: 'Missing Dry Logs',
      count: projects.filter((project) => project.drylogStatus === 'Missing').length,
    },
    {
      label: 'Matterport Missing',
      count: projects.filter((project) => project.matterportStatus === 'Missing').length,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-secondary">Collections, document readiness, and production mix across all projects.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard label="Outstanding Balance" value={`$${outstandingBalance.toLocaleString()}`} subtitle={`${outstandingProjects.length} unpaid projects`} />
        <ReportCard label="Overdue Balance" value={`$${overdueBalance.toLocaleString()}`} subtitle={`${overdueProjects.length} overdue invoices`} />
        <ReportCard label="Follow-ups Due" value={followUpQueue.filter((item) => item.followUpDate! <= today).length.toString()} subtitle="Needs attention now" />
        <ReportCard label="Docs Ready" value={documentsReady.toString()} subtitle={`${projects.length} total projects`} />
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl bg-white p-6 shadow">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Collections Queue</h2>
              <p className="mt-1 text-sm text-secondary">Prioritized by next follow-up or due date.</p>
            </div>
            <Link to="/projects" className="text-sm font-medium text-primary hover:text-primary-hover">
              Open project list
            </Link>
          </div>

          {followUpQueue.length === 0 ? (
            <div className="py-10 text-sm text-muted">No collections items are scheduled yet.</div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Invoice Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold">Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {followUpQueue.slice(0, 12).map(({ project, followUpDate }) => (
                    <tr key={project.id}>
                      <td className="px-4 py-3">
                        <Link to={`/projects/${project.id}`} className="font-medium text-foreground hover:text-primary">
                          {project.clientName}
                        </Link>
                        <p className="text-xs text-muted">{project.projectName || project.projectType || 'Project detail'}</p>
                      </td>
                      <td className="px-4 py-3">{project.invoiceStatus}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {project.amount ? `$${project.amount.toLocaleString()}` : '—'}
                      </td>
                      <td className={`px-4 py-3 ${followUpDate! <= today ? 'font-semibold text-red-700' : 'text-secondary'}`}>
                        {formatDate(followUpDate!)} · {describeLag(followUpDate!, today)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-foreground">Document Gaps</h2>
          <p className="mt-1 text-sm text-secondary">Quick view of missing operational documentation.</p>
          <ul className="mt-5 space-y-3">
            {documentGaps.map((gap) => (
              <li key={gap.label} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-foreground">{gap.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${gap.count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {gap.count}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-foreground">Project Type Mix</h2>
        <p className="mt-1 text-sm text-secondary">Current workload and revenue split by project type.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {projectTypeBreakdown.map((bucket) => (
            <div key={bucket.type} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{bucket.type}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{bucket.count}</p>
              <p className="mt-1 text-sm text-secondary">${bucket.revenue.toLocaleString()} total billed</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ReportCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-secondary">{subtitle}</p>
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

function describeLag(date: string, today: string) {
  const diff = Math.floor(
    (new Date(`${date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000
  )

  if (diff < 0) {
    const overdueDays = Math.abs(diff)
    return `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`
  }

  if (diff === 0) {
    return 'today'
  }

  return `in ${diff} day${diff === 1 ? '' : 's'}`
}
