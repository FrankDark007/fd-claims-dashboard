import { Resend } from 'resend'

interface EmailEnv {
  RESEND_API_KEY: string
}

interface SendEmailInput {
  to: string
  from?: string
  subject: string
  body: string
}

export async function sendEmail(
  env: EmailEnv,
  input: SendEmailInput,
): Promise<{ id: string }> {
  const resend = new Resend(env.RESEND_API_KEY)

  const { data, error } = await resend.emails.send({
    from: input.from ?? 'Flood Doctor Claims <claims@mail.flood.doctor>',
    to: [input.to],
    subject: input.subject,
    text: input.body,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }

  return { id: data?.id ?? 'unknown' }
}
