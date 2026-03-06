import { getSessionUser } from './_shared/auth'

export const onRequestGet: PagesFunction = async (context) => {
  const user = getSessionUser(context.request)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({ user })
}
