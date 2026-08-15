import type { Project } from '../../../src/shared/projects'

export interface EmailPayload {
  messageId: string
  threadId?: string
  from: string
  fromName: string
  subject: string
  bodyText: string
  date: string
}

export interface EmailMatch {
  project: Project
  score: number
  role: 'client' | 'adjuster' | 'pm' | 'unknown'
}

const MATCH_THRESHOLD = 40

export function matchEmailToProjects(
  email: EmailPayload,
  projects: Project[],
): EmailMatch[] {
  const fromLower = email.from.toLowerCase().trim()
  const subjectLower = email.subject.toLowerCase()
  const bodyLower = email.bodyText.toLowerCase()
  const fullText = `${subjectLower} ${bodyLower}`

  const matches: EmailMatch[] = []

  for (const project of projects) {
    let score = 0
    let role: EmailMatch['role'] = 'unknown'

    // Exact email match — client (100pts)
    if (project.clientEmail && fromLower === project.clientEmail.toLowerCase().trim()) {
      score += 100
      role = 'client'
    }

    // Exact email match — adjuster (100pts)
    if (project.adjusterEmail && fromLower === project.adjusterEmail.toLowerCase().trim()) {
      score += 100
      role = 'adjuster'
    }

    // Exact email match — PM (100pts)
    if (project.pmEmail && fromLower === project.pmEmail.toLowerCase().trim()) {
      score += 100
      role = 'pm'
    }

    // Claim number in subject or body (90pts)
    if (project.claimNumber && project.claimNumber.length >= 4) {
      if (fullText.includes(project.claimNumber.toLowerCase())) {
        score += 90
      }
    }

    // Xactimate number in subject or body (90pts)
    if (project.xactimateNumber && project.xactimateNumber.length >= 4) {
      if (fullText.includes(project.xactimateNumber.toLowerCase())) {
        score += 90
      }
    }

    // Client last name in subject (40pts)
    const clientLastName = extractLastName(project.clientName)
    if (clientLastName && clientLastName.length >= 3) {
      if (subjectLower.includes(clientLastName.toLowerCase())) {
        score += 40
      }
    }

    // Adjuster name mention (30pts)
    const adjusterLastName = extractLastName(project.adjusterName)
    if (adjusterLastName && adjusterLastName.length >= 3) {
      if (fullText.includes(adjusterLastName.toLowerCase())) {
        score += 30
      }
    }

    // Carrier mention (20pts)
    if (project.carrier && project.carrier.length >= 3) {
      if (fullText.includes(project.carrier.toLowerCase())) {
        score += 20
      }
    }

    if (score >= MATCH_THRESHOLD) {
      matches.push({ project, score, role })
    }
  }

  return matches.sort((a, b) => b.score - a.score)
}

export function determineRole(
  fromAddress: string,
  project: Project,
): EmailMatch['role'] {
  const from = fromAddress.toLowerCase().trim()
  if (project.clientEmail && from === project.clientEmail.toLowerCase().trim()) return 'client'
  if (project.adjusterEmail && from === project.adjusterEmail.toLowerCase().trim()) return 'adjuster'
  if (project.pmEmail && from === project.pmEmail.toLowerCase().trim()) return 'pm'
  return 'unknown'
}

function extractLastName(fullName: string): string {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : parts[0]
}
