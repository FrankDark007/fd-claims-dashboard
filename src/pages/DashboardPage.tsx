import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowTrendingDownIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import type { Project } from '../types/claim'
import { computeStats, computeAging } from '../hooks/useProjects'
import { useAllCommunications, useAllTasks } from '../hooks/useOperationalQueues'
import StatusPill from '../components/StatusPill'
import AiBriefing from '../components/AiBriefing'
import TodayFocusBar from '../components/TodayFocusBar'
import NeedsAttentionQueue from '../components/NeedsAttentionQueue'
import CollapsibleSection from '../components/CollapsibleSection'
import { useGmailAlerts } from '../hooks/useGmailAlerts'
import { useNeedsAttention } from '../hooks/useNeedsAttention'
import { computePriorityScore, getPriorityLabel } from '../lib/priority'

interface DashboardPageProps {
  projects: Project[]
  loading: boolean
  token: string
}

export default function DashboardPage({ projects, loading, token }: DashboardPageProps) {
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useAllTasks(token)
  const { communications, loading: communicationsLoading } = useAllCommunications(token)
  const { alerts: gmailAlerts, unreadCount, markAsRead: markGmailRead } = useGmailAlerts(token)
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

  const followUpsDueCount = followUpQueue.filter((item) => item.followUpDate! <= today).length
  const overdueTasksCount = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= today).length

  // Needs Attention queue
  const attentionItems = useNeedsAttention({
    projects,
    tasks,
    communications,
    gmailAlerts,
  })

  const handleCompleteTask = useCallback(async (taskId: string, projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId)
    const updatedTasks = projectTasks.map((t) =>
      t.id === taskId ? { ...t, completed: true } : t,
    )

    await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks: updatedTasks }),
    })

    refetchTasks()
  }, [tasks, token, refetchTasks])

  const handleDismissAlert = useCallback((alertId: string) => {
    markGmailRead([alertId])
  }, [markGmailRead])

  const openTasks = tasks.filter((task) => !task.completed)
  const dueTasks = openTasks
    .filter((task) => task.dueDate && task.dueDate <= today)
    .slice(0, 8)

  const recentCommunications = communications.slice(0, 6)

  if (loading || tasksLoading || communicationsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tier 1: Today's Focus KPI Bar */}
      <TodayFocusBar
        userName="Frank"
        followUpsDueCount={followUpsDueCount}
        overdueTasksCount={overdueTasksCount}
        unreadAlertCount={unreadCount}
        outstandingBalance={outstandingBalance}
      />

      {/* Tier 2: Needs Attention + AI Briefing */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <NeedsAttentionQueue
          items={attentionItems}
          token={token}
          onCompleteTask={handleCompleteTask}
          onDismissAlert={handleDismissAlert}
        />

        <div className="space-y-6">
          <AiBriefing token={token} defaultExpanded />

          {/* Compact Invoice Aging */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Invoice aging</p>
                <h3 className="mt-1 text-base font-semibold text-slate-950">Outstanding by age</h3>
              </div>
              <ArrowTrendingDownIcon className="size-5 text-slate-400" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {agingBuckets.map((bucket) => (
                <div key={bucket.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">{bucket.label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">
                    ${bucket.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    {bucket.count} project{bucket.count === 1 ? '' : 's'} · {bucket.range}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Compact Document Readiness */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Readiness</p>
                <h3 className="mt-1 text-base font-semibold text-slate-950">Document coverage</h3>
              </div>
              <CheckBadgeIcon className="size-5 text-emerald-500" />
            </div>
            <div className="mt-4 space-y-2">
              <ReadinessRow label="Contract signed" value={projects.filter((project) => project.contractStatus === 'Signed').length} total={projects.length} />
              <ReadinessRow label="COC signed" value={projects.filter((project) => project.cocStatus === 'Signed').length} total={projects.length} />
              <ReadinessRow label="Dry logs received" value={projects.filter((project) => project.drylogStatus === 'Received').length} total={projects.length} />
              <ReadinessRow label="Matterport captured" value={projects.filter((project) => project.matterportStatus === 'Has Scan').length} total={projects.length} />
              <ReadinessRow label="Docs ready" value={documentsReadyCount} total={projects.length} />
            </div>
          </section>
        </div>
      </div>

      {/* Tier 3: Collapsible Reference Sections */}
      <CollapsibleSection
        title="Collections queue"
        summary={`${followUpQueue.length} projects · $${outstandingBalance.toLocaleString()} outstanding`}
        icon={<ClipboardDocumentListIcon className="size-5 text-slate-400" />}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="text-sm text-slate-600">Sorted by priority score, then next follow-up date.</p>
          <Link to="/calendar" className="text-sm font-semibold text-primary hover:text-primary-hover">
            Open calendar
          </Link>
        </div>

        {followUpQueue.length === 0 ? (
          <div className="py-8 text-sm text-slate-500">No unpaid projects with follow-up dates are scheduled yet.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
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
                      {project.amount ? `$${project.amount.toLocaleString()}` : '\u2014'}
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
      </CollapsibleSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <CollapsibleSection
          title="Task queue"
          summary={`${dueTasks.length} overdue or due today`}
          icon={<ClipboardDocumentListIcon className="size-5 text-slate-400" />}
        >
          {dueTasks.length === 0 ? (
            <div className="py-8 text-sm text-slate-500">No overdue or due-today tasks are open.</div>
          ) : (
            <ul className="space-y-3">
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
                          {task.assignee || 'Unassigned'}{task.dueDate ? ` \u00b7 Due ${formatDate(task.dueDate)}` : ''}
                        </p>
                      </div>
                      {task.dueDate && <span className="text-xs font-semibold text-rose-700">{followUpLabel(task.dueDate, today)}</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Recent communications"
          summary={`${recentCommunications.length} logged`}
          icon={<ChatBubbleLeftRightIcon className="size-5 text-slate-400" />}
        >
          {recentCommunications.length === 0 ? (
            <div className="py-8 text-sm text-slate-500">No communications have been logged yet.</div>
          ) : (
            <ul className="space-y-3">
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
                          {labelize(communication.direction)} {labelize(communication.channel)} \u00b7 {communication.counterpartName || 'Unknown contact'}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">{formatDate(communication.updatedAt.slice(0, 10))}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        title="Recent projects"
        summary={`${recentProjects.length} latest of ${stats.totalProjects} total`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="text-sm text-slate-600">Latest work added to the board.</p>
          <Link to="/projects" className="text-sm font-semibold text-primary hover:text-primary-hover">
            View all
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="py-8 text-sm text-slate-500">No projects yet.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
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
                        {project.claimNumber || 'No claim number'} \u00b7 Created {formatTimestamp(project.createdAt)}
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
      </CollapsibleSection>
    </div>
  )
}

function ReadinessRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100)

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        <span className="text-xs font-semibold text-slate-600">{value}/{total}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-200">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${percent}%` }} />
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
