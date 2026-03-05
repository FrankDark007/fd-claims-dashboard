interface Env {
  FD_PROJECTS_DATA: KVNamespace
}

interface InvoiceEvent {
  id: string
  type: 'sent' | 'reminder' | 'paid' | 'disputed'
  date: string
  amount: number
  notes: string
  createdBy: string
}

interface InvoiceEventWithProject extends InvoiceEvent {
  projectId: string
}

// GET /api/invoice-events — fetch all invoice events across all projects
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const allEvents: InvoiceEventWithProject[] = []

  // List all KV keys with invoiceEvents suffix
  let cursor: string | undefined
  const projectIds: string[] = []

  // First, find all project keys that have invoice events
  do {
    const list = await context.env.FD_PROJECTS_DATA.list({
      prefix: 'project:',
      cursor,
    })

    for (const key of list.keys) {
      if (key.name.endsWith(':invoiceEvents')) {
        // Extract project ID from key like "project:abc123:invoiceEvents"
        const parts = key.name.split(':')
        if (parts.length === 3) {
          projectIds.push(parts[1])
        }
      }
    }

    cursor = list.list_complete ? undefined : list.cursor
  } while (cursor)

  // Fetch all invoice events in parallel (batch of 10)
  const batchSize = 10
  for (let i = 0; i < projectIds.length; i += batchSize) {
    const batch = projectIds.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(pid => context.env.FD_PROJECTS_DATA.get(`project:${pid}:invoiceEvents`))
    )

    for (let j = 0; j < results.length; j++) {
      const json = results[j]
      if (json) {
        const events: InvoiceEvent[] = JSON.parse(json)
        for (const event of events) {
          allEvents.push({ ...event, projectId: batch[j] })
        }
      }
    }
  }

  // Sort by date descending
  allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return Response.json({ events: allEvents })
}

// POST /api/invoice-events — add an invoice event to a project
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as {
    projectId: string
    type: 'sent' | 'reminder' | 'paid' | 'disputed'
    date: string
    amount: number
    notes?: string
  }

  if (!body.projectId || !body.type || !body.date || body.amount == null) {
    return Response.json({ error: 'projectId, type, date, and amount are required' }, { status: 400 })
  }

  const validTypes = ['sent', 'reminder', 'paid', 'disputed']
  if (!validTypes.includes(body.type)) {
    return Response.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
  }

  const kvKey = `project:${body.projectId}:invoiceEvents`
  const existingJson = await context.env.FD_PROJECTS_DATA.get(kvKey)
  const events: InvoiceEvent[] = existingJson ? JSON.parse(existingJson) : []

  const newEvent: InvoiceEvent = {
    id: crypto.randomUUID(),
    type: body.type,
    date: body.date,
    amount: body.amount,
    notes: body.notes || '',
    createdBy: context.request.headers.get('X-User-Display') || 'Unknown',
  }

  events.push(newEvent)
  await context.env.FD_PROJECTS_DATA.put(kvKey, JSON.stringify(events))

  return Response.json({ event: { ...newEvent, projectId: body.projectId } }, { status: 201 })
}
