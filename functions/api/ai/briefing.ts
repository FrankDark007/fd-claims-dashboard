import { callSonnet } from '../_shared/ai'
import { listProjects, listProjectCommunications, listAllProjectTasks } from '../_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
  FD_AI_CACHE: KVNamespace
  ANTHROPIC_API_KEY: string
}

const SYSTEM_PROMPT = `You are the operations manager for Flood Doctor, a water damage restoration company in New Jersey. You analyze all active projects and produce a daily action briefing.

Rules:
- Focus on the 5 most important actions for today
- Be specific: name clients, amounts, deadlines
- Prioritize overdue invoices, stale communications, and missing documents
- Keep each action item to 1-2 sentences
- Use plain language, no jargon
- Format as a JSON array of objects with keys: "priority" (1-5), "action" (string), "reason" (string), "projectId" (string or null)`

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url)
    const forceRefresh = url.searchParams.get('refresh') === '1'
    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = `briefing:${today}`

    // Check cache unless force refresh
    if (!forceRefresh && context.env.FD_AI_CACHE) {
      const cached = await context.env.FD_AI_CACHE.get(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        return Response.json({ ...parsed, cached: true })
      }
    }

    // Gather data
    const [projects, communications, tasks] = await Promise.all([
      listProjects(context.env.FD_CLAIMS_DB),
      listProjectCommunications(context.env.FD_CLAIMS_DB),
      listAllProjectTasks(context.env.FD_CLAIMS_DB),
    ])

    const activeProjects = projects.filter(
      (p) => p.projectStatus !== 'Complete' && p.projectStatus !== 'Archived' && !p.done,
    )

    const unpaidProjects = activeProjects.filter((p) => p.invoiceStatus !== 'Paid')

    // Build project summaries for the prompt
    const projectSummaries = unpaidProjects.map((p) => {
      const projectComms = communications.filter((c) => c.projectId === p.id)
      const lastComm = projectComms[0]
      const projectTasks = tasks.filter((t) => t.projectId === p.id && !t.completed)

      return [
        `- ${p.clientName} (ID: ${p.id})`,
        `  Amount: ${p.amount ? `$${p.amount.toLocaleString()}` : 'unknown'}`,
        `  Invoice: ${p.invoiceStatus || 'unknown'}, Due: ${p.dueDate || 'not set'}`,
        `  Follow-up: ${p.nextFollowUpDate || 'not scheduled'}`,
        `  Contract: ${p.contractStatus || 'unknown'}, COC: ${p.cocStatus || 'unknown'}`,
        `  Carrier: ${p.carrier || 'unknown'}`,
        `  Last contact: ${lastComm ? `${lastComm.updatedAt.slice(0, 10)} (${lastComm.channel} ${lastComm.direction})` : 'never'}`,
        projectTasks.length > 0 ? `  Open tasks: ${projectTasks.length}` : null,
      ].filter(Boolean).join('\n')
    }).join('\n\n')

    const prompt = `Today is ${today}. Here are all ${unpaidProjects.length} unpaid active projects (${activeProjects.length} total active, ${projects.length} total):

${projectSummaries}

What are the 5 most important actions to take today? Return ONLY a JSON array.`

    const raw = await callSonnet(context.env, SYSTEM_PROMPT, prompt, 1500)

    let items: Array<{ priority: number; action: string; reason: string; projectId: string | null }>
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      items = JSON.parse(jsonMatch?.[0] ?? '[]')
    } catch {
      items = [{ priority: 1, action: raw.slice(0, 200), reason: 'AI response parsing issue', projectId: null }]
    }

    const result = {
      items,
      generatedAt: new Date().toISOString(),
      stats: {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        unpaidProjects: unpaidProjects.length,
      },
    }

    // Cache for 4 hours
    if (context.env.FD_AI_CACHE) {
      await context.env.FD_AI_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 4 * 60 * 60,
      })
    }

    return Response.json({ ...result, cached: false })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate briefing'
    return Response.json({ error: message }, { status: 500 })
  }
}
