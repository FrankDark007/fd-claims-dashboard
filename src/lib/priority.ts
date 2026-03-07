import type { Project } from '../shared/projects'

/**
 * Deterministic priority score for a project.
 * Returns 0–100 where higher = more urgent.
 *
 * Factors:
 *  - Days overdue (40 pts max)
 *  - Invoice amount (20 pts max)
 *  - Communication staleness (20 pts max)
 *  - Missing documents (10 pts max)
 *  - Follow-up pressure (10 pts max)
 */
export function computePriorityScore(
  project: Project,
  lastCommunicationDate: string | null,
  today: string = new Date().toISOString().slice(0, 10),
): number {
  // Paid projects get zero priority
  if (project.invoiceStatus === 'Paid' || project.done) {
    return 0
  }

  let score = 0

  // 1. Days overdue — 40 pts max
  const dueDate = project.dueDate
  if (dueDate && dueDate < today) {
    const overdueDays = daysBetween(dueDate, today)
    score += Math.min(40, Math.round(overdueDays * 0.67)) // ~60 days to hit max
  }

  // 2. Invoice amount — 20 pts max
  const amount = project.amount ?? 0
  if (amount > 0) {
    // Scale: $500 = 2pts, $5k = 10pts, $15k+ = 20pts
    score += Math.min(20, Math.round(amount / 750))
  }

  // 3. Communication staleness — 20 pts max
  if (lastCommunicationDate) {
    const staleDays = daysBetween(lastCommunicationDate, today)
    if (staleDays > 3) {
      score += Math.min(20, Math.round((staleDays - 3) * 0.5))
    }
  } else {
    // No communication at all = max staleness
    score += 20
  }

  // 4. Missing documents — 10 pts max (2.5 per missing doc)
  let missingDocs = 0
  if (project.contractStatus !== 'Signed') missingDocs++
  if (project.cocStatus !== 'Signed') missingDocs++
  if (project.drylogStatus !== 'Received' && project.drylogStatus !== 'N/A') missingDocs++
  if (project.matterportStatus !== 'Has Scan' && project.matterportStatus !== 'N/A') missingDocs++
  score += Math.round(missingDocs * 2.5)

  // 5. Follow-up pressure — 10 pts max
  const followUpDate = project.nextFollowUpDate ?? project.dueDate
  if (followUpDate) {
    const daysUntilFollowUp = daysBetween(today, followUpDate)
    if (daysUntilFollowUp < 0) {
      // Overdue follow-up
      score += Math.min(10, Math.abs(daysUntilFollowUp))
    } else if (daysUntilFollowUp <= 2) {
      // Due soon
      score += 5
    }
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
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000,
  )
}
