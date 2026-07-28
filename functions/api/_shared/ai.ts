import Anthropic from '@anthropic-ai/sdk'

interface AiEnv {
  ANTHROPIC_API_KEY: string
}

function getClient(env: AiEnv): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
}

// Current models think by default, so content[0] is often a thinking block, not
// text. Reading content[0] alone silently yields '' — collect every text block.
function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
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
