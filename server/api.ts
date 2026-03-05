import express from 'express'
import cors from 'cors'
import { Client } from '@notionhq/client'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env') })

const app = express()
app.use(cors())
app.use(express.json())

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const DATABASE_ID = process.env.NOTION_DATABASE_ID!

function extractText(prop: any): string {
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

app.get('/api/claims', async (_req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
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

    res.json(claims)
  } catch (error: any) {
    console.error('Notion API error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

app.patch('/api/claims/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

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
    if (updates.companyCam !== undefined) properties['CompanyCam'] = { rich_text: [{ text: { content: updates.companyCam } }] }

    await notion.pages.update({ page_id: id, properties })
    res.json({ success: true })
  } catch (error: any) {
    console.error('Update error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Claims API running on http://localhost:${PORT}`)
})
