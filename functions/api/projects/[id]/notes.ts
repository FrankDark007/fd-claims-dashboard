import { createProjectNote, getProjectById, listProjectNotes } from '../../_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const notes = await listProjectNotes(context.env.FD_CLAIMS_DB, projectId)
  return Response.json({ notes })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const project = await getProjectById(context.env.FD_CLAIMS_DB, projectId)
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  try {
    const body = await context.request.json() as { body?: string; pinned?: boolean }
    if (!body.body?.trim()) {
      return Response.json({ error: 'Note body is required' }, { status: 400 })
    }

    const note = await createProjectNote(context.env.FD_CLAIMS_DB, {
      projectId,
      body: body.body,
      pinned: body.pinned,
      createdBy: context.request.headers.get('X-User-Display') || 'Unknown',
    })

    return Response.json({ note }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
