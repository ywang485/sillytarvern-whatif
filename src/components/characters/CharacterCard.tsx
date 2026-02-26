'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CharacterCard as CharacterCardType } from '@/types'

interface Props {
  character: CharacterCardType
}

export function CharacterCardView({ character }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { data } = character

  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer ${
        character.isProtagonist
          ? 'border-amber-500/40 bg-amber-950/30 hover:border-amber-500/70'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3
              className={`font-bold text-base ${
                character.isProtagonist ? 'text-amber-300' : 'text-slate-200'
              }`}
            >
              {data.name}
            </h3>
            {character.isProtagonist && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                Protagonist
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] bg-white/8 text-slate-400 border-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <span className="text-slate-600 text-sm mt-0.5">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Preview description */}
      {!expanded && (
        <div className="px-5 pb-4">
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/8">
          <ScrollArea className="max-h-[500px]">
            <div className="px-5 py-4 space-y-5">
              <Field label="Description" content={data.description} />
              <Field label="Personality" content={data.personality} />
              <Field label="Scenario" content={data.scenario} />

              {/* First message as speech bubble */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  First Message
                </p>
                <div className="rounded-xl rounded-tl-none bg-violet-950/50 border border-violet-500/20 px-4 py-3">
                  <p className="text-sm text-violet-200 leading-relaxed italic">
                    &ldquo;{data.first_mes}&rdquo;
                  </p>
                </div>
              </div>

              {/* Example dialogue */}
              {data.mes_example && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Example Dialogue
                  </p>
                  <div className="space-y-2 font-mono text-xs">
                    {data.mes_example.split('<START>').filter(Boolean).map((block, i) => (
                      <div key={i} className="space-y-1.5 border-l-2 border-white/10 pl-3">
                        {block.trim().split('\n').filter(Boolean).map((line, j) => {
                          const isUser = line.startsWith('{{user}}')
                          const isChar = line.startsWith('{{char}}')
                          const content = line.replace(/^\{\{(user|char)\}\}:\s*/, '')
                          return (
                            <div key={j} className={isUser ? 'text-slate-400' : isChar ? 'text-violet-300' : 'text-slate-600'}>
                              {isUser && <span className="text-slate-600">User: </span>}
                              {isChar && <span className="text-violet-500">{data.name}: </span>}
                              {content}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.creator_notes && (
                <div className="border-t border-white/8 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Creator Notes
                  </p>
                  <p className="text-xs text-slate-600 italic">{data.creator_notes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function Field({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </p>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}
