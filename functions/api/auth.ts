interface Env {
  DASHBOARD_PASSWORD: string
  AUTH_SECRET: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { password } = await context.request.json() as { password: string }

  if (!password || password !== context.env.DASHBOARD_PASSWORD) {
    return Response.json({ error: 'Invalid password' }, { status: 401 })
  }

  // Create a simple token: base64(timestamp:hash)
  const encoder = new TextEncoder()
  const data = encoder.encode(password + context.env.AUTH_SECRET + 'fd-claims')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const token = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return Response.json({ token })
}
