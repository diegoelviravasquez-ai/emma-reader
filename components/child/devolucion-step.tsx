'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Action } from '@/components/eco/actions'
import { EchoField } from '@/components/eco/echo-field'
import { SyllableText } from '@/components/eco/syllable-text'
import { Eyebrow, Honesty } from '@/components/shell/app-shell'
import type { Item } from '@/lib/content'
import { syllablesOf } from '@/lib/content'
import { pauseBreaks } from '@/lib/engine/analyze'
import { COMPREHENSION_LABEL, DIMENSION_LABEL } from '@/lib/engine/scaffolds'
import type { Contract } from '@/lib/engine/types'
import { type Playback, playBuffer, playModel } from '@/lib/engine/voice'
import type { LastReading } from './child-flow'

const MODEL_SYL_RATE = 4

/** La devolución: el mismo material, re-prosodizado en la cadencia del niño, + una sola palanca. */
export function DevolucionStep({ item, last, contract, onAgain }: { item: Item; last: LastReading; contract: Contract; onAgain: () => void }) {
  const [active, setActive] = useState(-1)
  const [playing, setPlaying] = useState<'propia' | 'modelo' | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  useEffect(() => () => stopRef.current?.(), [])

  const syllables = syllablesOf(item).length
  const breaks = useMemo(() => {
    const own = pauseBreaks(last.capture.buffer, syllables)
    return own.length ? own : item.breaks
  }, [last.capture.buffer, syllables, item.breaks])

  const rate = Math.min(1.25, Math.max(0.6, (last.measurement.raw.sylRate || MODEL_SYL_RATE) / MODEL_SYL_RATE))
  const { barrier, andamio } = contract
  const lever = andamio.devolucion

  function playOwn() {
    stopRef.current?.()
    setPlaying('propia')
    const dur = last.capture.buffer.duration * 1000
    const timers = Array.from({ length: syllables }, (_, i) => setTimeout(() => setActive(i), 250 + (i / syllables) * (dur - 600)))
    const stop = playBuffer(last.capture.buffer, () => {
      setActive(-1)
      setPlaying(null)
    })
    stopRef.current = () => {
      stop()
      timers.forEach(clearTimeout)
      setActive(-1)
    }
  }

  function playModelAtPace() {
    stopRef.current?.()
    setPlaying('modelo')
    const p: Playback = playModel(item, { rate, onSyllable: setActive })
    p.done.then(() => setPlaying(null))
    stopRef.current = p.stop
  }

  const whereLabel =
    barrier?.plano === 'comprension' && barrier.tipo
      ? `qué entiende · ${COMPREHENSION_LABEL[barrier.tipo]}`
      : barrier?.dimension
        ? `cómo lee · ${DIMENSION_LABEL[barrier.dimension]}`
        : null

  return (
    <section className="relative flex flex-1 flex-col gap-10 px-6 pb-12 md:px-16" aria-labelledby="dev-title">
      <EchoField tone="jade" size="130vmin" className="opacity-70" />

      <div className="relative flex flex-col gap-3">
        <Eyebrow>La devolución</Eyebrow>
        <h1 id="dev-title" className="serif-display text-balance text-5xl font-light leading-[1.05] md:text-6xl">
          Te lo devuelvo con tu propia música.
        </h1>
      </div>

      <div className="relative grid flex-1 items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <SyllableText item={item} active={active} breaks={breaks} highlight={barrier?.fragmento} />
          <p className="text-sm text-muted-foreground">
            Los cortes de línea son tus pausas. Mismo texto, no más fácil: solo en tu cadencia.
          </p>
          <div className="flex flex-wrap gap-3">
            <Action variant="jade" icon="play" onClick={playOwn} disabled={playing !== null}>
              {playing === 'propia' ? 'Sonando…' : 'Tu propia música'}
            </Action>
            <Action variant="jade" icon="play" onClick={playModelAtPace} disabled={playing !== null}>
              {playing === 'modelo' ? 'Sonando…' : 'El modelo, a tu paso'}
            </Action>
          </div>
        </div>

        <aside className="sheet rise flex flex-col gap-6 rounded-[2rem] p-8">
          {barrier && (
            <div className="flex flex-col gap-2">
              {whereLabel && <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{whereLabel}</p>}
              <p className="text-base leading-relaxed text-muted-foreground">
                <span className="border-b border-dotted border-clay/70">{barrier.hypothesis}</span>
              </p>
            </div>
          )}
          {lever && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-ochre">una sola palanca</p>
              <p className="serif-text text-3xl italic leading-snug text-jade">{lever.text}</p>
            </div>
          )}
          <p className="serif-text text-lg">No te doy la respuesta: te doy otra vuelta.</p>
        </aside>
      </div>

      <div className="relative flex flex-wrap items-center gap-4">
        <Action icon="rec" onClick={onAgain}>
          Léelo otra vez
        </Action>
        <Honesty className="md:ml-auto max-w-md">
          Es una hipótesis, no una etiqueta: se confirma o se descarta con tu siguiente lectura. Tu grabación solo vive en esta pantalla.
        </Honesty>
      </div>
    </section>
  )
}
