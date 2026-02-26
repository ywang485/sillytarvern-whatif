import { memo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'

interface ChapterNodeData {
  chapterNumber: number
  title: string
  bottleneckTitle: string
  bottleneckText: string
  worldStateAfter: string
}

export const ChapterNode = memo(({ data }: { data: ChapterNodeData }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-xl border-2 border-amber-500/60 bg-amber-950/80 backdrop-blur px-4 py-3 min-w-[200px] max-w-[260px] cursor-pointer shadow-lg shadow-amber-500/10"
      onClick={() => setExpanded((v) => !v)}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />

      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
          {data.chapterNumber}
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">
            Key Event
          </p>
          <p className="text-sm font-semibold text-amber-200 leading-snug">
            {data.bottleneckTitle}
          </p>
          <p className="text-[11px] text-amber-400/60 mt-0.5">Ch. {data.chapterNumber}: {data.title}</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-amber-500/20 pt-3">
          <p className="text-xs text-amber-100/70 leading-relaxed line-clamp-6">
            {data.bottleneckText}
          </p>
          <p className="text-[10px] text-amber-500/60 italic">
            {data.worldStateAfter}
          </p>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-amber-500" />
    </div>
  )
})

ChapterNode.displayName = 'ChapterNode'
