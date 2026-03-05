interface Env {
  NOTION_API_KEY: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as Record<string, any>

    // Notion sends a verification challenge on subscription setup
    if (body.type === 'url_verification') {
      return Response.json({ challenge: body.challenge })
    }

    // Log the event (for now — can add real handling later)
    console.log('Notion webhook event:', JSON.stringify(body).slice(0, 500))

    return Response.json({ ok: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// Notion may send GET to verify the endpoint exists
export const onRequestGet: PagesFunction<Env> = async () => {
  return Response.json({ status: 'webhook active' })
}
