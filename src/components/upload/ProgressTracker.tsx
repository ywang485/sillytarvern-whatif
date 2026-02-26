'use client'

import { useEffect, useRef, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import type { GenerationProgress } from '@/types'

const STEP_LABELS = [
  'Extract text',
  'Analyze structure',
  'Character cards',
  'World lore',
  'Story branches',
]

interface Props {
  storyId: string
  onComplete: () => void
  onError: (message: string) => void
}

export function ProgressTracker({ storyId, onComplete, onError }: Props) {
  const [progress, setProgress] = useState<GenerationProgress | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false

    intervalRef.current = setInterval(async () => {
      if (doneRef.current) return

      try {
        const res = await fetch(`/api/stories/${storyId}/progress`)
        if (!res.ok) return
        const p: GenerationProgress = await res.json()
        setProgress(p)

        if (p.status === 'complete') {
          doneRef.current = true
          clearInterval(intervalRef.current!)
          onComplete()
        } else if (p.status === 'error') {
          doneRef.current = true
          clearInterval(intervalRef.current!)
          onError(p.error ?? 'Generation failed.')
        }
      } catch {
        // network error, keep polling
      }
    }, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [storyId, onComplete, onError])

  const percentage =
    !progress
      ? 0
      : progress.status === 'complete'
      ? 100
      : Math.round((progress.step / progress.totalSteps) * 100)

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-200">
          {progress?.message ?? 'Starting...'}
        </p>
        <span className="text-xs text-slate-500">{percentage}%</span>
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="grid grid-cols-5 gap-1.5">
        {STEP_LABELS.map((label, i) => {
          const step = progress?.step ?? 0
          const isDone = progress?.status === 'complete' || i < step
          const isActive = i === step && progress?.status !== 'complete' && progress?.status !== 'error'
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                  isDone
                    ? 'bg-amber-500'
                    : isActive
                    ? 'bg-amber-500/60 animate-pulse'
                    : 'bg-white/10'
                }`}
              />
              <span className="hidden sm:block text-[10px] text-slate-500 text-center leading-tight">
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {progress?.status === 'error' && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3">
          Error: {progress.error}
        </p>
      )}
    </div>
  )
}
