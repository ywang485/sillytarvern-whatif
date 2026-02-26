import fs from 'fs/promises'
import path from 'path'
import type {
  StoryMeta,
  CharacterCard,
  WorldInfo,
  NarrativeStructure,
} from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data', 'stories')

export function getStoryDir(storyId: string): string {
  return path.join(DATA_DIR, storyId)
}

export async function ensureStoryDir(storyId: string): Promise<void> {
  await fs.mkdir(getStoryDir(storyId), { recursive: true })
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  const tmp = filePath + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8')
  await fs.rename(tmp, filePath)
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export async function readMeta(storyId: string): Promise<StoryMeta> {
  return readJson<StoryMeta>(path.join(getStoryDir(storyId), 'meta.json'))
}

export async function writeMeta(storyId: string, meta: StoryMeta): Promise<void> {
  await writeJson(path.join(getStoryDir(storyId), 'meta.json'), meta)
}

// ─── Source Text ──────────────────────────────────────────────────────────────

export async function readSourceText(storyId: string): Promise<string> {
  return fs.readFile(path.join(getStoryDir(storyId), 'source.txt'), 'utf-8')
}

export async function writeSourceText(storyId: string, text: string): Promise<void> {
  await fs.writeFile(path.join(getStoryDir(storyId), 'source.txt'), text, 'utf-8')
}

// ─── Characters ───────────────────────────────────────────────────────────────

export async function readCharacters(storyId: string): Promise<CharacterCard[]> {
  return readJson<CharacterCard[]>(path.join(getStoryDir(storyId), 'characters.json'))
}

export async function writeCharacters(storyId: string, chars: CharacterCard[]): Promise<void> {
  await writeJson(path.join(getStoryDir(storyId), 'characters.json'), chars)
}

// ─── World Info ───────────────────────────────────────────────────────────────

export async function readWorldInfo(storyId: string): Promise<WorldInfo> {
  return readJson<WorldInfo>(path.join(getStoryDir(storyId), 'worldinfo.json'))
}

export async function writeWorldInfo(storyId: string, wi: WorldInfo): Promise<void> {
  await writeJson(path.join(getStoryDir(storyId), 'worldinfo.json'), wi)
}

// ─── Narrative ────────────────────────────────────────────────────────────────

export async function readNarrative(storyId: string): Promise<NarrativeStructure> {
  return readJson<NarrativeStructure>(path.join(getStoryDir(storyId), 'narrative.json'))
}

export async function writeNarrative(storyId: string, narrative: NarrativeStructure): Promise<void> {
  await writeJson(path.join(getStoryDir(storyId), 'narrative.json'), narrative)
}

// ─── List All Stories ─────────────────────────────────────────────────────────

export async function listStoryIds(): Promise<string[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true })
    const ids: string[] = []
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          await fs.access(path.join(DATA_DIR, entry.name, 'meta.json'))
          ids.push(entry.name)
        } catch {
          // skip directories without meta.json
        }
      }
    }
    return ids
  } catch {
    return []
  }
}
