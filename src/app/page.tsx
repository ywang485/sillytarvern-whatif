import { UploadForm } from '@/components/upload/UploadForm'
import { StoryCard } from '@/components/story/StoryCard'
import type { StoryListItem } from '@/types'

async function getStories(): Promise<StoryListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/stories`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function HomePage() {
  const stories = await getStories()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-10 text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            SillyTavern What-If
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Upload any story and transform it into an interactive branching narrative with
            SillyTavern character cards, world lore, and a playable visual novel.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-10">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
            New Story
          </h2>
          <UploadForm />
        </div>

        {stories.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Your Stories
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
