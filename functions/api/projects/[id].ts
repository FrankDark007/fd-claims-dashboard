import { getProjectById, updateProject } from '../_shared/project-store'
import { parseProjectWriteInput } from '../_shared/project-http'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const project = await getProjectById(context.env.FD_CLAIMS_DB, projectId)
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  return Response.json({ project })
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  try {
    const body = await context.request.json()
    const project = await updateProject(context.env.FD_CLAIMS_DB, projectId, parseProjectWriteInput(body))

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    return Response.json({ project })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
