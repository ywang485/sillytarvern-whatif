import { NextResponse } from 'next/server'
import { listStoryIds, readMeta, readNarrative } from '@/lib/storage'
import type { StoryListItem } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ids = await listStoryIds()

    const items: StoryListItem[] = []

    for (const id of ids) {
      try {
        const meta = await readMeta(id)
        let chapterCount = 0

        if (meta.progress.status === 'complete') {
          try {
            const narrative = await readNarrative(id)
            chapterCount = narrative.chapters.length
          } catch {
            // narrative may not exist yet
          }
        }

        items.push({
          id: meta.id,
          title: meta.title,
          createdAt: meta.createdAt,
          status: meta.progress.status,
          chapterCount,
          branchesPerChapter: meta.config.branchesPerChapter,
        })
      } catch {
        // skip stories with corrupt meta
      }
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(items)
  } catch (err) {
    console.error('Stories list error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
