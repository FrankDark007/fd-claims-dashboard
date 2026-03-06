import { createProject, listProjects } from './_shared/project-store'
import { parseProjectWriteInput } from './_shared/project-http'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projects = await listProjects(context.env.FD_CLAIMS_DB)
  return Response.json({ projects })
}

export async function handleCreateProject(context: EventContext<Env, string, unknown>) {
  try {
    const body = await context.request.json()
    const input = parseProjectWriteInput(body)

    if (!input.clientName?.trim()) {
      return Response.json({ error: 'Client name is required' }, { status: 400 })
    }

    const project = await createProject(context.env.FD_CLAIMS_DB, input)
    return Response.json({ project }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = handleCreateProject
