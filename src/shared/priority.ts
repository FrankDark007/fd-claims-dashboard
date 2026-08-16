import type { Project } from './projects'

export function computePriorityScore(
  project: Project,
  lastCommunicationDate: string | null,
  today: string = new Date().toISOString().slice(0, 10),
): number {
  if (project.invoiceStatus === 'Paid' || project.done) return 0

  let score = 0
  if (project.dueDate && project.dueDate < today) {
    score += Math.min(40, Math.round(daysBetween(project.dueDate, today) * 0.67))
  }
  if ((project.amount ?? 0) > 0) score += Math.min(20, Math.round((project.amount ?? 0) / 750))
  if (lastCommunicationDate) {
    const staleDays = daysBetween(lastCommunicationDate, today)
    if (staleDays > 3) score += Math.min(20, Math.round((staleDays - 3) * 0.5))
  } else {
    score += 20
  }

  let missingDocuments = 0
  if (project.contractStatus !== 'Signed') missingDocuments += 1
  if (project.cocStatus !== 'Signed') missingDocuments += 1
  if (project.drylogStatus !== 'Received' && project.drylogStatus !== 'N/A') missingDocuments += 1
  if (project.matterportStatus !== 'Has Scan' && project.matterportStatus !== 'N/A') missingDocuments += 1
  score += Math.round(missingDocuments * 2.5)

  const followUpDate = project.nextFollowUpDate ?? project.dueDate
  if (followUpDate) {
    const daysUntilFollowUp = daysBetween(today, followUpDate)
    if (daysUntilFollowUp < 0) score += Math.min(10, Math.abs(daysUntilFollowUp))
    else if (daysUntilFollowUp <= 2) score += 5
  }
  return Math.min(100, score)
}

export function getPriorityLabel(score: number): { text: string; tone: string } {
  if (score >= 70) return { text: 'Critical', tone: 'bg-rose-100 text-rose-700' }
  if (score >= 45) return { text: 'High', tone: 'bg-amber-100 text-amber-700' }
  if (score >= 20) return { text: 'Medium', tone: 'bg-sky-100 text-sky-700' }
  if (score > 0) return { text: 'Low', tone: 'bg-slate-100 text-slate-600' }
  return { text: 'None', tone: 'bg-emerald-100 text-emerald-700' }
}

function daysBetween(from: string, to: string): number {
  return Math.floor(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000,
  )
}
