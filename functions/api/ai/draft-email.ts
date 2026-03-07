import { callHaiku } from '../_shared/ai'
import { getProjectById, listProjectCommunications } from '../_shared/project-store'
import { getUserField } from '../_shared/auth'

interface Env {
  FD_CLAIMS_DB: D1Database
  ANTHROPIC_API_KEY: string
}

const SYSTEM_PROMPT = `You are the billing coordinator for Flood Doctor, a water damage restoration company in New Jersey. You write professional, concise emails to insurance adjusters, project managers, carriers, and clients about invoice payments, document requests, and project updates.

Rules:
- Be polite but direct — these are business collection and project management emails
- Reference specific claim numbers, invoice numbers, and amounts when available
- Keep emails under 200 words
- Use a professional but warm tone
- Sign as "Flood Doctor Billing Team"
- Never use markdown formatting — write plain text emails
- Include a clear call to action`

type TemplateType = 'reminder' | 'document_request' | 'escalation' | 'payment_confirmation'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { projectId: string; templateType: TemplateType }
    const { projectId, templateType } = body

    if (!projectId) {
      return Response.json({ error: 'projectId is required' }, { status: 400 })
    }

    const project = await getProjectById(context.env.FD_CLAIMS_DB, projectId)
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    const communications = await listProjectCommunications(context.env.FD_CLAIMS_DB, projectId)
    const recentComms = communications.slice(0, 5)

    const userName = getUserField(context, 'displayName') || 'Team'

    const templateInstructions: Record<TemplateType, string> = {
      reminder: 'Write a polite but firm invoice payment reminder email. Mention the outstanding amount and due date. Ask for a status update on payment processing.',
      document_request: 'Write an email requesting missing project documents (contract, certificate of completion, dry logs, etc). Explain why these documents are needed to proceed.',
      escalation: 'Write a professional escalation email. The previous outreach has gone unanswered. Express urgency while remaining professional. Mention the aging of the invoice.',
      payment_confirmation: 'Write a thank-you email confirming payment was received. Express appreciation for their business and mention Flood Doctor is available for future needs.',
    }

    const projectContext = [
      `Client: ${project.clientName}`,
      project.projectName ? `Project: ${project.projectName}` : null,
      project.invoiceId ? `Invoice #: ${project.invoiceId}` : null,
      project.amount ? `Amount: $${project.amount.toLocaleString()}` : null,
      project.claimNumber ? `Claim #: ${project.claimNumber}` : null,
      project.carrier ? `Insurance carrier: ${project.carrier}` : null,
      project.adjusterName ? `Adjuster: ${project.adjusterName}` : null,
      project.projectManagerName ? `Project Manager: ${project.projectManagerName}` : null,
      project.invoiceStatus ? `Invoice status: ${project.invoiceStatus}` : null,
      project.dueDate ? `Due date: ${project.dueDate}` : null,
      project.contractStatus ? `Contract: ${project.contractStatus}` : null,
      project.cocStatus ? `COC: ${project.cocStatus}` : null,
      project.drylogStatus ? `Dry logs: ${project.drylogStatus}` : null,
      project.projectType ? `Project type: ${project.projectType}` : null,
    ].filter(Boolean).join('\n')

    const commHistory = recentComms.length > 0
      ? '\n\nRecent communication history:\n' + recentComms.map((c) =>
          `- ${c.updatedAt.slice(0, 10)}: ${c.direction} ${c.channel} to ${c.counterpartName || 'unknown'} — ${c.subject || c.body?.slice(0, 80) || '(no content)'} [${c.status}]`
        ).join('\n')
      : '\n\nNo previous communications logged.'

    const prompt = `${templateInstructions[templateType] || templateInstructions.reminder}

Project details:
${projectContext}
${commHistory}

User sending this: ${userName}

Return ONLY a JSON object with exactly these keys: "subject", "body", "to"
- "to" should be the most appropriate email address for this type of communication
- "body" should be the full email text (plain text, no markdown)
- "subject" should be concise and professional`

    const raw = await callHaiku(context.env, SYSTEM_PROMPT, prompt, 1024)

    // Parse JSON from response
    let parsed: { subject: string; body: string; to: string }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? raw)
    } catch {
      // Fallback: use raw text as body
      parsed = {
        subject: `${templateType === 'reminder' ? 'Invoice Reminder' : templateType === 'document_request' ? 'Document Request' : templateType === 'escalation' ? 'Follow-Up Required' : 'Payment Confirmation'} — ${project.clientName}`,
        body: raw,
        to: project.adjusterEmail || project.pmEmail || project.clientEmail || '',
      }
    }

    return Response.json({
      subject: parsed.subject,
      body: parsed.body,
      to: parsed.to,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate draft'
    return Response.json({ error: message }, { status: 500 })
  }
}
