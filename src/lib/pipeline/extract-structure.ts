import { callClaude } from '@/lib/claude'
import { PENDING_TEXT } from '@/types'
import type { Chapter, Bottleneck, NarrativeStructure } from '@/types'
import { nanoid } from 'nanoid'

interface RawChapter {
  chapterNumber: number
  title: string
  synopsis: string
  bottleneck: {
    title: string
    worldStateAfter: string
  }
}

interface StructureResponse {
  storyTitle: string
  protagonistName: string
  chapters: RawChapter[]
}

export async function extractStructure(
  sourceText: string
): Promise<{ structure: NarrativeStructure; storyTitle: string; protagonistName: string }> {
  const systemPrompt = `You are a literary analyst specializing in narrative structure. Your task is to analyze stories and identify their chapter structure with precision.`

  const userPrompt = `Analyze the following story and identify its chapter structure.

For each chapter extract:
- chapterNumber: sequential number starting at 1
- title: a short evocative title for the chapter
- synopsis: a one-paragraph summary of the chapter's narrative arc
- bottleneck: the single most important, unavoidable plot event that every path through this chapter must converge at. This is a mandatory story beat that cannot be skipped. For the bottleneck provide:
  - title: short name for the event (e.g. "The Bridge Collapse", "First Encounter with the Dragon")
  - worldStateAfter: 1-2 sentences describing the canonical world state immediately after this event

Also extract:
- storyTitle: the title of the story
- protagonistName: the full name of the main protagonist

If the story has no clear chapter divisions, divide it into logical narrative acts (aim for 3-8 chapters).

Return JSON matching this exact schema:
{
  "storyTitle": "string",
  "protagonistName": "string",
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "string",
      "synopsis": "string",
      "bottleneck": {
        "title": "string",
        "worldStateAfter": "string"
      }
    }
  ]
}

Story text:
---
${sourceText}
---`

  const raw = await callClaude(systemPrompt, userPrompt)
  const parsed: StructureResponse = JSON.parse(raw)

  const chapters: Chapter[] = parsed.chapters.map((ch) => ({
    id: nanoid(),
    chapterNumber: ch.chapterNumber,
    title: ch.title,
    synopsis: ch.synopsis,
    bottleneck: {
      id: nanoid(),
      title: ch.bottleneck.title,
      text: PENDING_TEXT,
      worldStateAfter: ch.bottleneck.worldStateAfter,
    } as Bottleneck,
    branches: [],
  }))

  const structure: NarrativeStructure = {
    chapters,
    protagonistId: '', // filled in after character extraction
  }

  return {
    structure,
    storyTitle: parsed.storyTitle,
    protagonistName: parsed.protagonistName,
  }
}
