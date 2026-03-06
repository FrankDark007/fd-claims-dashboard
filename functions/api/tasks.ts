import { listAllProjectTasks } from './_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const tasks = await listAllProjectTasks(context.env.FD_CLAIMS_DB)
  return Response.json({ tasks })
}
