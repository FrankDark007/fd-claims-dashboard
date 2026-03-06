const baseUrl = process.env.FD_LOCAL_BASE_URL || 'http://localhost:3002'
const username = process.env.FD_LOCAL_USERNAME || 'frank'
const password = process.env.FD_LOCAL_PASSWORD || 'codex-local'

type ProjectPayload = {
  clientName: string
  projectName: string
  projectType: 'Water Mitigation' | 'Pack-out' | 'Mold Remediation'
  projectStatus: 'Active' | 'On Hold' | 'Complete'
  invoiceStatus: 'Draft' | 'Sent' | 'Paid'
  amount: number
  invoiceSentDate?: string
  dueDate?: string
  nextFollowUpDate?: string | null
  paymentReceivedDate?: string
  claimNumber: string
  carrier: string
  projectManagerName: string
  pmEmail: string
  pmPhone: string
  adjusterName: string
  adjusterEmail: string
  adjusterPhone: string
  notes: string
}

type InvoiceEventPayload = {
  type: 'sent' | 'reminder' | 'paid' | 'disputed'
  date: string
  amount: number
  recipient: string
  notes: string
}

type SeedProject = ProjectPayload & {
  events: InvoiceEventPayload[]
}

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

const seedProjects: SeedProject[] = [
  {
    clientName: 'Ava Robinson',
    projectName: 'Kitchen Mitigation',
    projectType: 'Water Mitigation',
    projectStatus: 'Active',
    invoiceStatus: 'Sent',
    amount: 4825,
    invoiceSentDate: '2026-02-01',
    dueDate: '2026-03-03',
    nextFollowUpDate: '2026-03-09',
    claimNumber: 'QA-CLM-1001',
    carrier: 'Allstate',
    projectManagerName: 'Frank',
    pmEmail: 'frank@flooddoctor.test',
    pmPhone: '555-000-1001',
    adjusterName: 'Mina Patel',
    adjusterEmail: 'mina@example.com',
    adjusterPhone: '555-111-1001',
    notes: 'QA seed: overdue collections project with active follow-up.',
    events: [
      {
        type: 'sent',
        date: '2026-02-01',
        amount: 4825,
        recipient: 'Mina Patel',
        notes: 'QA seed: initial invoice sent',
      },
      {
        type: 'reminder',
        date: '2026-03-02',
        amount: 4825,
        recipient: 'Mina Patel',
        notes: 'QA seed: first reminder after due date',
      },
    ],
  },
  {
    clientName: 'Ben Alvarez',
    projectName: 'Pack-out Complete',
    projectType: 'Pack-out',
    projectStatus: 'Complete',
    invoiceStatus: 'Paid',
    amount: 7600,
    invoiceSentDate: '2026-02-10',
    dueDate: '2026-03-12',
    nextFollowUpDate: null,
    paymentReceivedDate: '2026-02-22',
    claimNumber: 'QA-CLM-1002',
    carrier: 'State Farm',
    projectManagerName: 'Frank',
    pmEmail: 'frank@flooddoctor.test',
    pmPhone: '555-000-1002',
    adjusterName: 'Omar Singh',
    adjusterEmail: 'omar@example.com',
    adjusterPhone: '555-111-1002',
    notes: 'QA seed: paid project for timeline regression coverage.',
    events: [
      {
        type: 'sent',
        date: '2026-02-10',
        amount: 7600,
        recipient: 'Omar Singh',
        notes: 'QA seed: invoice delivered',
      },
      {
        type: 'paid',
        date: '2026-02-22',
        amount: 7600,
        recipient: 'Omar Singh',
        notes: 'QA seed: paid in full',
      },
    ],
  },
  {
    clientName: 'Cara Nguyen',
    projectName: 'Mold Remediation Estimate',
    projectType: 'Mold Remediation',
    projectStatus: 'On Hold',
    invoiceStatus: 'Draft',
    amount: 2150,
    claimNumber: 'QA-CLM-1003',
    carrier: 'Travelers',
    projectManagerName: 'Frank',
    pmEmail: 'frank@flooddoctor.test',
    pmPhone: '555-000-1003',
    adjusterName: 'Ivy Chen',
    adjusterEmail: 'ivy@example.com',
    adjusterPhone: '555-111-1003',
    notes: 'QA seed: draft invoice project for editable financial/contact coverage.',
    events: [],
  },
]

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
