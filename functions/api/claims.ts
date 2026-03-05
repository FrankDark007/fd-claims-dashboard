interface Env {
  NOTION_API_KEY: string
  NOTION_DATABASE_ID: string
}

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

function notionHeaders(apiKey: string) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

function extractText(prop: any): any {
  if (!prop) return ''
  if (prop.type === 'title') return prop.title?.map((t: any) => t.plain_text).join('') || ''
  if (prop.type === 'rich_text') return prop.rich_text?.map((t: any) => t.plain_text).join('') || ''
  if (prop.type === 'number') return prop.number
  if (prop.type === 'select') return prop.select?.name || null
  if (prop.type === 'checkbox') return prop.checkbox
  if (prop.type === 'url') return prop.url || ''
  if (prop.type === 'date') return prop.date?.start || null
  if (prop.type === 'unique_id') return prop.unique_id?.number || null
  return ''
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    let allResults: any[] = []
    let hasMore = true
    let startCursor: string | undefined = undefined

    while (hasMore) {
      const body: any = {
        sorts: [{ property: 'Date Added', direction: 'descending' }],
        page_size: 100,
      }
      if (startCursor) body.start_cursor = startCursor

      const res = await fetch(`${NOTION_API}/databases/${context.env.NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        headers: notionHeaders(context.env.NOTION_API_KEY),
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json() as { message?: string }
        return Response.json({ error: err.message || `Notion API ${res.status}` }, { status: res.status })
      }

      const data = await res.json() as { results: any[]; has_more: boolean; next_cursor: string | null }
      allResults = allResults.concat(data.results)
      hasMore = data.has_more
      startCursor = data.next_cursor || undefined
    }

    const claims = allResults.map((page: any) => {
      const p = page.properties
      return {
        id: page.id,
        notionUrl: page.url,
        clientName: extractText(p['Client Name']),
        invoiceId: extractText(p['Invoice ID']),
        project: extractText(p['Project']),
        projectType: extractText(p['Project Type']),
        amount: extractText(p['Amount']),
        status: extractText(p['Status']),
        contract: extractText(p['Contract']),
        coc: extractText(p['COC']),
        finalInvoice: extractText(p['Final Invoice']),
        companyCam: extractText(p['CompanyCam']),
        matterport: extractText(p['Matterport']),
        rewriteStatus: extractText(p['Rewrite Status']),
        xactimateNumber: extractText(p['Xactimate #']),
        dateAdded: extractText(p['Date Added']),
        driveFolder: extractText(p['Drive Folder']),
        notes: extractText(p['Notes']),
        done: extractText(p['Done']),
      }
    })

    return Response.json(claims)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
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

    const updates = await context.request.json() as Record<string, any>
    const properties: Record<string, any> = {}

    if (updates.status) properties['Status'] = { select: { name: updates.status } }
    if (updates.contract) properties['Contract'] = { select: { name: updates.contract } }
    if (updates.coc) properties['COC'] = { select: { name: updates.coc } }
    if (updates.finalInvoice) properties['Final Invoice'] = { select: { name: updates.finalInvoice } }
    if (updates.matterport) properties['Matterport'] = { select: { name: updates.matterport } }
    if (updates.rewriteStatus) properties['Rewrite Status'] = { select: { name: updates.rewriteStatus } }
    if (updates.done !== undefined) properties['Done'] = { checkbox: updates.done }
    if (updates.amount !== undefined) properties['Amount'] = { number: updates.amount }
    if (updates.notes !== undefined) properties['Notes'] = { rich_text: [{ text: { content: updates.notes } }] }

    const res = await fetch(`${NOTION_API}/pages/${id}`, {
      method: 'PATCH',
      headers: notionHeaders(context.env.NOTION_API_KEY),
      body: JSON.stringify({ properties }),
    })

    if (!res.ok) {
      const err = await res.json() as { message?: string }
      return Response.json({ error: err.message }, { status: res.status })
    }

    return Response.json({ success: true })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
