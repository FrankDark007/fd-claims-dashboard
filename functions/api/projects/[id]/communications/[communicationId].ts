import { deleteProjectCommunication, updateProjectCommunication } from '../../../_shared/project-store'
import type { ProjectCommunicationWriteInput } from '../../../../../src/shared/projects'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  const communicationId = context.params.communicationId as string

  if (!projectId || !communicationId) {
    return Response.json({ error: 'Project ID and communication ID are required' }, { status: 400 })
  }

  try {
    const body = await context.request.json() as ProjectCommunicationWriteInput
    const communication = await updateProjectCommunication(context.env.FD_CLAIMS_DB, {
      projectId,
      communicationId,
      input: body,
    })

    if (!communication) {
      return Response.json({ error: 'Communication not found' }, { status: 404 })
    }

    return Response.json({ communication })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  const communicationId = context.params.communicationId as string

  if (!projectId || !communicationId) {
    return Response.json({ error: 'Project ID and communication ID are required' }, { status: 400 })
  }

  const deleted = await deleteProjectCommunication(context.env.FD_CLAIMS_DB, projectId, communicationId)
  if (!deleted) {
    return Response.json({ error: 'Communication not found' }, { status: 404 })
  }

  return Response.json({ success: true })
}
