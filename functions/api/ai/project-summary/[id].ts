import { callHaiku } from '../../_shared/ai'
import {
  getProjectById,
  listProjectCommunications,
  listProjectTasks,
  listProjectFiles,
} from '../../_shared/project-store'

interface Env {
  FD_CLAIMS_DB: D1Database
  ANTHROPIC_API_KEY: string
}

const SYSTEM_PROMPT = `You are an operations analyst for Flood Doctor, a water damage restoration company. You summarize individual project status, identify risks, and suggest next actions.

Rules:
- Be specific and actionable
- Focus on collection risk, communication gaps, and document completeness
- Keep the summary under 150 words
- Return ONLY a JSON object with keys: "status" (1-2 sentence summary), "risks" (array of strings, max 3), "nextAction" (string), "communicationSummary" (string)`

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const projectId = context.params.id as string
    if (!projectId) {
      return Response.json({ error: 'Project ID required' }, { status: 400 })
    }

    const [project, communications, tasks, files] = await Promise.all([
      getProjectById(context.env.FD_CLAIMS_DB, projectId),
      listProjectCommunications(context.env.FD_CLAIMS_DB, projectId),
      listProjectTasks(context.env.FD_CLAIMS_DB, projectId),
      listProjectFiles(context.env.FD_CLAIMS_DB, projectId),
    ])

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    const today = new Date().toISOString().slice(0, 10)

    const projectData = [
      `Client: ${project.clientName}`,
      project.projectName ? `Project: ${project.projectName}` : null,
      project.projectType ? `Type: ${project.projectType}` : null,
      project.amount ? `Amount: $${project.amount.toLocaleString()}` : null,
      `Invoice status: ${project.invoiceStatus || 'unknown'}`,
      `Due date: ${project.dueDate || 'not set'}`,
      `Next follow-up: ${project.nextFollowUpDate || 'not scheduled'}`,
      `Contract: ${project.contractStatus || 'unknown'}`,
      `COC: ${project.cocStatus || 'unknown'}`,
      `Dry logs: ${project.drylogStatus || 'unknown'}`,
      `Matterport: ${project.matterportStatus || 'unknown'}`,
      project.carrier ? `Carrier: ${project.carrier}` : null,
      project.claimNumber ? `Claim #: ${project.claimNumber}` : null,
      `Adjuster: ${project.adjusterName || 'not set'}`,
      `PM: ${project.projectManagerName || 'not set'}`,
      `Files uploaded: ${files.length}`,
      `Open tasks: ${tasks.filter((t) => !t.completed).length}/${tasks.length}`,
    ].filter(Boolean).join('\n')

    const commSummary = communications.length > 0
      ? 'Communication history:\n' + communications.slice(0, 8).map((c) =>
          `- ${c.updatedAt.slice(0, 10)}: ${c.direction} ${c.channel} to ${c.counterpartName || 'unknown'} — "${c.subject || '(no subject)'}" [${c.status}]`
        ).join('\n')
      : 'No communications logged.'

    const prompt = `Today is ${today}. Analyze this project and provide a structured summary.

${projectData}

${commSummary}

Return ONLY a JSON object.`

    const raw = await callHaiku(context.env, SYSTEM_PROMPT, prompt, 800)

    let parsed: {
      status: string
      risks: string[]
      nextAction: string
      communicationSummary: string
    }

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? raw)
    } catch {
      parsed = {
        status: raw.slice(0, 200),
        risks: ['Unable to parse AI response'],
        nextAction: 'Review project manually',
        communicationSummary: `${communications.length} communications logged`,
      }
    }

    return Response.json({ summary: parsed })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate summary'
    return Response.json({ error: message }, { status: 500 })
  }
}
