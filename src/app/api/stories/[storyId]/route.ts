import { NextRequest, NextResponse } from 'next/server'
import {
  readMeta,
  readCharacters,
  readWorldInfo,
  readNarrative,
} from '@/lib/storage'
import type { FullStoryData, CharacterCard, WorldInfo, NarrativeStructure } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params

  try {
    const meta = await readMeta(storyId)

    let characters: CharacterCard[] = []
    let worldInfo: WorldInfo = { entries: [] }
    let narrative: NarrativeStructure = { chapters: [], protagonistId: '' }

    try { characters = await readCharacters(storyId) } catch {}
    try { worldInfo = await readWorldInfo(storyId) } catch {}
    try { narrative = await readNarrative(storyId) } catch {}

    const data: FullStoryData = { meta, characters, worldInfo, narrative }
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
