import { memo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'

interface BranchNodeData {
  title: string
  summary: string
  fullText: string
  worldStateEffects: string
  branchIndex: number
}

export const BranchNode = memo(({ data }: { data: BranchNodeData }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-xl border border-violet-500/30 bg-slate-900/90 backdrop-blur px-4 py-3 min-w-[180px] max-w-[240px] cursor-pointer shadow-md hover:border-violet-500/60 transition-colors"
      onClick={() => setExpanded((v) => !v)}
    >
      <Handle type="target" position={Position.Top} className="!bg-violet-500" />

      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-900 text-[10px] font-bold text-violet-300">
          {data.branchIndex + 1}
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-200 leading-snug">
            {data.title}
          </p>
          {!expanded && (
            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
              {data.summary}
            </p>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          <p className="text-[10px] text-slate-400 leading-relaxed">{data.summary}</p>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-8">
            {data.fullText}
          </p>
          {data.worldStateEffects && (
            <p className="text-[10px] text-violet-400/80 italic border-t border-white/5 pt-2">
              {data.worldStateEffects}
            </p>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-violet-500" />
    </div>
  )
})

BranchNode.displayName = 'BranchNode'
