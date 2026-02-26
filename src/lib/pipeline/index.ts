import { nanoid } from 'nanoid'
import {
  ensureStoryDir,
  readMeta,
  writeMeta,
  writeSourceText,
  writeCharacters,
  writeWorldInfo,
  writeNarrative,
} from '@/lib/storage'
import { extractTextFromPdf, truncateText } from '@/lib/pdf'
import { extractStructure } from './extract-structure'
import { extractCharacters } from './extract-characters'
import { extractWorldInfo } from './extract-worldinfo'
import { generateBranchesForChapters } from './generate-branches'
import type { StoryMeta, GenerationProgress } from '@/types'

async function updateProgress(
  storyId: string,
  update: Partial<GenerationProgress>
): Promise<void> {
  const meta = await readMeta(storyId)
  meta.progress = { ...meta.progress, ...update }
  await writeMeta(storyId, meta)
}

export async function createStory(
  fileName: string,
  branchesPerChapter: number,
  protagonistNameOverride?: string
): Promise<string> {
  const storyId = nanoid()
  await ensureStoryDir(storyId)

  const initialMeta: StoryMeta = {
    id: storyId,
    title: fileName.replace(/\.(pdf|txt)$/i, ''),
    createdAt: new Date().toISOString(),
    config: {
      branchesPerChapter,
      protagonistName: protagonistNameOverride ?? '',
      sourceFileName: fileName,
    },
    progress: {
      status: 'pending',
      step: 0,
      totalSteps: 5,
      message: 'Starting...',
    },
  }

  await writeMeta(storyId, initialMeta)
  return storyId
}

export async function runPipeline(
  storyId: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<void> {
  try {
    // ── Step 0: Extract text ───────────────────────────────────────────────
    await updateProgress(storyId, {
      status: 'extracting_text',
      step: 0,
      message: 'Extracting text from file...',
    })

    let rawText: string
    if (mimeType === 'application/pdf') {
      rawText = await extractTextFromPdf(fileBuffer)
    } else {
      rawText = fileBuffer.toString('utf-8')
    }

    const sourceText = truncateText(rawText)
    await writeSourceText(storyId, sourceText)

    // ── Step 1: Analyze structure ──────────────────────────────────────────
    await updateProgress(storyId, {
      status: 'analyzing_structure',
      step: 1,
      message: 'Analyzing chapter structure and plot points...',
    })

    const { structure, storyTitle, protagonistName } = await extractStructure(sourceText)

    const meta = await readMeta(storyId)
    meta.title = storyTitle
    if (!meta.config.protagonistName) {
      meta.config.protagonistName = protagonistName
    }
    await writeMeta(storyId, meta)

    const resolvedProtagonist = meta.config.protagonistName

    // Write structure without branches yet
    await writeNarrative(storyId, structure)

    // ── Step 2: Extract characters ─────────────────────────────────────────
    await updateProgress(storyId, {
      status: 'generating_characters',
      step: 2,
      message: 'Generating character cards...',
    })

    const characters = await extractCharacters(sourceText, resolvedProtagonist)
    await writeCharacters(storyId, characters)

    // Link protagonist ID to narrative
    const protagonistCard = characters.find(
      (c) =>
        c.isProtagonist ||
        c.data.name.toLowerCase().includes(resolvedProtagonist.toLowerCase())
    )
    structure.protagonistId = protagonistCard?.id ?? characters[0]?.id ?? ''
    await writeNarrative(storyId, structure)

    // ── Step 3: Extract world info ─────────────────────────────────────────
    await updateProgress(storyId, {
      status: 'generating_worldinfo',
      step: 3,
      message: 'Generating world lore entries...',
    })

    const worldInfo = await extractWorldInfo(sourceText)
    await writeWorldInfo(storyId, worldInfo)

    // ── Step 4: Generate branches ──────────────────────────────────────────
    await updateProgress(storyId, {
      status: 'generating_branches',
      step: 4,
      message: 'Generating story branches (this may take a while)...',
    })

    const { branchesPerChapter } = (await readMeta(storyId)).config
    const BATCH_SIZE = 3
    const chapters = [...structure.chapters]

    // Track the world state at the end of the last processed chapter so each
    // batch of branches knows where the previous bottleneck left off.
    let previousBottleneckWorldState: string | null = null

    for (let i = 0; i < chapters.length; i += BATCH_SIZE) {
      const batch = chapters.slice(i, i + BATCH_SIZE)
      const batchEnd = Math.min(i + BATCH_SIZE, chapters.length)

      await updateProgress(storyId, {
        message: `Generating branches for chapters ${i + 1}–${batchEnd} of ${chapters.length}...`,
      })

      const updatedBatch = await generateBranchesForChapters(
        batch,
        characters,
        branchesPerChapter,
        resolvedProtagonist,
        previousBottleneckWorldState
      )

      for (let j = 0; j < updatedBatch.length; j++) {
        chapters[i + j] = updatedBatch[j]
      }

      // The last chapter in this batch sets the entry state for the next batch.
      previousBottleneckWorldState = batch[batch.length - 1].bottleneck.worldStateAfter
    }

    structure.chapters = chapters
    await writeNarrative(storyId, structure)

    // ── Complete ───────────────────────────────────────────────────────────
    await updateProgress(storyId, {
      status: 'complete',
      step: 5,
      message: 'Story generation complete!',
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await updateProgress(storyId, {
      status: 'error',
      message: 'Generation failed.',
      error,
    }).catch(() => {}) // don't throw on progress update failure
    throw err
  }
}
