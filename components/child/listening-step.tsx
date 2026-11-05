'use client'

import { useEffect, useRef, useState } from 'react'
import { Action } from '@/components/eco/actions'
import { EchoField } from '@/components/eco/echo-field'
import { SyllableText } from '@/components/eco/syllable-text'
import { Honesty } from '@/components/shell/app-shell'
import type { Item } from '@/lib/content'
import { syllablesOf } from '@/lib/content'
import { type CaptureResult, recordReading } from '@/lib/engine/capture'

const DURATION = 3500

export function ListeningStep({
  item,
  attempt,
  onCaptured,
  onCancel,
}: {
  item: Item
  attempt: number
  onCaptured: (c: CaptureResult) => void
  onCancel: () => void
}) {
  const [phase, setPhase] = useState<'permiso' | 'escuchando' | 'analizando'>('permiso')
  const [level, setLevel] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const started = useRef(false)
  const done = useRef(onCaptured)
  done.current = onCaptured
  const count = syllablesOf(item).length

  useEffect(() => {
    if (started.current) return
    started.current = true
    let raf = 0
    let t0 = 0
    const tick = () => {
      setElapsed(Math.min(DURATION, performance.now() - t0))
      raf = requestAnimationFrame(tick)
    }
    recordReading({
      durationMs: DURATION,
      syllables: count,
      contour: item.contour,
      attempt,
      onLevel: setLevel,
      onStart: () => {
        setPhase('escuchando')
        t0 = performance.now()
        tick()
      },
    }).then((capture) => {
      cancelAnimationFrame(raf)
      setPhase('analizando')
      requestAnimationFrame(() => done.current(capture))
    })
    return () => cancelAnimationFrame(raf)
  }, [attempt, count, item.contour])

  const progress = elapsed / DURATION
  const active = phase === 'escuchando' ? Math.min(count - 1, Math.floor(progress * count * 1.05)) : -1
  const remaining = ((DURATION - elapsed) / 1000).toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const r = 30
  const c = 2 * Math.PI * r

  return (
    <section className="relative flex flex-1 flex-col items-center justify-between gap-10 px-6 pb-12 pt-6 md:px-16" aria-live="polite">
      <EchoField tone="clay" mode="active" level={level} size="105vmin" rings={7} />

      <div className="relative flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 text-center">
        <SyllableText item={item} active={active} tone="clay" className="text-center" />
      </div>

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative grid size-24 place-items-center">
          <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="36" cy="36" r={r} fill="none" className="stroke-ink" strokeOpacity={0.1} strokeWidth={1.5} />
            <circle
              cx="36"
              cy="36"
              r={r}
              fill="none"
              className="stroke-clay"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={`${c * progress} ${c}`}
            />
          </svg>
          <span className="serif-display text-xl tabular-nums text-clay">{phase === 'escuchando' ? `${remaining} s` : '·'}</span>
        </div>
        <p className="serif-text text-2xl">
          {phase === 'permiso' && 'Preparando el micrófono…'}
          {phase === 'escuchando' && 'Escuchando… léelo ahora.'}
          {phase === 'analizando' && 'Dibujando tu huella…'}
        </p>
        <Honesty className="max-w-md text-center">Tu voz se analiza aquí, en este dispositivo. No se guarda ni se envía.</Honesty>
        {phase === 'permiso' && (
          <Action variant="quiet" onClick={onCancel}>
            Volver
          </Action>
        )}
      </div>
    </section>
  )
}
