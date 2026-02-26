import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-haiku-4-5'

let firstCall = true

export async function callClaudeText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (firstCall) {
    process.stdout.write(`[Claude] Connecting to ${MODEL}...\n`)
  }

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      temperature: 1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stdout.write(`[Claude] Connection FAILED: ${msg}\n`)
    throw err
  }

  if (firstCall) {
    process.stdout.write(`[Claude] Connected successfully.\n`)
    firstCall = false
  }

  const text =
    response.content[0].type === 'text' ? response.content[0].text : ''

  const sep = '─'.repeat(80) + '\n'
  process.stdout.write('\n' + sep)
  process.stdout.write(`[Claude] (text) stop_reason=${response.stop_reason}  tokens=${response.usage.input_tokens}in/${response.usage.output_tokens}out\n`)
  process.stdout.write(sep)
  process.stdout.write(text + '\n')
  process.stdout.write(sep + '\n')

  return text.trim()
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 2
): Promise<string> {
  const fullSystem =
    systemPrompt +
    '\n\nRespond ONLY with valid JSON. Do not include markdown code fences, backticks, or any prose outside the JSON.'

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userPrompt },
    ]

    if (attempt > 0 && lastError) {
      messages.push({
        role: 'assistant',
        content: 'I apologize, my previous response was not valid JSON.',
      })
      messages.push({
        role: 'user',
        content: `Your previous response could not be parsed as JSON. Error: ${lastError.message}\n\nPlease respond with ONLY valid JSON, no other text.`,
      })
    }

    if (firstCall) {
      process.stdout.write(`[Claude] Connecting to ${MODEL}...\n`)
    }

    let response: Anthropic.Message
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        temperature: 0,
        system: fullSystem,
        messages,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      process.stdout.write(`[Claude] Connection FAILED: ${msg}\n`)
      throw err
    }

    if (firstCall) {
      process.stdout.write(`[Claude] Connected successfully.\n`)
      firstCall = false
    }

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    const sep = '─'.repeat(80) + '\n'
    process.stdout.write('\n' + sep)
    process.stdout.write(`[Claude] attempt=${attempt + 1}  stop_reason=${response.stop_reason}  tokens=${response.usage.input_tokens}in/${response.usage.output_tokens}out\n`)
    process.stdout.write(sep)
    process.stdout.write(text + '\n')
    process.stdout.write(sep + '\n')

    // Strip any accidental markdown fences
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    try {
      JSON.parse(cleaned) // validate
      return cleaned
    } catch (err) {
      lastError = err as Error
      if (attempt === maxRetries) {
        throw new Error(
          `Claude returned invalid JSON after ${maxRetries + 1} attempts: ${lastError.message}\n\nRaw response: ${text.slice(0, 500)}`
        )
      }
    }
  }

  throw new Error('Unexpected error in callClaude')
}
