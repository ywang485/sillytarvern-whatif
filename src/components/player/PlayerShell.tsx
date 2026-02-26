'use client'

import { useReducer, useState, useCallback } from 'react'
import type { FullStoryData, PlayerState, PlayerAction, NarrativeStructure } from '@/types'
import { PENDING_TEXT } from '@/types'
import { SceneDisplay } from './SceneDisplay'
import { ChoicePanel } from './ChoicePanel'

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'CHOOSE_BRANCH':
      return { ...state, activeBranchId: action.branchId, phase: 'reading_branch' }
    case 'FINISH_BRANCH_READING':
      return { ...state, phase: 'reading_bottleneck' }
    case 'FINISH_BOTTLENECK_READING': {
      const next = state.currentChapterIndex + 1
      const isFinished = next >= action.totalChapters
      return {
        ...state,
        currentChapterIndex: next,
        chosenBranchIds: [...state.chosenBranchIds, state.activeBranchId!],
        activeBranchId: null,
        phase: isFinished ? 'finished' : 'choosing',
      }
    }
  }
}

interface Props {
  story: FullStoryData
}

export function PlayerShell({ story }: Props) {
  const { characters, meta } = story
  const totalChapters = story.narrative.chapters.length

  // Local mutable copy of narrative so we can patch in generated text
  const [narrative, setNarrative] = useState<NarrativeStructure>(story.narrative)
  const chapters = narrative.chapters

  const protagonist = characters.find((c) => c.id === narrative.protagonistId)
  const protagonistName = protagonist?.data.name ?? meta.config.protagonistName ?? 'You'

  const [state, dispatch] = useReducer(playerReducer, {
    currentChapterIndex: 0,
    chosenBranchIds: [],
    phase: 'choosing',
    activeBranchId: null,
  })

  const [generatingText, setGeneratingText] = useState(false)
  const [textError, setTextError] = useState<string | null>(null)

  const fetchText = useCallback(
    async (nodeType: 'branch' | 'bottleneck', nodeId: string): Promise<string | null> => {
      setGeneratingText(true)
      setTextError(null)
      try {
        const res = await fetch(`/api/stories/${meta.id}/generate-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeType, nodeId }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }))
          throw new Error(err.error ?? 'Request failed')
        }
        const { text } = await res.json()

        // Patch the local narrative state so re-renders use the real text
        setNarrative((prev) => {
          const chapters = prev.chapters.map((ch) => {
            if (nodeType === 'bottleneck' && ch.bottleneck.id === nodeId) {
              return { ...ch, bottleneck: { ...ch.bottleneck, text } }
            }
            if (nodeType === 'branch') {
              const branches = ch.branches.map((b) =>
                b.id === nodeId ? { ...b, fullText: text } : b
              )
              return { ...ch, branches }
            }
            return ch
          })
          return { ...prev, chapters }
        })

        return text
      } catch (err) {
        setTextError(err instanceof Error ? err.message : 'Failed to generate text')
        return null
      } finally {
        setGeneratingText(false)
      }
    },
    [meta.id]
  )

  const currentChapter = chapters[state.currentChapterIndex]
  const progress = Math.round((state.currentChapterIndex / totalChapters) * 100)

  // ── Finished ─────────────────────────────────────────────────────────────
  if (state.phase === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="text-6xl">✨</div>
        <h2 className="text-2xl font-bold text-white">The End</h2>
        <p className="text-slate-400 max-w-sm">
          You have completed <span className="text-amber-400">{story.meta.title}</span>.
          Your journey through {totalChapters} chapters is complete.
        </p>
        <div className="mt-4 space-y-1 text-sm text-slate-500">
          <p className="font-medium text-slate-400">Your path:</p>
          {state.chosenBranchIds.map((branchId, i) => {
            const chapter = chapters[i]
            const branch = chapter?.branches.find((b) => b.id === branchId)
            return (
              <p key={branchId}>
                Ch. {i + 1}: <span className="text-slate-300">{branch?.title ?? 'Unknown'}</span>
              </p>
            )
          })}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border border-white/20 px-5 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
        >
          Play again
        </button>
      </div>
    )
  }

  if (!currentChapter) return null

  // ── Branch reading phase ──────────────────────────────────────────────────
  const activeBranch =
    state.phase === 'reading_branch'
      ? currentChapter.branches.find((b) => b.id === state.activeBranchId)
      : undefined

  const branchText = activeBranch?.fullText ?? ''
  const bottleneckText = currentChapter.bottleneck.text

  return (
    <div className="flex flex-col gap-6">
      {/* Chapter header + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Chapter {currentChapter.chapterNumber} of {totalChapters}
          </span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{currentChapter.title}</h2>
          {state.phase === 'choosing' && (
            <p className="text-sm text-slate-500 mt-0.5">{currentChapter.synopsis}</p>
          )}
        </div>
      </div>

      {/* Error banner */}
      {textError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {textError}
        </div>
      )}

      {/* Content */}
      {state.phase === 'choosing' && (
        <ChoicePanel
          branches={currentChapter.branches}
          onChoose={(branchId) => dispatch({ type: 'CHOOSE_BRANCH', branchId })}
        />
      )}

      {state.phase === 'reading_branch' && activeBranch && (
        branchText === PENDING_TEXT ? (
          <PendingTextCard
            loading={generatingText}
            onGenerate={() => fetchText('branch', activeBranch.id)}
          />
        ) : (
          <SceneDisplay
            speakerName={protagonistName}
            text={branchText}
            label="branch"
            onContinue={() => dispatch({ type: 'FINISH_BRANCH_READING' })}
            continueLabel="Continue to key event"
          />
        )
      )}

      {state.phase === 'reading_bottleneck' && (
        bottleneckText === PENDING_TEXT ? (
          <PendingTextCard
            loading={generatingText}
            onGenerate={() => fetchText('bottleneck', currentChapter.bottleneck.id)}
          />
        ) : (
          <SceneDisplay
            speakerName="Narrator"
            text={bottleneckText}
            label="bottleneck"
            onContinue={() =>
              dispatch({ type: 'FINISH_BOTTLENECK_READING', totalChapters })
            }
            continueLabel={
              state.currentChapterIndex + 1 >= totalChapters
                ? 'Finish story'
                : 'Next chapter'
            }
          />
        )
      )}

      {/* World state note after bottleneck */}
      {state.phase === 'reading_bottleneck' && bottleneckText !== PENDING_TEXT && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
            World State
          </p>
          <p className="text-sm text-slate-400">{currentChapter.bottleneck.worldStateAfter}</p>
        </div>
      )}

      {/* Branch effects note */}
      {state.phase === 'reading_branch' && activeBranch?.worldStateEffects && branchText !== PENDING_TEXT && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 mb-1">
            Effects
          </p>
          <p className="text-sm text-slate-400">{activeBranch.worldStateEffects}</p>
        </div>
      )}
    </div>
  )
}

function PendingTextCard({
  loading,
  onGenerate,
}: {
  loading: boolean
  onGenerate: () => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 flex flex-col items-center gap-4 text-center">
      {loading ? (
        <>
          <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Generating scene...</p>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            This scene has not been written yet. Generate it now?
          </p>
          <button
            onClick={onGenerate}
            className="rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-5 py-2 transition-colors"
          >
            Generate scene
          </button>
        </>
      )}
    </div>
  )
}
