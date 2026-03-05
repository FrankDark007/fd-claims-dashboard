import { Client } from '@notionhq/client'

interface Env {
  NOTION_API_KEY: string
  NOTION_DATABASE_ID: string
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
    const notion = new Client({ auth: context.env.NOTION_API_KEY })

    const response = await notion.databases.query({
      database_id: context.env.NOTION_DATABASE_ID,
      sorts: [{ property: 'Date Added', direction: 'descending' }],
    })

    const claims = response.results.map((page: any) => {
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
    const notion = new Client({ auth: context.env.NOTION_API_KEY })
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

    await notion.pages.update({ page_id: id, properties })
    return Response.json({ success: true })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
