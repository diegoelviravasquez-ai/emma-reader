'use client'

import { useMemo, useState } from 'react'
import { Action } from '@/components/eco/actions'
import { EchoField } from '@/components/eco/echo-field'
import { Eyebrow, Honesty } from '@/components/shell/app-shell'
import type { ChoiceOption, Item } from '@/lib/content'
import type { ComprehensionResult, ComprehensionType, Operation } from '@/lib/engine/types'
import { cn } from '@/lib/utils'

const GESTURE_NAME: Record<Operation, string> = {
  reformula: 'Reformula',
  transfiere: 'Transfiere',
  objeta: 'Objeta',
  limites: 'Reconoce sus límites',
}
const ORDER: Operation[] = ['reformula', 'transfiere', 'objeta', 'limites']

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Comprensión demostrable: se demuestra HACIENDO. Completar no es comprender. */
export function ComprehensionStep({ item, onDone }: { item: Item; onDone: (r: ComprehensionResult) => void }) {
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState<Partial<Record<Operation, ChoiceOption>>>({})
  const [limits, setLimits] = useState<string[] | null>(null)
  const [unsure, setUnsure] = useState<string[]>([])
  const seed = useMemo(() => Math.floor(Math.random() * 1000), [])

  const op = ORDER[index]
  const gesture = item.gestures.find((g) => g.op === op)
  const finished = index >= ORDER.length

  function pick(option: ChoiceOption) {
    setPicks((p) => ({ ...p, [op]: option }))
    setTimeout(() => setIndex((i) => i + 1), 500)
  }

  function finish() {
    const misses = Object.values(picks).filter((o): o is ChoiceOption => Boolean(o && !o.ok && o.tipo))
    const ops: Record<Operation, boolean> = {
      reformula: Boolean(picks.reformula?.ok),
      transfiere: Boolean(picks.transfiere?.ok),
      objeta: Boolean(picks.objeta?.ok),
      limites: limits !== null,
    }
    let tipo: ComprehensionType | undefined
    let fragmento: string | undefined
    let hipotesis: string | undefined
    if (misses.length) {
      const counts = new Map<ComprehensionType, number>()
      misses.forEach((m) => counts.set(m.tipo!, (counts.get(m.tipo!) ?? 0) + 1))
      tipo = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      const first = misses.find((m) => m.tipo === tipo)
      fragmento = first?.fragmento
      hipotesis = first?.hipotesis
    } else if (limits && limits.length) {
      tipo = 'vocabulario'
      fragmento = limits[0]
      hipotesis = `Parece que aquí «${limits[0]}» aún no tiene sentido propio.`
    }
    onDone({ ops, tipo, fragmento, hipotesis })
  }

  return (
    <section className="relative flex flex-1 flex-col px-6 pb-12 md:px-16" aria-labelledby="comp-title">
      <EchoField tone="jade" className="opacity-40" />

      <div className="relative flex flex-col gap-3">
        <Eyebrow>Comprensión demostrable</Eyebrow>
        <h1 id="comp-title" className="serif-display text-balance text-5xl font-light leading-[1.05] md:text-6xl">
          Ahora, haz algo con lo que leíste.
        </h1>
        <p className="serif-text text-xl italic text-muted-foreground">{`«${item.text}»`}</p>
      </div>

      <ol className="relative mt-10 flex flex-wrap gap-x-8 gap-y-3" aria-label="Los cuatro gestos">
        {ORDER.map((o, i) => (
          <li
            key={o}
            aria-current={i === index ? 'step' : undefined}
            className={cn(
              'serif-display flex items-center gap-3 text-xl transition-colors',
              i === index ? 'text-ink' : i < index ? 'text-jade' : 'text-ink/30',
            )}
          >
            <span className={cn('h-px w-8 transition-colors', i <= index ? 'bg-current' : 'bg-ink/15')} aria-hidden="true" />
            {GESTURE_NAME[o]}
          </li>
        ))}
      </ol>

      <div className="relative flex flex-1 flex-col justify-center py-10">
        {!finished && gesture && (
          <div key={op} className="rise flex flex-col gap-8">
            <p className="serif-text max-w-3xl text-balance text-4xl leading-snug">{gesture.prompt}</p>
            <ul className="grid gap-4 md:grid-cols-3">
              {shuffle(gesture.options, seed + index).map((o) => {
                const chosen = picks[op] === o
                return (
                  <li key={o.text}>
                    <button
                      type="button"
                      onClick={() => pick(o)}
                      disabled={Boolean(picks[op])}
                      className={cn(
                        'sheet flex h-full w-full items-start rounded-[1.5rem] p-6 text-left text-lg leading-relaxed transition-[transform,box-shadow] hover:-translate-y-0.5 disabled:hover:translate-y-0',
                        chosen && 'ring-2 ring-jade',
                      )}
                    >
                      {o.text}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {!finished && op === 'limites' && (
          <div key="limites" className="rise flex flex-col gap-8">
            <p className="serif-text max-w-3xl text-balance text-4xl leading-snug">
              ¿Qué no tienes seguro todavía? Tócalo. Decirlo también es comprender.
            </p>
            <div className="flex flex-wrap gap-3">
              {item.limitWords.map((w) => {
                const on = unsure.includes(w)
                return (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setUnsure((u) => (on ? u.filter((x) => x !== w) : [...u, w]))}
                    className={cn(
                      'serif-display rounded-full px-6 py-3 text-2xl ring-1 transition-colors',
                      on ? 'bg-clay/10 text-clay ring-clay/50' : 'ring-ink/15 hover:ring-ink/30',
                    )}
                  >
                    {w}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              <Action
                icon="next"
                onClick={() => {
                  setLimits(unsure)
                  setIndex(ORDER.length)
                }}
              >
                {unsure.length ? 'Esto es lo que no sé aún' : 'Lo tengo todo claro'}
              </Action>
            </div>
          </div>
        )}

        {finished && (
          <div className="rise flex flex-col gap-6">
            <p className="serif-text max-w-2xl text-4xl leading-snug">Gracias. Ahora EMMA mira dónde ayudarte, sin darte la respuesta.</p>
            <div>
              <Action icon="next" onClick={finish}>
                Seguir
              </Action>
            </div>
          </div>
        )}
      </div>

      <Honesty className="relative">
        Basta con 3 de 4 gestos. Lo que falla no es una etiqueta: es una pista de qué devolverte. Demuestra la comprensión de esta tarea; no es
        prueba de eficacia.
      </Honesty>
    </section>
  )
}
