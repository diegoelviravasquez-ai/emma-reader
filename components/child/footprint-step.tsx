'use client'

import { useEffect, useRef, useState } from 'react'
import { Action } from '@/components/eco/actions'
import { EchoField } from '@/components/eco/echo-field'
import { Footprint, FootprintLegend } from '@/components/eco/footprint'
import { KappaRing } from '@/components/eco/kappa-ring'
import { Eyebrow, Honesty } from '@/components/shell/app-shell'
import type { Item } from '@/lib/content'
import { playBuffer } from '@/lib/engine/voice'
import type { LastReading } from './child-flow'

const DIMS = [
  { key: 'nPVI_V', label: 'ritmo' },
  { key: 'pctV', label: 'cadencia' },
  { key: 'deltaF0', label: 'melodía' },
  { key: 'fluency', label: 'fluidez' },
] as const

function describe(v: number) {
  if (v >= 80) return 'suena a ti'
  if (v >= 55) return 'va llegando'
  return 'aquí hay trabajo'
}

export function FootprintStep({
  item,
  last,
  baseline,
  franja,
  onContinue,
  onRetry,
}: {
  item: Item
  last: LastReading
  baseline: number | null
  franja: number
  onContinue: () => void
  onRetry: () => void
}) {
  const { measurement: m, envelope, capture } = last
  const [playing, setPlaying] = useState(false)
  const stop = useRef<(() => void) | null>(null)
  useEffect(() => () => stop.current?.(), [])

  const delta = baseline !== null && baseline !== m.kappa ? m.kappa - baseline : null

  if (m.empty) {
    return (
      <section className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <EchoField tone="ochre" />
        <h1 className="serif-display relative text-5xl font-light">No te he oído esta vez.</h1>
        <p className="relative max-w-md text-lg leading-relaxed text-muted-foreground">
          Acércate un poco a la tablet y vuelve a leerlo cuando quieras.
        </p>
        <Action className="relative" icon="rec" onClick={onRetry}>
          Leer otra vez
        </Action>
      </section>
    )
  }

  return (
    <section className="relative flex flex-1 flex-col gap-10 px-6 pb-12 md:px-16" aria-labelledby="huella-title">
      <EchoField tone="jade" className="opacity-50" />

      <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="rise flex flex-col gap-3">
          <Eyebrow>{item.text}</Eyebrow>
          <h1 id="huella-title" className="serif-display text-balance text-6xl font-light leading-[1.02] md:text-7xl">
            Así sonó tu lectura.
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            No es una nota. Es el dibujo de tu voz: dónde corres, dónde paras, dónde sube.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <KappaRing value={m.kappa} franja={franja} />
          {delta !== null && (
            <p className="text-sm text-muted-foreground">
              frente a tu primera lectura
              <span className="serif-display block text-3xl text-jade">{`${delta > 0 ? '+' : ''}${delta}`}</span>
            </p>
          )}
        </div>
      </div>

      <figure className="sheet relative flex flex-col gap-5 rounded-[2rem] p-6 md:p-10">
        <Footprint envelope={envelope} height={240} />
        <figcaption className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <FootprintLegend />
          <span className="text-xs text-muted-foreground">{`${envelope.durationS.toLocaleString('es', { maximumFractionDigits: 1 })} s grabados`}</span>
        </figcaption>
      </figure>

      <ul className="relative grid grid-cols-2 gap-6 md:grid-cols-4">
        {DIMS.map((d) => (
          <li key={d.key} className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">{d.label}</span>
            <span className="h-px w-full bg-ink/10">
              <span className="block h-px bg-jade transition-[width] duration-1000" style={{ width: `${m[d.key]}%` }} />
            </span>
            <span className="serif-text text-lg italic">{describe(m[d.key])}</span>
          </li>
        ))}
      </ul>

      {capture.simulated && (
        <p className="relative rounded-2xl bg-ochre/10 px-5 py-4 text-sm leading-relaxed">
          <strong className="font-medium">Simulación.</strong>{' '}
          {`${capture.reason ?? 'No hay micrófono.'} Esta huella sale de una lectura sintética, no de tu voz.`}
        </p>
      )}

      <div className="relative flex flex-wrap items-center gap-3">
        <Action
          variant="jade"
          icon="play"
          onClick={() => {
            stop.current?.()
            setPlaying(true)
            stop.current = playBuffer(capture.buffer, () => setPlaying(false))
          }}
        >
          {playing ? 'Sonando…' : 'Escuchar tu lectura'}
        </Action>
        <Action icon="next" onClick={onContinue}>
          Seguir
        </Action>
        <Honesty className="md:ml-auto">Huella de lectura, no detección de atención. Se borra al cerrar.</Honesty>
      </div>
    </section>
  )
}
