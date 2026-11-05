'use client'

import { useState } from 'react'
import { Action } from '@/components/eco/actions'
import { EchoField } from '@/components/eco/echo-field'
import { Footprint } from '@/components/eco/footprint'
import { bandsFromReference, useEmma } from '@/components/providers/emma-store'
import { ITEMS, syllablesOf } from '@/lib/content'
import { analyze, envelopeOf } from '@/lib/engine/analyze'
import { recordReading } from '@/lib/engine/capture'
import { cn } from '@/lib/utils'

/** Integrar sin asimilar: la franja se abre alrededor de la cadencia real del docente. */
export function Calibration() {
  const { references, setReference, addReading } = useEmma()
  const [itemIndex, setItemIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const [level, setLevel] = useState(0)
  const item = ITEMS[itemIndex]
  const ref = references[item.id]
  const bands = bandsFromReference(item.bands, ref)

  async function record() {
    setRecording(true)
    const capture = await recordReading({ durationMs: 4000, syllables: syllablesOf(item).length, contour: item.contour, attempt: 3, onLevel: setLevel })
    const m = analyze(capture.buffer, { bands: item.bands, syllables: syllablesOf(item).length })
    const envelope = envelopeOf(capture.buffer)
    setReference(item.id, { raw: m.raw, envelope, simulated: capture.simulated })
    addReading({ who: 'docente', itemId: item.id, measurement: { ...m, simulated: capture.simulated }, envelope })
    setRecording(false)
    setLevel(0)
  }

  const fmt = (r: [number, number]) => `${Math.round(r[0])}–${Math.round(r[1])}`

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <nav aria-label="Textos" className="flex flex-col gap-2">
        {ITEMS.map((it, i) => (
          <button
            key={it.id}
            type="button"
            aria-current={i === itemIndex ? 'true' : undefined}
            onClick={() => setItemIndex(i)}
            className={cn(
              'flex items-center justify-between gap-3 rounded-2xl px-5 py-3 text-left transition-colors',
              i === itemIndex ? 'sheet' : 'text-muted-foreground hover:text-ink',
            )}
          >
            <span className="serif-text text-lg">{it.text}</span>
            {references[it.id] && <span className="size-1.5 shrink-0 rounded-full bg-jade" aria-label="calibrado" />}
          </button>
        ))}
      </nav>

      <div className="sheet relative flex flex-col gap-8 overflow-hidden rounded-[2rem] p-8 md:p-10">
        {recording && <EchoField tone="clay" mode="active" level={level} size="70vmin" />}
        <div className="relative flex flex-col gap-2">
          <p className="serif-text text-4xl">{item.text}</p>
          <p className="max-w-xl leading-relaxed text-muted-foreground">
            Léelo como lo leerías en clase, con tu acento y tu ritmo. EMMA abrirá la franja de los niños alrededor de tu voz, no de un estándar
            ajeno.
          </p>
        </div>

        {ref && <Footprint envelope={ref.envelope} height={150} className="relative" />}

        <dl className="relative grid grid-cols-3 gap-6">
          {[
            ['ritmo · nPVI', fmt(bands.nPVI)],
            ['cadencia · %V', fmt(bands.pctV)],
            ['melodía · ΔF0 st', fmt(bands.deltaF0)],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="serif-display text-3xl tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="relative text-xs text-muted-foreground">
          {ref ? `Franja calibrada con tu voz${ref.simulated ? ' (simulada: sin micrófono)' : ''}.` : 'Franja por defecto del idioma.'}
        </p>

        <div className="relative">
          <Action icon="rec" onClick={record} disabled={recording}>
            {recording ? 'Escuchando…' : ref ? 'Volver a grabar' : 'Grabar mi referencia'}
          </Action>
        </div>
      </div>
    </div>
  )
}
