import Anthropic from '@anthropic-ai/sdk'

interface AiEnv {
  ANTHROPIC_API_KEY: string
}

function getClient(env: AiEnv): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
}

// Current models think by default, so content[0] is often a thinking block, not
// text. Reading content[0] alone silently yields '' — collect every text block.
//
// A safety refusal also arrives as HTTP 200 with stop_reason 'refusal' and no
// text, so it has to be caught here or it looks identical to a normal empty
// answer. Throw instead: a 500 with a reason beats a silently blank result.
function extractText(message: Anthropic.Message): string {
  if ((message.stop_reason as string) === 'refusal') {
    const details = (message as { stop_details?: { category?: string | null } }).stop_details
    throw new Error(`Claude declined this request (refusal category: ${details?.category ?? 'unspecified'})`)
  }

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim()

  // Never return '' — that is the bug this file exists to prevent, just one
  // layer down. A response can carry thinking blocks and no text (most often
  // when max_tokens is hit during thinking), and every caller here feeds this
  // straight into JSON.parse or renders it. Silently, '' degrades into an empty
  // briefing cached for four hours, a blank email draft, or a summary of "".
  // Throwing turns all three into a 500 with a reason attached.
  if (!text) {
    throw new Error(
      `Claude returned no text block (stop_reason: ${message.stop_reason ?? 'unknown'}). ` +
        'If stop_reason is max_tokens, raise the caller\'s maxTokens — on a thinking model the ' +
        'budget covers thinking plus the answer.',
    )
  }

  return text
}

export async function callHaiku(
  env: AiEnv,
  system: string,
  prompt: string,
  maxTokens = 2048,
): Promise<string> {
  const client = getClient(env)
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  return extractText(message)
}

export async function callSonnet(
  env: AiEnv,
  system: string,
  prompt: string,
  maxTokens = 4096,
): Promise<string> {
  const client = getClient(env)
  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  return extractText(message)
}
