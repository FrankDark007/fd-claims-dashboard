import { createProjectCommunication, getProjectById, listProjectCommunications } from '../../_shared/project-store'
import { getUserField } from '../../_shared/auth'
import type { ProjectCommunicationWriteInput } from '../../../../src/shared/projects'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const communications = await listProjectCommunications(context.env.FD_CLAIMS_DB, projectId)
  return Response.json({ communications })
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
    const body = await context.request.json() as ProjectCommunicationWriteInput
    const hasBody = typeof body.body === 'string' && body.body.trim().length > 0
    const hasSubject = typeof body.subject === 'string' && body.subject.trim().length > 0

    if (!hasBody && !hasSubject) {
      return Response.json({ error: 'Communication subject or body is required' }, { status: 400 })
    }

    const communication = await createProjectCommunication(context.env.FD_CLAIMS_DB, {
      projectId,
      ...body,
      createdBy: getUserField(context, 'displayName') || 'Unknown',
    })

    return Response.json({ communication }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
