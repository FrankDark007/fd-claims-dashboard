import { sendEmail } from '../_shared/email'
import { getProjectById, createProjectCommunication, updateProject } from '../_shared/project-store'
import { getUserField } from '../_shared/auth'
import { addDays } from '../../../src/shared/projects'

interface Env {
  FD_CLAIMS_DB: D1Database
  RESEND_API_KEY: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      projectId: string
      to: string
      subject: string
      body: string
    }

    const { projectId, to, subject, body: emailBody } = body

    if (!projectId || !to || !subject || !emailBody) {
      return Response.json({ error: 'projectId, to, subject, and body are required' }, { status: 400 })
    }

    // Validate email
    if (!to.includes('@')) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const project = await getProjectById(context.env.FD_CLAIMS_DB, projectId)
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Send via Resend
    const result = await sendEmail(context.env, { to, subject, body: emailBody })

    const userName = getUserField(context, 'displayName') || 'System'

    // Log as communication
    const communication = await createProjectCommunication(context.env.FD_CLAIMS_DB, {
      projectId,
      channel: 'email',
      direction: 'outbound',
      counterpartName: project.adjusterName || project.projectManagerName || '',
      counterpartRole: to === project.adjusterEmail ? 'Adjuster'
        : to === project.pmEmail ? 'Project Manager'
        : to === project.clientEmail ? 'Client'
        : 'Contact',
      counterpartAddress: to,
      subject,
      body: emailBody,
      status: 'sent',
      followUpDate: addDays(new Date().toISOString().slice(0, 10), 7),
      createdBy: userName,
    })

    // Update project next follow-up date
    const nextFollowUp = addDays(new Date().toISOString().slice(0, 10), 7)
    await updateProject(context.env.FD_CLAIMS_DB, projectId, {
      nextFollowUpDate: nextFollowUp,
    })

    return Response.json({
      success: true,
      emailId: result.id,
      communicationId: communication.id,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return Response.json({ error: message }, { status: 500 })
  }
}
