import { createInvoiceEvent, listInvoiceEvents } from '../../_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const events = await listInvoiceEvents(context.env.FD_CLAIMS_DB, projectId)
  return Response.json({ events })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  try {
    const body = await context.request.json() as {
      type: 'sent' | 'reminder' | 'paid' | 'disputed'
      date: string
      amount: number
      notes?: string
      recipient?: string
    }

    if (!body.type || !body.date || body.amount == null) {
      return Response.json({ error: 'type, date, and amount are required' }, { status: 400 })
    }

    const event = await createInvoiceEvent(context.env.FD_CLAIMS_DB, {
      projectId,
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
