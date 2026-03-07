import { Link } from 'react-router-dom'
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { Project } from '../types/claim'
import { computeStats, computeAging } from '../hooks/useProjects'
import { useAllCommunications, useAllTasks } from '../hooks/useOperationalQueues'
import StatusPill from '../components/StatusPill'
import AiBriefing from '../components/AiBriefing'
import { computePriorityScore, getPriorityLabel } from '../lib/priority'

interface DashboardPageProps {
  projects: Project[]
  loading: boolean
  token: string
}

export default function DashboardPage({ projects, loading, token }: DashboardPageProps) {
  const { tasks, loading: tasksLoading } = useAllTasks(token)
  const { communications, loading: communicationsLoading } = useAllCommunications(token)
  const stats = computeStats(projects)
  const agingBuckets = computeAging(projects)
  const today = new Date().toISOString().slice(0, 10)
  const unpaidProjects = projects.filter((project) => project.invoiceStatus !== 'Paid')
  const outstandingBalance = unpaidProjects.reduce((sum, project) => sum + (project.amount ?? 0), 0)
  const documentsReadyCount = projects.filter((project) => project.contractStatus === 'Signed' && project.cocStatus === 'Signed').length
  const recentProjects = [...projects]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  const followUpQueue = unpaidProjects
    .map((project) => {
      const lastComm = communications.find((c) => c.projectId === project.id)
      return {
        project,
        followUpDate: project.nextFollowUpDate ?? project.dueDate,
        priority: computePriorityScore(project, lastComm?.updatedAt.slice(0, 10) ?? null, today),
      }
    })
    .filter((item) => item.followUpDate !== null)
    .sort((a, b) => b.priority - a.priority || a.followUpDate!.localeCompare(b.followUpDate!))

  const followUpTodayCount = followUpQueue.filter((item) => item.followUpDate === today).length
  const followUpThisWeekCount = followUpQueue.filter((item) => {
    if (!item.followUpDate) {
      return false
    }

    const diff = Math.floor(
      (new Date(`${item.followUpDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000,
    )
    return diff >= 0 && diff <= 7
  }).length

  const openTasks = tasks.filter((task) => !task.completed)
  const dueTasks = openTasks
    .filter((task) => task.dueDate && task.dueDate <= today)
    .slice(0, 8)

  const recentCommunications = communications.slice(0, 6)
  const recentContactCount = communications.filter((communication) => {
    const diff = Math.floor(
      (new Date(`${today}T12:00:00`).getTime() - new Date(communication.updatedAt).getTime()) / 86400000,
    )
    return diff <= 7
  }).length

  const staleCollectionsCount = unpaidProjects.filter((project) => {
    const lastCommunication = communications.find((communication) => communication.projectId === project.id)
    if (!lastCommunication) {
      return true
    }

    const diff = Math.floor(
      (new Date(`${today}T12:00:00`).getTime() - new Date(lastCommunication.updatedAt).getTime()) / 86400000,
    )
    return diff > 7
  }).length

  if (loading || tasksLoading || communicationsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.5fr_0.8fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Operations snapshot</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Claims, collections, task load, and communication cadence in one board.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Keep unpaid invoices moving, surface stale follow-up, and make it obvious which jobs need new outreach or internal action today.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/projects"
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                Open projects
              </Link>
              <Link
                to="/reports"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                View reports
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <SummaryPanel
              label="Collections due now"
              value={followUpQueue.filter((item) => item.followUpDate! <= today).length.toString()}
              detail={`${followUpTodayCount} today · ${followUpThisWeekCount} this week`}
            />
            <SummaryPanel
              label="Stale collections contact"
              value={staleCollectionsCount.toString()}
              detail={`${recentContactCount} communications logged in the last 7 days`}
            />
          </div>
        </div>
      </section>

      <AiBriefing token={token} />

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active projects"
          value={stats.activeCount.toString()}
          emphasis={`${stats.totalProjects} total`}
          icon={BanknotesIcon}
          tone="neutral"
        />
        <MetricCard
          title="Outstanding balance"
          value={`$${outstandingBalance.toLocaleString()}`}
          emphasis={`${unpaidProjects.length} unpaid jobs`}
          icon={ArrowTrendingUpIcon}
          tone="positive"
        />
        <MetricCard
          title="Overdue invoices"
          value={stats.overdueCount.toString()}
          emphasis={`${followUpTodayCount} due today`}
          icon={ExclamationTriangleIcon}
          tone="alert"
        />
        <MetricCard
          title="Missing docs"
          value={(stats.missingContracts + stats.missingCOCs).toString()}
          emphasis={`${stats.missingContracts} contracts · ${stats.missingCOCs} COCs`}
          icon={DocumentMagnifyingGlassIcon}
          tone="warning"
        />
      </dl>

      <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Collections queue</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Who needs a reminder next</h3>
              <p className="mt-2 text-sm text-slate-600">Sorted by next follow-up date, falling back to due date.</p>
            </div>
            <Link to="/calendar" className="text-sm font-semibold text-primary hover:text-primary-hover">
              Open calendar
            </Link>
          </div>

          {followUpQueue.length === 0 ? (
            <div className="py-12 text-sm text-slate-500">No unpaid projects with follow-up dates are scheduled yet.</div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-900">Client</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Project</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-900">Amount</th>
                    <th className="px-4 py-3 font-semibold text-slate-900">Next action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {followUpQueue.slice(0, 8).map(({ project, followUpDate, priority }) => {
                    const priorityInfo = getPriorityLabel(priority)
                    return (
                    <tr key={project.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/projects/${project.id}`} className="font-semibold text-slate-900 hover:text-primary">
                            {project.clientName}
                          </Link>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityInfo.tone}`}>
                            {priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{project.claimNumber || project.xactimateNumber || 'No claim number'}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{project.projectName || project.projectType || 'Uncategorized project'}</td>
                      <td className="px-4 py-4">
                        <StatusPill value={project.invoiceStatus} />
                      </td>
                      <td className="px-4 py-4 text-right font-medium tabular-nums text-slate-900">
                        {project.amount ? `$${project.amount.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <p className={`font-semibold ${followUpTone(followUpDate!, today)}`}>{formatDate(followUpDate!)}</p>
                        <p className="mt-1 text-xs text-slate-500">{followUpLabel(followUpDate!, today)}</p>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Invoice aging</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Outstanding balance by age</h3>
              </div>
              <ArrowTrendingDownIcon className="size-5 text-slate-400" />
            </div>
            <div className="mt-6 space-y-4">
              {agingBuckets.map((bucket) => (
                <div key={bucket.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{bucket.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{bucket.range}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {bucket.count}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                    ${bucket.totalAmount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Readiness</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Document coverage</h3>
              </div>
              <CheckBadgeIcon className="size-5 text-emerald-500" />
            </div>
            <div className="mt-6 space-y-3">
              <ReadinessRow label="Contract signed" value={projects.filter((project) => project.contractStatus === 'Signed').length} total={projects.length} />
              <ReadinessRow label="COC signed" value={projects.filter((project) => project.cocStatus === 'Signed').length} total={projects.length} />
              <ReadinessRow label="Dry logs received" value={projects.filter((project) => project.drylogStatus === 'Received').length} total={projects.length} />
              <ReadinessRow label="Matterport captured" value={projects.filter((project) => project.matterportStatus === 'Has Scan').length} total={projects.length} />
              <ReadinessRow label="Docs ready" value={documentsReadyCount} total={projects.length} />
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Task queue</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Internal work due now</h3>
            </div>
            <ClipboardDocumentListIcon className="size-5 text-slate-400" />
          </div>

          {dueTasks.length === 0 ? (
            <div className="py-12 text-sm text-slate-500">No overdue or due-today tasks are open.</div>
          ) : (
            <ul className="mt-6 space-y-3">
              {dueTasks.map((task) => {
                const project = projects.find((candidate) => candidate.id === task.projectId)
                return (
                  <li key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        {project && (
                          <Link to={`/projects/${project.id}`} className="mt-2 block text-sm text-primary hover:text-primary-hover">
                            {project.clientName}
                          </Link>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {task.assignee || 'Unassigned'}{task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ''}
                        </p>
                      </div>
                      {task.dueDate && <span className="text-xs font-semibold text-rose-700">{followUpLabel(task.dueDate, today)}</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recent communications</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Latest outreach and replies</h3>
            </div>
            <ChatBubbleLeftRightIcon className="size-5 text-slate-400" />
          </div>

          {recentCommunications.length === 0 ? (
            <div className="py-12 text-sm text-slate-500">No communications have been logged yet.</div>
          ) : (
            <ul className="mt-6 space-y-3">
              {recentCommunications.map((communication) => {
                const project = projects.find((candidate) => candidate.id === communication.projectId)
                return (
                  <li key={communication.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{communication.subject || '(No subject)'}</p>
                        {project && (
                          <Link to={`/projects/${project.id}`} className="mt-2 block text-sm text-primary hover:text-primary-hover">
                            {project.clientName}
                          </Link>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {labelize(communication.direction)} {labelize(communication.channel)} · {communication.counterpartName || 'Unknown contact'}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">{formatDate(communication.updatedAt.slice(0, 10))}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Recent projects</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Latest work added to the board</h3>
          </div>
          <Link to="/projects" className="text-sm font-semibold text-primary hover:text-primary-hover">
            View all
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="py-12 text-sm text-slate-500">No projects yet.</div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-primary/40 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                      {getInitials(project.clientName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{project.clientName}</p>
                      <p className="mt-1 truncate text-sm text-slate-600">{project.projectName || project.projectType || 'Project detail'}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {project.claimNumber || 'No claim number'} · Created {formatTimestamp(project.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusPill value={project.invoiceStatus} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-sm">
                  <span className="text-slate-500">Next follow-up</span>
                  <span className={`font-semibold ${followUpTone(project.nextFollowUpDate ?? project.dueDate, today)}`}>
                    {formatDate(project.nextFollowUpDate ?? project.dueDate)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MetricCard({
  title,
  value,
  emphasis,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  emphasis: string
  icon: typeof BanknotesIcon
  tone: 'neutral' | 'positive' | 'alert' | 'warning'
}) {
  const toneClasses = {
    neutral: 'text-slate-600',
    positive: 'text-emerald-600',
    alert: 'text-rose-600',
    warning: 'text-amber-600',
  }

  return (
    <div className="bg-white px-4 py-10 sm:px-6 xl:px-8">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-sm font-medium text-slate-500">{title}</dt>
        <Icon className={`size-5 ${toneClasses[tone]}`} />
      </div>
      <dd className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</dd>
      <dd className={`mt-2 text-xs font-semibold uppercase tracking-[0.18em] ${toneClasses[tone]}`}>{emphasis}</dd>
    </div>
  )
}

function SummaryPanel({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  )
}

function ReadinessRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100)

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        <span className="text-sm font-semibold text-slate-600">{value}/{total}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function formatDate(date: string | null) {
  if (!date) {
    return 'Not scheduled'
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTimestamp(dateTime: string) {
  return new Date(dateTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function followUpTone(date: string | null, today: string) {
  if (!date) {
    return 'text-slate-500'
  }

  if (date < today) {
    return 'text-rose-700'
  }

  if (date === today) {
    return 'text-amber-700'
  }

  return 'text-slate-900'
}

function followUpLabel(date: string, today: string) {
  const diff = Math.floor(
    (new Date(`${date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000,
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

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? '')
    .join('')
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}
