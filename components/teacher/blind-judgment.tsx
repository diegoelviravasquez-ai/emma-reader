'use client'

import { useEffect, useRef, useState } from 'react'
import { Action } from '@/components/eco/actions'
import { Footprint } from '@/components/eco/footprint'
import { type Hypothesis, useEmma } from '@/components/providers/emma-store'
import { getItem } from '@/lib/content'
import { COMPREHENSION_LABEL, DIMENSION_LABEL } from '@/lib/engine/scaffolds'
import { cn } from '@/lib/utils'

const VERDICTS = [
  { id: 'confirma', label: 'Confirmo' },
  { id: 'matiza', label: 'Matizo' },
  { id: 'descarta', label: 'Descarto' },
] as const

export function BlindJudgment() {
  const { hypotheses } = useEmma()
  const pending = hypotheses.filter((h) => !h.verdict)
  const judged = hypotheses.filter((h) => h.verdict)

  if (!hypotheses.length) {
    return (
      <div className="sheet flex flex-col gap-3 rounded-[2rem] p-10">
        <p className="serif-text text-3xl">No hay hipótesis que revisar.</p>
        <p className="max-w-lg leading-relaxed text-muted-foreground">
          Cuando EMMA proponga dónde podría estar una dificultad, llegará aquí como un trazo tentativo. Tú lo miras primero sin su etiqueta, y
          decides.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {pending.map((h) => (
        <JudgmentCard key={h.id} h={h} />
      ))}
      {judged.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground">{`${judged.length} ya revisadas`}</summary>
          <ul className="mt-4 flex flex-col gap-3">
            {judged.map((h) => (
              <li key={h.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                <span className="serif-display text-lg">{`Nº ${h.student}`}</span>
                <span className="text-muted-foreground">{getItem(h.itemId).text}</span>
                <span className={cn(h.verdict === 'descarta' ? 'text-muted-foreground line-through' : 'text-jade')}>{h.barrier.hypothesis}</span>
                <span className="text-ochre">{h.verdict}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function JudgmentCard({ h }: { h: Hypothesis }) {
  const { readings, judge } = useEmma()
  const reading = readings.find((r) => r.id === h.readingId)
  const item = getItem(h.itemId)
  const [own, setOwn] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [note, setNote] = useState('')
  const [audioUrl] = useState<string | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  useEffect(() => () => stopRef.current?.(), [])

  const where =
    h.barrier.plano === 'comprension' && h.barrier.tipo
      ? `qué entiende · ${COMPREHENSION_LABEL[h.barrier.tipo]}`
      : h.barrier.dimension
        ? `cómo lee · ${DIMENSION_LABEL[h.barrier.dimension]}`
        : ''

  return (
    <article className="sheet grid gap-8 rounded-[2rem] p-8 md:p-10 lg:grid-cols-[1.3fr_1fr]" aria-label={`Hipótesis del número ${h.student}`}>
      <div className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="serif-display text-3xl">{`Nº ${h.student}`}</p>
          <p className="serif-text text-lg italic text-muted-foreground">{item.text}</p>
        </div>
        {reading && <Footprint envelope={reading.envelope} height={150} />}
        {reading && <p className="text-xs text-muted-foreground">{`κ ${reading.measurement.kappa}${reading.measurement.simulated ? ' · lectura simulada' : ''}`}</p>}
        {audioUrl && <audio src={audioUrl} controls className="w-full" />}
      </div>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">1 · Tu lectura primero, sin ver la de EMMA</span>
          <textarea
            value={own}
            onChange={(e) => setOwn(e.target.value)}
            rows={3}
            placeholder="¿Dónde crees que está la dificultad?"
            className="resize-none rounded-2xl bg-ink/[0.03] p-4 text-base leading-relaxed outline-none ring-1 ring-ink/10 focus:ring-jade"
          />
        </label>

        {!revealed ? (
          <div className="relative flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">2 · La hipótesis de EMMA</span>
            <div className="select-none rounded-2xl border border-dashed border-ink/20 p-4 blur-sm" aria-hidden="true">
              Parece que aquí se traba algo en la lectura.
            </div>
            <div className="absolute inset-x-0 bottom-0 top-7 grid place-items-center">
              <Action variant="jade" onClick={() => setRevealed(true)} disabled={own.trim().length < 3}>
                Ver la hipótesis
              </Action>
            </div>
          </div>
        ) : (
          <div className="rise flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">{`2 · La hipótesis de EMMA · ${where}`}</span>
            <p className="rounded-2xl border border-dashed border-clay/50 p-4 text-lg leading-relaxed">{h.barrier.hypothesis}</p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Matiz (opcional)"
              className="rounded-2xl bg-ink/[0.03] px-4 py-3 text-base outline-none ring-1 ring-ink/10 focus:ring-jade"
            />
            <div className="flex flex-wrap gap-2 pt-2">
              {VERDICTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => judge(h.id, { verdict: v.id, teacherFirst: own, note })}
                  className={cn(
                    'rounded-full px-5 py-2.5 text-sm ring-1 transition-colors',
                    v.id === 'confirma' && 'text-jade ring-jade/40 hover:bg-jade/[0.06]',
                    v.id === 'matiza' && 'text-ochre ring-ochre/50 hover:bg-ochre/[0.08]',
                    v.id === 'descarta' && 'text-muted-foreground ring-ink/15 hover:text-ink',
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
