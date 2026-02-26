import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StoryListItem, GenerationStatus } from '@/types'

const STATUS_CONFIG: Record<GenerationStatus, { label: string; className: string }> = {
  pending: { label: 'Queued', className: 'bg-slate-700 text-slate-300' },
  extracting_text: { label: 'Extracting', className: 'bg-blue-900 text-blue-300' },
  analyzing_structure: { label: 'Analyzing', className: 'bg-blue-900 text-blue-300' },
  generating_characters: { label: 'Characters', className: 'bg-violet-900 text-violet-300' },
  generating_worldinfo: { label: 'World Lore', className: 'bg-violet-900 text-violet-300' },
  generating_branches: { label: 'Branching', className: 'bg-amber-900 text-amber-300 animate-pulse' },
  complete: { label: 'Ready', className: 'bg-emerald-900 text-emerald-300' },
  error: { label: 'Error', className: 'bg-red-900 text-red-300' },
}

interface Props {
  story: StoryListItem
}

export function StoryCard({ story }: Props) {
  const status = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.error
  const isReady = story.status === 'complete'

  const content = (
    <Card
      className={`bg-white/5 border-white/10 transition-all ${
        isReady ? 'hover:bg-white/8 hover:border-amber-500/30 cursor-pointer' : 'opacity-70'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base text-slate-200 leading-snug">
            {story.title}
          </CardTitle>
          <Badge className={`text-xs shrink-0 ${status.className}`}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 text-xs text-slate-500">
          {isReady && (
            <>
              <span>{story.chapterCount} chapters</span>
              <span>·</span>
              <span>{story.branchesPerChapter} branches each</span>
              <span>·</span>
            </>
          )}
          <span>{new Date(story.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )

  if (!isReady) return content
  return <Link href={`/stories/${story.id}`}>{content}</Link>
}
