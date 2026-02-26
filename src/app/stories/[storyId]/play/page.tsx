import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PlayerShell } from '@/components/player/PlayerShell'
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

export default async function PlayPage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const { storyId } = await params
  const story = await getStory(storyId)

  if (!story || story.meta.progress.status !== 'complete') {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Minimal header */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link
          href={`/stories/${storyId}`}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          ← {story.meta.title}
        </Link>
      </div>

      {/* Player */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <PlayerShell story={story} />
      </div>
    </div>
  )
}
