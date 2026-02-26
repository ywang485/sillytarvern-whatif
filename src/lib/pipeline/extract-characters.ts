import { callClaude } from '@/lib/claude'
import type { CharacterCard } from '@/types'
import { nanoid } from 'nanoid'

interface RawCharacter {
  name: string
  isProtagonist: boolean
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
  creator_notes: string
  tags: string[]
}

interface CharactersResponse {
  characters: RawCharacter[]
}

export async function extractCharacters(
  sourceText: string,
  protagonistName: string
): Promise<CharacterCard[]> {
  const systemPrompt = `You are a character analyst and creative writer. You extract characters from stories and write SillyTavern-compatible character cards.`

  const userPrompt = `Extract all significant named characters from this story and generate SillyTavern TavernCardV2 character cards for each.

The protagonist is: ${protagonistName}

For each character generate:
- name: full name as it appears in the story
- isProtagonist: true only for the main protagonist (${protagonistName}), false for all others
- description: physical appearance, role, and background (2-3 paragraphs, in second-person for protagonist: "You are...", third-person for others: "{{char}} is...")
- personality: key personality traits, behavioral tendencies, speaking style, and emotional patterns (1-2 paragraphs)
- scenario: the current situation and world context this character exists in (1 paragraph)
- first_mes: an opening message in first person as this character would speak to greet or address the user (2-3 sentences, natural and in-character)
- mes_example: 3 example dialogue exchanges formatted exactly as:
  <START>
  {{user}}: [user message]
  {{char}}: [character response]
  <START>
  {{user}}: [user message]
  {{char}}: [character response]
  <START>
  {{user}}: [user message]
  {{char}}: [character response]
- creator_notes: brief casting/writing notes for authors (1-2 sentences, not sent to AI)
- tags: 3-7 relevant tags (e.g. ["protagonist", "hero", "magic-user", "tragic"])

Include only characters who appear significantly in the story (speaking roles or major plot involvement).

Return JSON:
{
  "characters": [
    {
      "name": "string",
      "isProtagonist": boolean,
      "description": "string",
      "personality": "string",
      "scenario": "string",
      "first_mes": "string",
      "mes_example": "string",
      "creator_notes": "string",
      "tags": ["string"]
    }
  ]
}

Story text:
---
${sourceText}
---`

  const raw = await callClaude(systemPrompt, userPrompt)
  const parsed: CharactersResponse = JSON.parse(raw)

  return parsed.characters.map((ch): CharacterCard => ({
    id: nanoid(),
    isProtagonist: ch.isProtagonist,
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: ch.name,
      description: ch.description,
      personality: ch.personality,
      scenario: ch.scenario,
      first_mes: ch.first_mes,
      mes_example: ch.mes_example,
      creator_notes: ch.creator_notes,
      tags: ch.tags,
    },
  }))
}
