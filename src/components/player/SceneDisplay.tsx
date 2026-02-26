'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  speakerName: string
  text: string
  label?: 'branch' | 'bottleneck'
  onContinue: () => void
  continueLabel: string
}

export function SceneDisplay({ speakerName, text, label, onContinue, continueLabel }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)
  const textRef = useRef(text)

  useEffect(() => {
    // Reset on new text
    textRef.current = text
    indexRef.current = 0
    setDisplayed('')
    setDone(false)

    const interval = setInterval(() => {
      if (indexRef.current >= text.length) {
        setDone(true)
        clearInterval(interval)
        return
      }
      // Advance by a few chars per tick for better performance on long texts
      const advance = Math.min(3, text.length - indexRef.current)
      indexRef.current += advance
      setDisplayed(text.slice(0, indexRef.current))
    }, 12)

    return () => clearInterval(interval)
  }, [text])

  const skipToEnd = () => {
    setDisplayed(text)
    setDone(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Speaker badge */}
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            label === 'bottleneck' ? 'bg-amber-400' : 'bg-violet-400'
          }`}
        />
        <span
          className={`text-sm font-semibold ${
            label === 'bottleneck' ? 'text-amber-400' : 'text-violet-400'
          }`}
        >
          {speakerName}
        </span>
        {label === 'bottleneck' && (
          <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
            Key Event
          </span>
        )}
      </div>

      {/* Text area — click to skip typewriter */}
      <div
        className="min-h-[180px] cursor-pointer"
        onClick={done ? undefined : skipToEnd}
        title={done ? undefined : 'Click to skip'}
      >
        <p className="text-slate-200 leading-8 text-base whitespace-pre-wrap">
          {displayed}
          {!done && <span className="animate-pulse text-slate-500">▋</span>}
        </p>
      </div>

      {/* Continue button */}
      {done && (
        <div className="flex justify-end">
          <Button
            onClick={onContinue}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6"
          >
            {continueLabel} →
          </Button>
        </div>
      )}
    </div>
  )
}
