import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CharacterCardView } from '@/components/characters/CharacterCard'
import type { FullStoryData } from '@/types'

async function getStory(storyId: string): Promise<FullStoryData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/stories/${storyId}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const { storyId } = await params
  const story = await getStory(storyId)

  if (!story || story.meta.progress.status !== 'complete') {
    notFound()
  }

  const { characters } = story
  const sorted = [...characters].sort((a, b) =>
    a.isProtagonist === b.isProtagonist ? 0 : a.isProtagonist ? -1 : 1
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link
          href={`/stories/${storyId}`}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          ← {story.meta.title}
        </Link>
        <span className="text-white/20">·</span>
        <span className="text-sm text-slate-400">
          Character Cards ({characters.length})
        </span>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-xs text-slate-600 mb-6">
          Click a card to expand. Cards follow SillyTavern TavernCardV2 format.
        </p>
        <div className="space-y-3">
          {sorted.map((char) => (
            <CharacterCardView key={char.id} character={char} />
          ))}
        </div>
      </div>
    </div>
  )
}
