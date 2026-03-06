import { Link } from 'react-router-dom'
import {
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'
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
      label: 'Missing contracts',
      count: projects.filter((project) => project.contractStatus === 'Missing').length,
    },
    {
      label: 'Missing COCs',
      count: projects.filter((project) => project.cocStatus === 'Missing').length,
    },
    {
      label: 'Missing dry logs',
      count: projects.filter((project) => project.drylogStatus === 'Missing').length,
    },
    {
      label: 'Matterport missing',
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
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Reporting</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Operational reporting for collections and production.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              Use this view for a quick weekly readout: cash exposure, follow-up pressure, document gaps, and how the
              current workload is split across job types.
            </p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            Open projects
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportStat
          label="Outstanding balance"
          value={`$${outstandingBalance.toLocaleString()}`}
          subtitle={`${outstandingProjects.length} unpaid projects`}
          icon={BanknotesIcon}
        />
        <ReportStat
          label="Overdue balance"
          value={`$${overdueBalance.toLocaleString()}`}
          subtitle={`${overdueProjects.length} overdue invoices`}
          icon={ClockIcon}
        />
        <ReportStat
          label="Follow-ups due"
          value={followUpQueue.filter((item) => item.followUpDate! <= today).length.toString()}
          subtitle="Needs attention now"
          icon={QueueListIcon}
        />
        <ReportStat
          label="Docs ready"
          value={documentsReady.toString()}
          subtitle={`${projects.length} total projects`}
          icon={ClipboardDocumentCheckIcon}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Collections queue</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Upcoming payment follow-ups</h3>
              <p className="mt-2 text-sm text-slate-600">Prioritized by next follow-up date, then invoice due date.</p>
            </div>
            <Link to="/calendar" className="text-sm font-semibold text-primary hover:text-primary-hover">
              Open calendar
            </Link>
          </div>

          {followUpQueue.length === 0 ? (
            <div className="py-10 text-sm text-slate-500">No collections items are scheduled yet.</div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Invoice status</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Next action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {followUpQueue.slice(0, 12).map(({ project, followUpDate }) => (
                    <tr key={project.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 hover:text-primary">
                          {project.clientName}
                        </Link>
                        <p className="text-xs text-slate-500">{project.projectName || project.projectType || 'Project detail'}</p>
                      </td>
                      <td className="px-4 py-3">{project.invoiceStatus}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {project.amount ? `$${project.amount.toLocaleString()}` : '—'}
                      </td>
                      <td className={`px-4 py-3 ${followUpDate! <= today ? 'font-semibold text-rose-700' : 'text-slate-600'}`}>
                        {formatDate(followUpDate!)} · {describeLag(followUpDate!, today)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Document gaps</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Operational blockers</h3>
          <p className="mt-2 text-sm text-slate-600">Missing paperwork and capture steps that can slow collections or close-out.</p>
          <ul className="mt-6 space-y-3">
            {documentGaps.map((gap) => (
              <li key={gap.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-900">{gap.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${gap.count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {gap.count}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Project mix</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">Current workload by job type</h3>
        <p className="mt-2 text-sm text-slate-600">Useful for staffing decisions and monthly revenue review.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {projectTypeBreakdown.map((bucket) => (
            <div key={bucket.type} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{bucket.type}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{bucket.count}</p>
              <p className="mt-2 text-sm text-slate-600">${bucket.revenue.toLocaleString()} total billed</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ReportStat({
  label,
  value,
  subtitle,
  icon: Icon,
}: {
  label: string
  value: string
  subtitle: string
  icon: typeof BanknotesIcon
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <Icon className="size-5 text-slate-400" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
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
    (new Date(`${date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000,
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
