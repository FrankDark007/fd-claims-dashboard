import { seedProjects } from './qa-local-fixtures'

const baseUrl = process.env.FD_LOCAL_BASE_URL || 'http://localhost:3002'
const username = process.env.FD_LOCAL_USERNAME || 'frank'
const password = process.env.FD_LOCAL_PASSWORD || 'codex-local'

type ProjectRecord = {
  claimNumber: string
  invoiceStatus: string | null
  nextFollowUpDate: string | null
}

type InvoiceEventRecord = {
  projectId: string
  type: string
  eventDate: string
  notes: string
}

type ProjectListRecord = ProjectRecord & {
  id: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init)
  const text = await response.text()
  const body = text ? JSON.parse(text) as T | { error?: string } : {} as T

  if (!response.ok) {
    const errorMessage = typeof body === 'object' && body !== null && 'error' in body
      ? body.error
      : text
    throw new Error(`${response.status} ${path}: ${errorMessage || 'Request failed'}`)
  }

  return body as T
}

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  const auth = await request<{ token: string }>('/api/auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const headers = {
    authorization: `Bearer ${auth.token}`,
  }

  const projects = await request<{ projects: ProjectListRecord[] }>('/api/projects', { headers })
  const events = await request<{ events: InvoiceEventRecord[] }>('/api/invoice-events', { headers })

  const byClaimNumber = new Map(projects.projects.map((project) => [project.claimNumber, project]))

  for (const seedProject of seedProjects) {
    const project = byClaimNumber.get(seedProject.claimNumber)
    expect(project, `Missing seeded project ${seedProject.claimNumber}`)

    if (seedProject.claimNumber === 'QA-CLM-1001') {
      expect(project.invoiceStatus === 'Overdue', 'QA-CLM-1001 should read as Overdue')
      expect(project.nextFollowUpDate === '2026-03-09', 'QA-CLM-1001 should keep next follow-up date')
    }

    if (seedProject.claimNumber === 'QA-CLM-1002') {
      expect(project.invoiceStatus === 'Paid', 'QA-CLM-1002 should read as Paid')
      expect(project.nextFollowUpDate === null, 'QA-CLM-1002 should clear next follow-up date')
    }

    if (seedProject.claimNumber === 'QA-CLM-1003') {
      expect(project.invoiceStatus === 'Draft', 'QA-CLM-1003 should stay Draft')
    }

    const projectEvents = events.events.filter((event) => event.projectId === project.id)
    for (const expectedEvent of seedProject.events) {
      expect(
        projectEvents.some((event) => (
          event.type === expectedEvent.type &&
          event.eventDate === expectedEvent.date &&
          event.notes === expectedEvent.notes
        )),
        `Missing ${expectedEvent.type} event ${expectedEvent.date} for ${seedProject.claimNumber}`
      )
    }
  }

  console.log(`Verified ${seedProjects.length} QA projects and their expected invoice workflow state.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
