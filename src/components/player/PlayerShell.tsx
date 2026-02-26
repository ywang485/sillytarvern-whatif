'use client'

import { useReducer } from 'react'
import type { FullStoryData, PlayerState, PlayerAction } from '@/types'
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
  const { narrative, characters, meta } = story
  const chapters = narrative.chapters
  const totalChapters = chapters.length

  const protagonist = characters.find((c) => c.id === narrative.protagonistId)
  const protagonistName = protagonist?.data.name ?? meta.config.protagonistName ?? 'You'

  const [state, dispatch] = useReducer(playerReducer, {
    currentChapterIndex: 0,
    chosenBranchIds: [],
    phase: 'choosing',
    activeBranchId: null,
  })

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

      {/* Content */}
      {state.phase === 'choosing' && (
        <ChoicePanel
          branches={currentChapter.branches}
          onChoose={(branchId) => dispatch({ type: 'CHOOSE_BRANCH', branchId })}
        />
      )}

      {state.phase === 'reading_branch' && (() => {
        const branch = currentChapter.branches.find((b) => b.id === state.activeBranchId)
        if (!branch) return null
        return (
          <SceneDisplay
            speakerName={protagonistName}
            text={branch.fullText}
            label="branch"
            onContinue={() => dispatch({ type: 'FINISH_BRANCH_READING' })}
            continueLabel="Continue to key event"
          />
        )
      })()}

      {state.phase === 'reading_bottleneck' && (
        <SceneDisplay
          speakerName="Narrator"
          text={currentChapter.bottleneck.text}
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
      )}

      {/* World state note after bottleneck */}
      {state.phase === 'reading_bottleneck' && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
            World State
          </p>
          <p className="text-sm text-slate-400">{currentChapter.bottleneck.worldStateAfter}</p>
        </div>
      )}

      {/* Branch effects note */}
      {state.phase === 'reading_branch' && (() => {
        const branch = currentChapter.branches.find((b) => b.id === state.activeBranchId)
        if (!branch?.worldStateEffects) return null
        return (
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 mb-1">
              Effects
            </p>
            <p className="text-sm text-slate-400">{branch.worldStateEffects}</p>
          </div>
        )
      })()}
    </div>
  )
}
