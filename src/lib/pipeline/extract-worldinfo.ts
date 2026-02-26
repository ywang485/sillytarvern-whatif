import { callClaude } from '@/lib/claude'
import type { WorldInfo, WorldInfoEntry, LoreCategory } from '@/types'
import { nanoid } from 'nanoid'

interface RawLoreEntry {
  title: string
  keys: string[]
  content: string
  category: string
  insertion_order: number
}

interface WorldInfoResponse {
  entries: RawLoreEntry[]
}

const VALID_CATEGORIES: LoreCategory[] = ['location', 'faction', 'item', 'concept', 'event', 'other']

function normalizeCategory(cat: string): LoreCategory {
  const lower = cat.toLowerCase() as LoreCategory
  return VALID_CATEGORIES.includes(lower) ? lower : 'other'
}

export async function extractWorldInfo(sourceText: string): Promise<WorldInfo> {
  const systemPrompt = `You are a world-building expert who creates comprehensive lorebooks for interactive fiction.`

  const userPrompt = `Extract world-building information from this story to create a SillyTavern WorldInfo lorebook.

For each significant location, faction/organization, important item/artifact, concept/magic system, or key recurring event, create a lore entry.

Each entry must have:
- title: short, memorable name (e.g. "The Spice Melange", "House Atreides", "Arrakis")
- keys: 2-5 trigger keywords or short phrases that would appear in conversation to activate this entry (e.g. ["spice", "melange", "the spice"])
- content: comprehensive lore description written as in-world reference text (2-4 sentences). Should be self-contained and informative.
- category: one of "location", "faction", "item", "concept", "event", or "other"
- insertion_order: importance ranking from 1-200 (lower number = more important/inserted first). Key locations and factions: 10-50. Important items/concepts: 50-100. Minor details: 100-200.

Aim for 10-30 entries covering the most important world-building elements.

Return JSON:
{
  "entries": [
    {
      "title": "string",
      "keys": ["string"],
      "content": "string",
      "category": "string",
      "insertion_order": number
    }
  ]
}

Story text:
---
${sourceText}
---`

  const raw = await callClaude(systemPrompt, userPrompt)
  const parsed: WorldInfoResponse = JSON.parse(raw)

  const entries: WorldInfoEntry[] = parsed.entries.map((e) => ({
    id: nanoid(),
    keys: e.keys,
    content: e.content,
    title: e.title,
    enabled: true,
    insertion_order: e.insertion_order,
    category: normalizeCategory(e.category),
  }))

  return { entries }
}
