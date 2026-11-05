'use client'

import { useEffect, useRef, useState } from 'react'
import { Action } from '@/components/eco/actions'
import { EchoField } from '@/components/eco/echo-field'
import { SyllableText } from '@/components/eco/syllable-text'
import { Eyebrow } from '@/components/shell/app-shell'
import type { Item } from '@/lib/content'
import { ITEMS } from '@/lib/content'
import { DIMENSION_LABEL } from '@/lib/engine/scaffolds'
import type { Andamio, Disposicion } from '@/lib/engine/types'
import { MODEL_SOURCE_LABEL, type ModelSource, type Playback, playModel } from '@/lib/engine/voice'
import { cn } from '@/lib/utils'

interface ReadingStepProps {
  item: Item
  itemIndex: number
  onChooseItem: (i: number) => void
  andamio: Andamio | null
  disposicion: Disposicion
  easy: boolean
  hasReference: boolean
  onRead: () => void
}

const LEVEL_OPACITY = { 0: 0, 1: 0.5, 2: 0.75, 3: 1 } as const

export function ReadingStep({ item, itemIndex, onChooseItem, andamio, disposicion, easy, hasReference, onRead }: ReadingStepProps) {
  const [active, setActive] = useState(-1)
  const [source, setSource] = useState<ModelSource | null>(null)
  const playback = useRef<Playback | null>(null)

  useEffect(() => () => playback.current?.stop(), [])

  function listen() {
    playback.current?.stop()
    const p = playModel(item, { onSyllable: setActive })
    playback.current = p
    setSource(p.source)
  }

  const showBreaks = andamio?.kind === 'chunk' || easy

  return (
    <section className="relative flex flex-1 flex-col px-6 pb-10 md:px-16" aria-labelledby="word-title">
      <EchoField tone="jade" size="115vmin" />

      <div className="relative flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <Eyebrow>{`Lectura · ${item.lang === 'en' ? 'inglés' : 'español'}`}</Eyebrow>
          <p className="text-sm text-muted-foreground">
            {hasReference ? 'Referencia: la voz de tu docente' : 'Referencia: el modelo por defecto'}
            {item.foco && ` · se trabaja: ${DIMENSION_LABEL[item.foco]}`}
          </p>
        </div>
        <nav aria-label="Elegir texto" className="flex gap-2">
          {ITEMS.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onChooseItem(i)}
              aria-current={i === itemIndex ? 'true' : undefined}
              aria-label={`Texto ${i + 1}: ${it.text}`}
              className={cn('h-1.5 w-8 rounded-full transition-colors', i === itemIndex ? 'bg-jade' : 'bg-ink/15 hover:bg-ink/30')}
            />
          ))}
        </nav>
      </div>

      <div className="relative grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="rise flex flex-col gap-8">
          <h1 id="word-title" className="sr-only">
            {`Lee: ${item.text}`}
          </h1>
          <SyllableText item={item} active={active} breaks={showBreaks ? item.breaks : []} easy={easy} />
          <p className="serif-text text-lg italic text-muted-foreground">{item.gloss}</p>
        </div>

        {andamio && andamio.level > 0 && (
          <aside
            aria-label="Andamio"
            className="sheet rise flex flex-col gap-4 rounded-[1.75rem] p-7 transition-opacity duration-1000"
            style={{ opacity: LEVEL_OPACITY[andamio.level] }}
          >
            <p className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{`se trabaja: ${andamio.dimension ? DIMENSION_LABEL[andamio.dimension] : ''}`}</span>
              <span className="flex items-center gap-1.5" aria-label={`Andamio nivel ${andamio.level} de 3`}>
                {[1, 2, 3].map((l) => (
                  <span key={l} className={cn('size-1.5 rounded-full', l <= andamio.level ? 'bg-ochre' : 'bg-ink/15')} />
                ))}
              </span>
            </p>
            <p className="serif-text text-2xl leading-snug">{andamio.instruction}</p>
            {andamio.kind === 'rhythm-tap' && <TapRow count={item.words.flat().length} />}
            {andamio.kind === 'melody-follow' && <ContourLine contour={item.contour} />}
            {disposicion === 'cansado' && <p className="text-sm text-muted-foreground">Puedes parar cuando quieras.</p>}
          </aside>
        )}
      </div>

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <Action variant="jade" icon="play" onClick={listen}>
            Escuchar el modelo
          </Action>
          <Action variant="clay" icon="rec" onClick={onRead}>
            Léelo tú
          </Action>
        </div>
        {source && <p className="text-xs text-muted-foreground">{MODEL_SOURCE_LABEL[source]}</p>}
      </div>
    </section>
  )
}

function TapRow({ count }: { count: number }) {
  const [taps, setTaps] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setTaps((t) => (t >= count ? 1 : t + 1))}
        className="grid h-16 place-items-center rounded-2xl bg-jade/[0.08] text-sm text-jade ring-1 ring-jade/20 active:scale-[0.98]"
      >
        un toque por sílaba
      </button>
      <div className="flex gap-1.5" aria-label={`${taps} de ${count} sílabas marcadas`}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < taps ? 'bg-jade' : 'bg-ink/10')} />
        ))}
      </div>
    </div>
  )
}

function ContourLine({ contour }: { contour: number[] }) {
  const pts = contour.map((c, i) => `${(i / Math.max(1, contour.length - 1)) * 300},${50 - c * 40}`).join(' ')
  return (
    <svg viewBox="-10 0 320 60" className="h-16 w-full" role="img" aria-label="Línea de entonación del modelo">
      <polyline points={pts} fill="none" className="stroke-clay draw" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ '--len': 600 } as React.CSSProperties} />
      {contour.map((c, i) => (
        <circle key={i} cx={(i / Math.max(1, contour.length - 1)) * 300} cy={50 - c * 40} r={3} className="fill-clay" />
      ))}
    </svg>
  )
}
