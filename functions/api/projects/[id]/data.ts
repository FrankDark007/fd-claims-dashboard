import { listInvoiceEvents, listProjectFiles } from '../../_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

// GET /api/projects/:id/data — compatibility aggregation during the Milestone 1 migration
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const [files, invoiceEvents] = await Promise.all([
    listProjectFiles(context.env.FD_CLAIMS_DB, projectId),
    listInvoiceEvents(context.env.FD_CLAIMS_DB, projectId),
  ])

  return Response.json({
    files,
    emails: [],
    invoiceEvents,
  })
}

export const onRequestPut: PagesFunction<Env> = async () => {
  return Response.json({ error: 'Deprecated endpoint' }, { status: 405 })
}
