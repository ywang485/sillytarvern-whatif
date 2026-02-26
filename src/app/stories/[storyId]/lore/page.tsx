import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Accordion } from '@/components/ui/accordion'
import { LoreEntry } from '@/components/lore/LoreEntry'
import type { FullStoryData, LoreCategory } from '@/types'

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

const CATEGORY_ORDER: LoreCategory[] = [
  'location',
  'faction',
  'item',
  'concept',
  'event',
  'other',
]

export default async function LorePage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const { storyId } = await params
  const story = await getStory(storyId)

  if (!story || story.meta.progress.status !== 'complete') {
    notFound()
  }

  const { worldInfo } = story
  const sorted = [...worldInfo.entries].sort(
    (a, b) => a.insertion_order - b.insertion_order
  )

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof sorted>>(
    (acc, cat) => {
      const entries = sorted.filter((e) => e.category === cat)
      if (entries.length > 0) acc[cat] = entries
      return acc
    },
    {}
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
          World Lore ({worldInfo.entries.length} entries)
        </span>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {Object.entries(grouped).map(([category, entries]) => (
          <div key={category}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 capitalize">
              {category}s
            </h2>
            <Accordion type="multiple">
              {entries.map((entry) => (
                <LoreEntry key={entry.id} entry={entry} />
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  )
}
