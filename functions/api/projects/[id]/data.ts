interface Env {
  FD_PROJECTS_DATA: KVNamespace
}

// GET /api/projects/:id/data — fetch all project-specific data from KV
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  const [filesJson, emailsJson, invoiceEventsJson] = await Promise.all([
    context.env.FD_PROJECTS_DATA.get(`project:${projectId}:files`),
    context.env.FD_PROJECTS_DATA.get(`project:${projectId}:emails`),
    context.env.FD_PROJECTS_DATA.get(`project:${projectId}:invoiceEvents`),
  ])

  return Response.json({
    files: filesJson ? JSON.parse(filesJson) : [],
    emails: emailsJson ? JSON.parse(emailsJson) : [],
    invoiceEvents: invoiceEventsJson ? JSON.parse(invoiceEventsJson) : [],
  })
}

// PUT /api/projects/:id/data — update specific project data section
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const projectId = context.params.id as string
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 })
  }

  try {
    const body = await context.request.json() as {
      section: 'files' | 'emails' | 'invoiceEvents'
      data: unknown[]
    }

    if (!body.section || !Array.isArray(body.data)) {
      return Response.json({ error: 'section and data array required' }, { status: 400 })
    }

    const validSections = ['files', 'emails', 'invoiceEvents']
    if (!validSections.includes(body.section)) {
      return Response.json({ error: `Invalid section. Must be one of: ${validSections.join(', ')}` }, { status: 400 })
    }

    await context.env.FD_PROJECTS_DATA.put(
      `project:${projectId}:${body.section}`,
      JSON.stringify(body.data)
    )

    return Response.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
