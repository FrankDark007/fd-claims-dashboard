import { createInvoiceEvent, listInvoiceEvents } from './_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

// GET /api/invoice-events — fetch all invoice events across all projects
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const events = await listInvoiceEvents(context.env.FD_CLAIMS_DB)
  return Response.json({ events })
}

// POST /api/invoice-events — add an invoice event to a project
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      projectId: string
      type: 'sent' | 'reminder' | 'paid' | 'disputed'
      date: string
      amount: number
      notes?: string
      recipient?: string
    }

    if (!body.projectId || !body.type || !body.date || body.amount == null) {
      return Response.json({ error: 'projectId, type, date, and amount are required' }, { status: 400 })
    }

    const event = await createInvoiceEvent(context.env.FD_CLAIMS_DB, {
      projectId: body.projectId,
      type: body.type,
      amount: body.amount,
      notes: body.notes,
      recipient: body.recipient,
      createdBy: context.request.headers.get('X-User-Display') || 'Unknown',
      eventDate: body.date,
    })

    return Response.json({ event }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
