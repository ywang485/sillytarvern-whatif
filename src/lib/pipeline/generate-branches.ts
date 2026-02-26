import { callClaude } from '@/lib/claude'
import type { Chapter, Storylet, CharacterCard } from '@/types'
import { nanoid } from 'nanoid'

interface RawStorylет {
  title: string
  summary: string
  fullText: string
  worldStateEffects: string
  involvedCharacterNames: string[]
}

interface BranchBatchResponse {
  chapters: Array<{
    chapterNumber: number
    branches: RawStorylет[]
  }>
}

function buildCharacterSummary(characters: CharacterCard[]): string {
  return characters
    .map((c) => `- ${c.data.name}: ${c.data.personality.split('.')[0]}.`)
    .join('\n')
}

export async function generateBranchesForChapters(
  chapters: Chapter[],
  characters: CharacterCard[],
  branchCount: number,
  protagonistName: string
): Promise<Chapter[]> {
  const systemPrompt = `You are a creative writer specializing in branching interactive fiction. You write engaging, distinct storylets that offer players meaningful choices while all converging to the same narrative bottleneck.`

  const chaptersPayload = chapters.map((ch) => ({
    chapterNumber: ch.chapterNumber,
    title: ch.title,
    synopsis: ch.synopsis,
    bottleneck: {
      title: ch.bottleneck.title,
      worldStateAfter: ch.bottleneck.worldStateAfter,
    },
  }))

  const userPrompt = `You are writing branching interactive fiction. For each chapter below, create ${branchCount} DISTINCT branch paths (storylets).

PROTAGONIST: ${protagonistName}

AVAILABLE CHARACTERS:
${buildCharacterSummary(characters)}

RULES FOR EACH BRANCH:
- Each branch must offer a meaningfully DIFFERENT approach or experience (not just cosmetically different)
- All branches must converge NATURALLY to the chapter's bottleneck event
- Write in second-person present tense ("You decide to...", "You notice...", "As you...")
- Each fullText should be approximately 300-400 words of immersive prose
- Include at least one other character from the list in each branch
- The worldStateEffects should describe mechanical consequences (skills used, relationships changed, items gained/lost, etc.)

For each chapter, generate exactly ${branchCount} branches. Each branch must have:
- title: a short action label shown to the player as a choice (5-8 words, starts with a verb, e.g. "Sneak through the service tunnels")
- summary: 2-3 sentences describing this path shown to the player before they choose (should help them make an informed decision)
- fullText: full prose scene (~350 words) in second-person present tense
- worldStateEffects: 1-2 sentences describing narrative/mechanical effects (e.g. "Stealth approach: avoided combat, gained access card, guard trust decreased")
- involvedCharacterNames: list of character names from the AVAILABLE CHARACTERS list who appear in this branch

Chapters to process:
${JSON.stringify(chaptersPayload, null, 2)}

Return JSON:
{
  "chapters": [
    {
      "chapterNumber": number,
      "branches": [
        {
          "title": "string",
          "summary": "string",
          "fullText": "string",
          "worldStateEffects": "string",
          "involvedCharacterNames": ["string"]
        }
      ]
    }
  ]
}`

  const raw = await callClaude(systemPrompt, userPrompt)
  const parsed: BranchBatchResponse = JSON.parse(raw)

  // Build a name→id map for character lookup
  const charIdByName = new Map<string, string>()
  for (const char of characters) {
    charIdByName.set(char.data.name.toLowerCase(), char.id)
  }

  // Merge branches back into chapters
  return chapters.map((chapter) => {
    const batchResult = parsed.chapters.find(
      (c) => c.chapterNumber === chapter.chapterNumber
    )
    if (!batchResult) return chapter

    const branches: Storylet[] = batchResult.branches.map((b) => ({
      id: nanoid(),
      title: b.title,
      summary: b.summary,
      fullText: b.fullText,
      worldStateEffects: b.worldStateEffects,
      involvedCharacterIds: b.involvedCharacterNames
        .map((name) => charIdByName.get(name.toLowerCase()))
        .filter((id): id is string => id !== undefined),
    }))

    return { ...chapter, branches }
  })
}
