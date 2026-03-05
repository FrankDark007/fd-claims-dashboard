interface Env {
  NOTION_API_KEY: string
  NOTION_DATABASE_ID: string
}

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

// POST /api/projects/create — create a new project in Notion
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      clientName: string
      project?: string
      projectType?: string
      amount?: number
      notes?: string
      xactimateNumber?: string
      companyCam?: string
      driveFolder?: string
    }

    if (!body.clientName) {
      return Response.json({ error: 'Client name is required' }, { status: 400 })
    }

    // Build Notion properties
    const properties: Record<string, unknown> = {
      'Client Name': {
        title: [{ text: { content: body.clientName } }],
      },
      'Date Added': {
        date: { start: new Date().toISOString().split('T')[0] },
      },
      'Status': {
        select: { name: 'Draft' },
      },
      'Contract': {
        select: { name: 'Missing' },
      },
      'COC': {
        select: { name: 'Missing' },
      },
      'Final Invoice': {
        select: { name: 'Not Started' },
      },
      'Done': {
        checkbox: false,
      },
    }

    if (body.project) {
      properties['Project'] = { rich_text: [{ text: { content: body.project } }] }
    }
    if (body.projectType) {
      properties['Project Type'] = { select: { name: body.projectType } }
    }
    if (body.amount) {
      properties['Amount'] = { number: body.amount }
    }
    if (body.notes) {
      properties['Notes'] = { rich_text: [{ text: { content: body.notes } }] }
    }
    if (body.xactimateNumber) {
      properties['Xactimate #'] = { rich_text: [{ text: { content: body.xactimateNumber } }] }
    }
    if (body.companyCam) {
      properties['CompanyCam'] = { url: body.companyCam }
    }
    if (body.driveFolder) {
      properties['Drive Folder'] = { url: body.driveFolder }
    }

    const res = await fetch(`${NOTION_API}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.NOTION_API_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: context.env.NOTION_DATABASE_ID },
        properties,
      }),
    })

    if (!res.ok) {
      const err = await res.json() as { message?: string }
      return Response.json({ error: err.message || `Notion API ${res.status}` }, { status: res.status })
    }

    const page = await res.json() as { id: string; url: string }
    return Response.json({ id: page.id, url: page.url }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
