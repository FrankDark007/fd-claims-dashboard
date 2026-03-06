import { deleteProjectNote, updateProjectNote } from '../../../_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  const noteId = context.params.noteId as string

  if (!projectId || !noteId) {
    return Response.json({ error: 'Project ID and note ID are required' }, { status: 400 })
  }

  try {
    const body = await context.request.json() as { body?: string; pinned?: boolean }
    const note = await updateProjectNote(context.env.FD_CLAIMS_DB, {
      projectId,
      noteId,
      body: body.body,
      pinned: body.pinned,
    })

    if (!note) {
      return Response.json({ error: 'Note not found' }, { status: 404 })
    }

    return Response.json({ note })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  const noteId = context.params.noteId as string

  if (!projectId || !noteId) {
    return Response.json({ error: 'Project ID and note ID are required' }, { status: 400 })
  }

  const deleted = await deleteProjectNote(context.env.FD_CLAIMS_DB, projectId, noteId)
  if (!deleted) {
    return Response.json({ error: 'Note not found' }, { status: 404 })
  }

  return Response.json({ success: true })
}
