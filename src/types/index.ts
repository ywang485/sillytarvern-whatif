// ─── Generation Status ───────────────────────────────────────────────────────

export type GenerationStatus =
  | 'pending'
  | 'extracting_text'
  | 'analyzing_structure'
  | 'generating_characters'
  | 'generating_worldinfo'
  | 'generating_branches'
  | 'complete'
  | 'error'

export interface GenerationProgress {
  status: GenerationStatus
  step: number
  totalSteps: 5
  message: string
  error?: string
}

// ─── Story Metadata ───────────────────────────────────────────────────────────

export interface StoryConfig {
  branchesPerChapter: number
  protagonistName: string
  sourceFileName: string
}

export interface StoryMeta {
  id: string
  title: string
  createdAt: string
  config: StoryConfig
  progress: GenerationProgress
}

// ─── SillyTavern Character Card (TavernCardV2) ───────────────────────────────

export interface TavernCardV2Data {
  name: string
  description: string
  personality: string
  scenario: string
  first_mes: string
  mes_example: string
  creator_notes: string
  tags: string[]
}

export interface CharacterCard {
  id: string
  isProtagonist: boolean
  spec: 'chara_card_v2'
  spec_version: '2.0'
  data: TavernCardV2Data
}

// ─── SillyTavern World Info ───────────────────────────────────────────────────

export type LoreCategory = 'location' | 'faction' | 'item' | 'concept' | 'event' | 'other'

export interface WorldInfoEntry {
  id: string
  keys: string[]
  content: string
  title: string
  enabled: boolean
  insertion_order: number
  category: LoreCategory
}

export interface WorldInfo {
  entries: WorldInfoEntry[]
}

// ─── Narrative Structure ──────────────────────────────────────────────────────

export interface Storylet {
  id: string
  title: string
  summary: string
  fullText: string
  worldStateEffects: string
  involvedCharacterIds: string[]
}

export interface Bottleneck {
  id: string
  title: string
  text: string
  worldStateAfter: string
}

export interface Chapter {
  id: string
  chapterNumber: number
  title: string
  synopsis: string
  bottleneck: Bottleneck
  branches: Storylet[]
}

export interface NarrativeStructure {
  chapters: Chapter[]
  protagonistId: string
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface StoryListItem {
  id: string
  title: string
  createdAt: string
  status: GenerationStatus
  chapterCount: number
  branchesPerChapter: number
}

export interface FullStoryData {
  meta: StoryMeta
  characters: CharacterCard[]
  worldInfo: WorldInfo
  narrative: NarrativeStructure
}

// ─── Client-Only Player State ─────────────────────────────────────────────────

export interface PlayerState {
  currentChapterIndex: number
  chosenBranchIds: string[]
  phase: 'choosing' | 'reading_branch' | 'reading_bottleneck' | 'finished'
  activeBranchId: string | null
}

export type PlayerAction =
  | { type: 'CHOOSE_BRANCH'; branchId: string }
  | { type: 'FINISH_BRANCH_READING' }
  | { type: 'FINISH_BOTTLENECK_READING'; totalChapters: number }
