import { listProjectCommunications } from './_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const communications = await listProjectCommunications(context.env.FD_CLAIMS_DB)
  return Response.json({ communications })
}
