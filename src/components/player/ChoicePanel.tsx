'use client'

import type { Storylet } from '@/types'

interface Props {
  branches: Storylet[]
  onChoose: (branchId: string) => void
}

export function ChoicePanel({ branches, onChoose }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-500/70 text-center mb-4">
        Choose your path
      </p>
      {branches.map((branch, i) => (
        <button
          key={branch.id}
          onClick={() => onChoose(branch.id)}
          className="w-full text-left rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition-all hover:border-amber-500/40 hover:bg-amber-500/10 hover:-translate-y-0.5 active:translate-y-0 group"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400 group-hover:bg-amber-500/20 group-hover:text-amber-400 transition-colors">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                {branch.title}
              </p>
              <p className="mt-1 text-sm text-slate-500 group-hover:text-slate-400 transition-colors leading-relaxed">
                {branch.summary}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
