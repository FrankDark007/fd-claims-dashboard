import { parseProjectWriteInput, projectToLegacyClaim } from './_shared/project-http'
import { listProjects, updateProject } from './_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const projects = await listProjects(context.env.FD_CLAIMS_DB)
    const claims = projects.map(projectToLegacyClaim)
    return Response.json(claims)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url)
    const segments = url.pathname.split('/')
    const id = segments[segments.length - 1]

    if (id === 'claims') {
      return Response.json({ error: 'Claim ID required' }, { status: 400 })
    }

    const body = await context.request.json()
    const project = await updateProject(context.env.FD_CLAIMS_DB, id, parseProjectWriteInput(body))
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    return Response.json({ success: true, claim: projectToLegacyClaim(project) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
