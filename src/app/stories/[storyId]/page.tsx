import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { FullStoryData } from '@/types'

async function getStory(storyId: string): Promise<FullStoryData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/stories/${storyId}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const NAV_ITEMS = [
  { href: '', label: '▶ Play', emoji: '▶' },
  { href: '/tree', label: 'Branch Tree' },
  { href: '/characters', label: 'Characters' },
  { href: '/lore', label: 'World Lore' },
]

export default async function StoryHubPage({
  params,
}: {
  params: Promise<{ storyId: string }>
}) {
  const { storyId } = await params
  const story = await getStory(storyId)

  if (!story || story.meta.progress.status !== 'complete') {
    notFound()
  }

  const { meta, narrative, characters } = story
  const protagonist = characters.find((c) => c.id === narrative.protagonistId)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-4 py-3">
            <Link
              href="/"
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              ← Stories
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="font-semibold text-white truncate">{meta.title}</h1>
            <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
              <span>{narrative.chapters.length} chapters</span>
              <span>·</span>
              <span>{meta.config.branchesPerChapter} branches each</span>
              {protagonist && (
                <>
                  <span>·</span>
                  <span className="text-amber-500">{protagonist.data.name}</span>
                </>
              )}
            </div>
          </div>
          {/* Tab nav */}
          <div className="flex gap-1 pb-0">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={`/stories/${storyId}${href}`}
                className="rounded-t-lg px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="ml-auto pb-2">
              <a
                href={`/api/stories/${storyId}/export`}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-white/30 transition-colors"
              >
                Export SillyTavern ↓
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Default content: show story overview */}
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-3">
          <StatCard
            label="Chapters"
            value={String(narrative.chapters.length)}
            sub="narrative acts"
          />
          <StatCard
            label="Story Branches"
            value={String(
              narrative.chapters.reduce((acc, ch) => acc + ch.branches.length, 0)
            )}
            sub={`${meta.config.branchesPerChapter} per chapter`}
          />
          <StatCard
            label="Characters"
            value={String(characters.length)}
            sub="with character cards"
          />
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Chapter Overview
          </h2>
          {narrative.chapters.map((ch) => (
            <div
              key={ch.id}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                  {ch.chapterNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-200">{ch.title}</h3>
                    <Badge className="text-[10px] bg-amber-900 text-amber-300 border-0">
                      {ch.bottleneck.title}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    {ch.synopsis}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href={`/stories/${storyId}/play`}
            className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold px-6 py-3 transition-colors"
          >
            ▶ Play Interactive Story
          </Link>
          <Link
            href={`/stories/${storyId}/tree`}
            className="rounded-xl border border-white/20 hover:border-white/40 text-slate-300 hover:text-white px-6 py-3 transition-colors"
          >
            View Branch Tree
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
    </div>
  )
}
