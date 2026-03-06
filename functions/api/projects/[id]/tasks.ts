import { getProjectById, listProjectTasks, replaceProjectTasks } from '../../_shared/project-store'
import type { ProjectTaskWriteInput } from '../../../../src/shared/projects'

interface Env {
  FD_CLAIMS_DB: D1Database
}

function asTaskList(value: unknown): ProjectTaskWriteInput[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((task) => (
    typeof task === 'object' && task !== null
      ? task as ProjectTaskWriteInput
      : {}
  ))
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const tasks = await listProjectTasks(context.env.FD_CLAIMS_DB, projectId)
  return Response.json({ tasks })
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  try {
    const project = await getProjectById(context.env.FD_CLAIMS_DB, projectId)
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await context.request.json() as { tasks?: unknown }
    const tasks = await replaceProjectTasks(
      context.env.FD_CLAIMS_DB,
      projectId,
      asTaskList(body.tasks),
    )

    return Response.json({ tasks })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
