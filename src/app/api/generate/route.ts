import { NextRequest, NextResponse } from 'next/server'
import { createStory, runPipeline } from '@/lib/pipeline'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const branchesPerChapterRaw = formData.get('branchesPerChapter') as string | null
    const protagonistNameOverride = formData.get('protagonistName') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name
    const mimeType = file.type

    if (!['application/pdf', 'text/plain'].includes(mimeType) &&
        !fileName.endsWith('.txt') && !fileName.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF and TXT files are supported' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    const branchesPerChapter = Math.min(
      5,
      Math.max(1, parseInt(branchesPerChapterRaw ?? '3', 10) || 3)
    )

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const detectedMime = fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain'

    const storyId = await createStory(
      fileName,
      branchesPerChapter,
      protagonistNameOverride || undefined
    )

    // Fire and forget — pipeline runs asynchronously
    void runPipeline(storyId, fileBuffer, detectedMime)

    return NextResponse.json({ storyId }, { status: 202 })
  } catch (err) {
    console.error('Generate route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
