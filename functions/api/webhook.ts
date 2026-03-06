export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = await context.request.json() as { challenge?: string; type?: string }

    if (body.type === 'url_verification') {
      return Response.json({ challenge: body.challenge })
    }

    console.log('Legacy webhook event:', JSON.stringify(body).slice(0, 500))

    return Response.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

export const onRequestGet: PagesFunction = async () => {
  return Response.json({ status: 'webhook active' })
}
