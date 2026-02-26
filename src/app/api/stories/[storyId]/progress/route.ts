import { NextRequest, NextResponse } from 'next/server'
import { readMeta } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params

  try {
    const meta = await readMeta(storyId)
    return NextResponse.json(meta.progress)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
