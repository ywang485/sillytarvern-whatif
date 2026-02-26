import { NextRequest, NextResponse } from 'next/server'
import { readMeta, readCharacters, readWorldInfo } from '@/lib/storage'
import JSZip from 'jszip'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params

  try {
    const [meta, characters, worldInfo] = await Promise.all([
      readMeta(storyId),
      readCharacters(storyId),
      readWorldInfo(storyId),
    ])

    const zip = new JSZip()
    const charFolder = zip.folder('characters')!

    // Add each character as a SillyTavern-compatible JSON file
    for (const char of characters) {
      const exportCard = {
        spec: char.spec,
        spec_version: char.spec_version,
        data: char.data,
      }
      const safeName = char.data.name.replace(/[^a-z0-9_-]/gi, '_')
      charFolder.file(`${safeName}.json`, JSON.stringify(exportCard, null, 2))
    }

    // Add worldinfo.json in SillyTavern format
    const wiExport = {
      entries: worldInfo.entries.map(({ id: _id, category: _cat, ...entry }) => entry),
    }
    zip.file('worldinfo.json', JSON.stringify(wiExport, null, 2))

    const zipBytes = await zip.generateAsync({ type: 'uint8array' })
    const zipBlob = new Blob([zipBytes.buffer as ArrayBuffer], { type: 'application/zip' })
    const safeTitle = meta.title.replace(/[^a-z0-9_-]/gi, '_').slice(0, 40)

    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeTitle}-sillytavern-export.zip"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('ENOENT')) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
