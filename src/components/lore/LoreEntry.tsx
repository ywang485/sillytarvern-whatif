'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import type { WorldInfoEntry, LoreCategory } from '@/types'

const CATEGORY_COLORS: Record<LoreCategory, string> = {
  location: 'bg-emerald-900 text-emerald-300',
  faction: 'bg-blue-900 text-blue-300',
  item: 'bg-amber-900 text-amber-300',
  concept: 'bg-violet-900 text-violet-300',
  event: 'bg-red-900 text-red-300',
  other: 'bg-slate-800 text-slate-400',
}

interface Props {
  entry: WorldInfoEntry
}

export function LoreEntry({ entry }: Props) {
  const categoryColor = CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.other

  return (
    <AccordionItem
      value={entry.id}
      className="border-white/10 bg-white/5 rounded-xl mb-2 px-1 overflow-hidden"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5 rounded-xl transition-colors">
        <div className="flex items-center gap-3 text-left w-full">
          <span className="text-[10px] tabular-nums text-slate-600 w-6 text-right shrink-0">
            {entry.insertion_order}
          </span>
          <span className="font-medium text-slate-200 flex-1">{entry.title}</span>
          <div className="flex items-center gap-2 shrink-0">
            {entry.keys.slice(0, 2).map((key) => (
              <span
                key={key}
                className="hidden sm:inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-500"
              >
                {key}
              </span>
            ))}
            {entry.keys.length > 2 && (
              <span className="hidden sm:inline-block text-[10px] text-slate-600">
                +{entry.keys.length - 2}
              </span>
            )}
            <Badge className={`text-[10px] ${categoryColor} border-0 ml-1`}>
              {entry.category}
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-3 pt-1">
          <p className="text-sm text-slate-300 leading-relaxed">{entry.content}</p>
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/8">
            <span className="text-[10px] text-slate-600 self-center">Keywords:</span>
            {entry.keys.map((key) => (
              <span
                key={key}
                className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-slate-400"
              >
                {key}
              </span>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
