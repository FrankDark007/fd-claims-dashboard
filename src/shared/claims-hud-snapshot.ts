import { computePriorityScore } from './priority'
import type { InvoiceEvent, Project, ProjectCommunication, ProjectTask } from './projects'

export type ClaimsHudRow = {
  kind: 'work' | 'deadline' | 'attention'
  sourceId: 'claims'
  sourceRecordId: string
  sourceWatermark: string
  title: string
  projectName?: string
  clientName?: string
  claimNumber?: string
  amountMinor?: number
  currency?: 'USD'
  status?: string
  owner?: string
  taskTitle?: string
  nextAction?: string
  deadlineAt?: string
  linkState?: 'LINKED' | 'UNLINKED'
}

export type ClaimsHudSnapshot = {
  schema: 'hud.ops.snapshot.v1'
  snapshotVersion: 'claims-projection-v1'
  observedAt: string
  dataUpdatedAt: string
  watermark: string
  consistency: 'COMPLETE'
  staleAfterMs: 30000
  offlineAfterMs: 120000
  errors: []
  rows: ClaimsHudRow[]
}

export type ClaimsProjectionInput = {
  projects: Project[]
  tasks: ProjectTask[]
  communications: ProjectCommunication[]
  invoiceEvents: InvoiceEvent[]
  observedAt: string
}

export function rankClaimProjects(
  projects: Project[],
  communications: ProjectCommunication[],
  today: string,
) {
  return projects.map((project) => {
    const lastCommunicationDate = communications
      .filter((item) => item.projectId === project.id)
      .map((item) => timestamp(item.updatedAt))
      .filter((value): value is string => value !== null)
      .sort()
      .at(-1)
      ?.slice(0, 10) ?? null
    return {
      project,
      followUpDate: project.nextFollowUpDate ?? project.dueDate,
      priority: computePriorityScore(project, lastCommunicationDate, today),
    }
  }).sort((left, right) => right.priority - left.priority
    || (left.followUpDate ?? '9999').localeCompare(right.followUpDate ?? '9999')
    || left.project.id.localeCompare(right.project.id))
}

const UNSAFE_MARKUP_OR_BIDI = /[<>\u202a-\u202e\u2066-\u2069]/
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/

function text(value: string | null | undefined, maximum = 160): string | undefined {
  const normalized = value?.trim().normalize('NFKC')
  const hasControl = [...(normalized ?? '')].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || (code >= 127 && code <= 159)
  })
  if (!normalized || normalized.length > maximum || hasControl || UNSAFE_MARKUP_OR_BIDI.test(normalized)) return undefined
  if (/(?:bearer\s+|api[_-]?key|authorization:|https?:\/\/)/i.test(normalized)) return undefined
  return normalized
}

function stableHash(value: string): string {
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return hash.toString(16).padStart(16, '0')
}

function recordId(prefix: string, value: string): string {
  const candidate = `${prefix}:${value}`
  return SAFE_ID.test(candidate) ? candidate : `${prefix}:${stableHash(value)}`
}

function timestamp(value: string | null | undefined): string | null {
  if (!value) return null
  const candidate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value
  const parsed = Date.parse(candidate)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
}

function latestTimestamp(values: Array<string | null | undefined>, fallback: string): string {
  const valid = values.map(timestamp).filter((value): value is string => value !== null).sort()
  return valid.at(-1) ?? fallback
}

function projectFields(project: Project) {
  const amountMinor = project.amount === null ? undefined : Math.round(project.amount * 100)
  return {
    projectName: text(project.projectName || project.projectType || undefined),
    clientName: text(project.clientName),
    claimNumber: text(project.claimNumber || project.xactimateNumber || undefined),
    amountMinor: amountMinor !== undefined && Number.isSafeInteger(amountMinor) ? amountMinor : undefined,
    currency: amountMinor !== undefined ? 'USD' as const : undefined,
    status: text([project.projectStatus, project.invoiceStatus].filter(Boolean).join(' / ')),
    owner: text(project.projectManagerName),
    linkState: project.invoiceId === null ? 'UNLINKED' as const : 'LINKED' as const,
  }
}

