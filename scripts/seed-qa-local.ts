import type { InvoiceEventPayload } from './qa-local-fixtures'
import { seedProjects } from './qa-local-fixtures'

const baseUrl = process.env.FD_LOCAL_BASE_URL || 'http://localhost:3002'
const username = process.env.FD_LOCAL_USERNAME || 'frank'
const password = process.env.FD_LOCAL_PASSWORD || 'codex-local'

type ProjectRecord = {
  id: string
  claimNumber: string
  clientName: string
  projectName: string
}

type InvoiceEventRecord = {
  id: string
  projectId: string
  type: string
  eventDate: string
  notes: string
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

function isMatchingEvent(event: InvoiceEventRecord, candidate: InvoiceEventPayload): boolean {
  return (
    event.type === candidate.type &&
    event.eventDate === candidate.date &&
    event.notes === candidate.notes
  )
}

async function main() {
  const auth = await request<{ token: string }>('/api/auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${auth.token}`,
  }

  const projectList = await request<{ projects: ProjectRecord[] }>('/api/projects', {
    headers,
  })

  const eventList = await request<{ events: InvoiceEventRecord[] }>('/api/invoice-events', {
    headers,
  })

  for (const seedProject of seedProjects) {
    const existing = projectList.projects.find((project) => project.claimNumber === seedProject.claimNumber)

    let projectId = existing?.id
    if (projectId) {
      await request(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(seedProject),
      })
      console.log(`Updated ${seedProject.claimNumber} (${seedProject.clientName})`)
    } else {
      const created = await request<{ project: ProjectRecord }>('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(seedProject),
      })
      projectId = created.project.id
      projectList.projects.push({ ...created.project, claimNumber: seedProject.claimNumber })
      console.log(`Created ${seedProject.claimNumber} (${seedProject.clientName})`)
    }

    const existingEvents = eventList.events.filter((event) => event.projectId === projectId)
    for (const event of seedProject.events) {
      if (existingEvents.some((existingEvent) => isMatchingEvent(existingEvent, event))) {
        continue
      }

      const createdEvent = await request<{ event: InvoiceEventRecord }>('/api/invoice-events', {
        method: 'POST',
        headers,
        body: JSON.stringify({ projectId, ...event }),
      })
      eventList.events.push(createdEvent.event)
      console.log(`Added ${event.type} event for ${seedProject.claimNumber} on ${event.date}`)
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
