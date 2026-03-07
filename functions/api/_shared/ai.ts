import Anthropic from '@anthropic-ai/sdk'

interface AiEnv {
  ANTHROPIC_API_KEY: string
}

function getClient(env: AiEnv): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
}

export async function callHaiku(
  env: AiEnv,
  system: string,
  prompt: string,
  maxTokens = 1024,
): Promise<string> {
  const client = getClient(env)
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20250414',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  return block.type === 'text' ? block.text : ''
}

export async function callSonnet(
  env: AiEnv,
  system: string,
  prompt: string,
  maxTokens = 2048,
): Promise<string> {
  const client = getClient(env)
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  const block = message.content[0]
  return block.type === 'text' ? block.text : ''
}
