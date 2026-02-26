import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StoryTreeView } from '@/components/tree/StoryTreeView'
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

export default async function TreePage({
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
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <div className="border-b border-white/10 bg-slate-950 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link
          href={`/stories/${storyId}`}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          ← {story.meta.title}
        </Link>
        <span className="text-white/20">·</span>
        <span className="text-sm text-slate-400">Branch Tree</span>
        <span className="ml-auto text-xs text-slate-600">
          Click any node to expand · Pan &amp; zoom to navigate
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <StoryTreeView narrative={story.narrative} />
      </div>
    </div>
  )
}