export function buildClaimsHudSnapshot(input: ClaimsProjectionInput): ClaimsHudSnapshot {
  const observedAt = new Date(input.observedAt).toISOString()
  const today = observedAt.slice(0, 10)
  const openProjects = input.projects.filter((project) =>
    !project.done && project.projectStatus !== 'Complete' && project.projectStatus !== 'Archived')
  const tasksByProject = new Map<string, ProjectTask[]>()
  const eventsByProject = new Map<string, InvoiceEvent[]>()

  for (const task of input.tasks) {
    if (!tasksByProject.has(task.projectId)) tasksByProject.set(task.projectId, [])
    tasksByProject.get(task.projectId)?.push(task)
  }
  for (const event of input.invoiceEvents) {
    if (!eventsByProject.has(event.projectId)) eventsByProject.set(event.projectId, [])
    eventsByProject.get(event.projectId)?.push(event)
  }

  const work = rankClaimProjects(openProjects, input.communications, today).map(({ project, priority }) => {
    const openTasks = (tasksByProject.get(project.id) ?? [])
      .filter((task) => !task.completed)
      .sort((left, right) => (left.dueDate ?? '9999').localeCompare(right.dueDate ?? '9999') || left.id.localeCompare(right.id))
    const latestEvent = (eventsByProject.get(project.id) ?? [])
      .sort((left, right) => right.eventDate.localeCompare(left.eventDate) || right.createdAt.localeCompare(left.createdAt))[0]
    const deadlineAt = timestamp(openTasks[0]?.dueDate ?? project.nextFollowUpDate ?? project.dueDate)
    const nextAction = text(openTasks[0]?.title)
      ?? (project.nextFollowUpDate && project.nextFollowUpDate <= today ? 'Complete overdue follow-up' : undefined)
      ?? (latestEvent?.type === 'disputed' ? 'Review invoice dispute' : undefined)
      ?? 'Review project status'
    return { project, openTask: openTasks[0], deadlineAt, priority, nextAction }
  })

  const rawRows: Omit<ClaimsHudRow, 'sourceWatermark'>[] = []
  for (const item of work.slice(0, 24)) {
    rawRows.push({
      kind: 'work', sourceId: 'claims', sourceRecordId: recordId('project', item.project.id),
      title: text(item.project.projectName || item.project.projectType, 120) ?? 'Claims project',
      ...projectFields(item.project), taskTitle: text(item.openTask?.title) ?? 'Project follow-up',
      nextAction: item.nextAction, deadlineAt: item.deadlineAt ?? undefined,
    })
  }

  const deadlineCandidates = [
    ...input.tasks.filter((task) => !task.completed && task.dueDate).map((task) => ({
      id: recordId('deadline-task', task.id), task, project: input.projects.find((project) => project.id === task.projectId),
      deadlineAt: timestamp(task.dueDate) as string,
    })),
    ...openProjects.filter((project) => project.nextFollowUpDate ?? project.dueDate).map((project) => ({
      id: recordId('deadline-project', project.id), task: undefined,
      project, deadlineAt: timestamp(project.nextFollowUpDate ?? project.dueDate) as string,
    })),
  ].sort((left, right) => left.deadlineAt.localeCompare(right.deadlineAt) || left.id.localeCompare(right.id))

  for (const item of deadlineCandidates.slice(0, 20)) {
    const project = item.project
    rawRows.push({
      kind: 'deadline', sourceId: 'claims', sourceRecordId: item.id,
      title: text(item.task?.title ?? project?.projectName ?? project?.projectType, 120) ?? 'Claims deadline',
      ...(project ? projectFields(project) : {}), taskTitle: text(item.task?.title) ?? 'Project follow-up',
      nextAction: text(item.task?.title) ?? 'Complete scheduled follow-up',
      owner: text(item.task?.assignee) ?? (project ? text(project.projectManagerName) : undefined),
      deadlineAt: item.deadlineAt,
    })
  }

  for (const item of deadlineCandidates.filter((candidate) => candidate.deadlineAt.slice(0, 10) <= today).slice(0, 20)) {
    const project = item.project
    rawRows.push({
      kind: 'attention', sourceId: 'claims', sourceRecordId: recordId('attention', item.id),
      title: text(item.task?.title ?? project?.projectName ?? project?.projectType, 120) ?? 'Claims item needs attention',
      ...(project ? projectFields(project) : {}), taskTitle: text(item.task?.title) ?? 'Overdue project follow-up',
      nextAction: text(item.task?.title) ?? 'Complete overdue follow-up',
      owner: text(item.task?.assignee) ?? (project ? text(project.projectManagerName) : undefined),
      deadlineAt: item.deadlineAt,
    })
  }

  const canonicalInputs = JSON.stringify({
    projects: input.projects.map(({ id, updatedAt, projectStatus, invoiceStatus, amount, nextFollowUpDate, dueDate, done }) =>
      ({ id, updatedAt, projectStatus, invoiceStatus, amount, nextFollowUpDate, dueDate, done })),
    tasks: input.tasks.map(({ id, projectId, updatedAt, completed, dueDate }) => ({ id, projectId, updatedAt, completed, dueDate })),
    communications: input.communications.map(({ id, projectId, updatedAt, status, followUpDate }) =>
      ({ id, projectId, updatedAt, status, followUpDate })),
    invoiceEvents: input.invoiceEvents.map(({ id, projectId, createdAt, eventDate, type, amount }) =>
      ({ id, projectId, createdAt, eventDate, type, amount })),
  })
  const watermark = `claims-${observedAt.replace(/\D/g, '')}-${stableHash(canonicalInputs)}`
  const dataUpdatedAt = latestTimestamp([
    ...input.projects.flatMap((project) => [project.updatedAt, project.createdAt]),
    ...input.tasks.flatMap((task) => [task.updatedAt, task.createdAt]),
    ...input.communications.flatMap((communication) => [communication.updatedAt, communication.createdAt]),
    ...input.invoiceEvents.flatMap((event) => [event.createdAt, event.eventDate]),
  ], observedAt)

  const snapshot: ClaimsHudSnapshot = {
    schema: 'hud.ops.snapshot.v1', snapshotVersion: 'claims-projection-v1', observedAt,
    dataUpdatedAt, watermark, consistency: 'COMPLETE', staleAfterMs: 30_000,
    offlineAfterMs: 120_000, errors: [],
    rows: rawRows.slice(0, 64).map((row) => ({ ...row, sourceWatermark: watermark })),
  }
  while (new TextEncoder().encode(JSON.stringify(snapshot)).byteLength > 64 * 1024 && snapshot.rows.length > 0) {
    snapshot.rows.pop()
  }
  return snapshot
}
