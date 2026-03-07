import { useMemo } from 'react'
import type { Project } from '../shared/projects'
import type { ProjectTask, ProjectCommunication } from '../shared/projects'
import type { GmailAlert } from './useGmailAlerts'

export type AttentionItemType = 'followup' | 'task' | 'email'
export type AttentionUrgency = 'critical' | 'warning' | 'info'

export interface AttentionItem {
  id: string
  type: AttentionItemType
  urgency: AttentionUrgency
  title: string
  subtitle: string
  context: string
  projectId: string
  clientName: string
  data: {
    project?: Project
    task?: ProjectTask
    alert?: GmailAlert
    daysOverdue?: number
    amount?: number
  }
}

interface UseNeedsAttentionInput {
  projects: Project[]
  tasks: ProjectTask[]
  communications: ProjectCommunication[]
  gmailAlerts: GmailAlert[]
  maxItems?: number
}

export function useNeedsAttention({
  projects,
  tasks,
  communications,
  gmailAlerts,
  maxItems = 10,
}: UseNeedsAttentionInput): AttentionItem[] {
  const today = new Date().toISOString().slice(0, 10)

  return useMemo(() => {
    const items: AttentionItem[] = []

    // 1. Follow-ups due (overdue or due today)
    const unpaidProjects = projects.filter(
      (p) => p.invoiceStatus !== 'Paid' && !p.done && p.projectStatus !== 'Archived',
    )

    for (const project of unpaidProjects) {
      const followUpDate = project.nextFollowUpDate ?? project.dueDate
      if (!followUpDate || followUpDate > today) continue

      const daysOverdue = daysBetween(followUpDate, today)
      const isOverdue = daysOverdue > 0
      const lastComm = communications.find((c) => c.projectId === project.id)
      const lastContactDays = lastComm
        ? daysBetween(lastComm.updatedAt.slice(0, 10), today)
        : null

      items.push({
        id: `followup-${project.id}`,
        type: 'followup',
        urgency: daysOverdue >= 3 ? 'critical' : 'warning',
        title: `${project.clientName} — Follow-up ${isOverdue ? `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue` : 'due today'}`,
        subtitle: [
          project.amount ? `$${project.amount.toLocaleString()}` : null,
          project.invoiceSentDate
            ? `Sent invoice ${daysBetween(project.invoiceSentDate, today)}d ago`
            : null,
          lastContactDays !== null && lastContactDays > 7
            ? 'No recent contact'
            : lastContactDays === null
              ? 'No contact logged'
              : null,
        ]
          .filter(Boolean)
          .join(' · '),
        context: project.claimNumber || project.xactimateNumber || '',
        projectId: project.id,
        clientName: project.clientName,
        data: { project, daysOverdue, amount: project.amount ?? 0 },
      })
    }

    // 2. Overdue / due-today tasks
    const openTasks = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= today)
    for (const task of openTasks) {
      const project = projects.find((p) => p.id === task.projectId)
      const daysOverdue = daysBetween(task.dueDate!, today)

      items.push({
        id: `task-${task.id}`,
        type: 'task',
        urgency: daysOverdue > 0 ? 'warning' : 'info',
        title: `Task: ${task.title}${project ? ` — ${project.clientName}` : ''}`,
        subtitle: [
          daysOverdue > 0 ? `${daysOverdue}d overdue` : 'Due today',
          task.assignee ? `Assigned: ${task.assignee}` : 'Unassigned',
        ].join(' · '),
        context: '',
        projectId: task.projectId,
        clientName: project?.clientName ?? '',
        data: { task, project, daysOverdue },
      })
    }

    // 3. Unread email alerts
    const unreadAlerts = gmailAlerts.filter((a) => !a.read)
    for (const alert of unreadAlerts) {
      const project = projects.find((p) => p.id === alert.projectId)
      items.push({
        id: `email-${alert.id}`,
        type: 'email',
        urgency: alert.urgency >= 4 ? 'warning' : 'info',
        title: `Email: "${alert.subject || '(No subject)'}" — ${alert.fromName || alert.fromAddress}`,
        subtitle: [
          project ? `Matched to: ${project.clientName}` : null,
          formatRelativeTime(alert.createdAt),
        ]
          .filter(Boolean)
          .join(' · '),
        context: '',
        projectId: alert.projectId,
        clientName: project?.clientName ?? alert.clientName ?? '',
        data: { alert, project },
      })
    }

    // Sort: critical first, then warning, then info. Within same urgency, oldest first.
    const urgencyOrder: Record<AttentionUrgency, number> = { critical: 0, warning: 1, info: 2 }
    items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

    return items.slice(0, maxItems)
  }, [projects, tasks, communications, gmailAlerts, today, maxItems])
}

function daysBetween(from: string, to: string): number {
  return Math.floor(
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000,
  )
}

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
