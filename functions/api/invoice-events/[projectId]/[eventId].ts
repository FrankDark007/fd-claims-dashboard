import { deleteInvoiceEvent, updateInvoiceEvent } from '../../_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const projectId = context.params.projectId as string
  const eventId = context.params.eventId as string

  if (!projectId || !eventId) {
    return Response.json({ error: 'Project ID and event ID are required' }, { status: 400 })
  }

  try {
    const body = await context.request.json() as {
      type?: 'sent' | 'reminder' | 'paid' | 'disputed'
      date?: string
      amount?: number
      notes?: string
      recipient?: string
    }

    const event = await updateInvoiceEvent(context.env.FD_CLAIMS_DB, {
      projectId,
      eventId,
      type: body.type,
      amount: body.amount,
      notes: body.notes,
      recipient: body.recipient,
      eventDate: body.date,
    })

    if (!event) {
      return Response.json({ error: 'Invoice event not found' }, { status: 404 })
    }

    return Response.json({ event })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const projectId = context.params.projectId as string
  const eventId = context.params.eventId as string

  if (!projectId || !eventId) {
    return Response.json({ error: 'Project ID and event ID are required' }, { status: 400 })
  }

  const deleted = await deleteInvoiceEvent(context.env.FD_CLAIMS_DB, projectId, eventId)
  if (!deleted) {
    return Response.json({ error: 'Invoice event not found' }, { status: 404 })
  }

  return Response.json({ ok: true })
}
