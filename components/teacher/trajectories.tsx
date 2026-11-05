'use client'

import { useState } from 'react'
import { useEmma } from '@/components/providers/emma-store'
import { getItem } from '@/lib/content'
import { cn } from '@/lib/utils'

export function Trajectories() {
  const { trajectories } = useEmma()
  const students = Object.keys(trajectories)
    .map(Number)
    .sort((a, b) => a - b)
  const [selected, setSelected] = useState<number | null>(null)
  const current = selected ?? students[0] ?? null

  if (!students.length) {
    return (
      <div className="sheet flex flex-col gap-3 rounded-[2rem] p-10">
        <p className="serif-text text-3xl">Aún no hay lecturas en esta sesión.</p>
        <p className="max-w-lg leading-relaxed text-muted-foreground">
          Cuando un niño lea en la tablet, aquí aparecerá su trayectoria de κ por texto: su propio recorrido, nunca comparado con otro.
        </p>
      </div>
    )
  }

  const data = current !== null ? trajectories[current] : {}

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <nav aria-label="Número de alumno" className="flex flex-wrap gap-2 lg:flex-col">
        {students.map((n) => (
          <button
            key={n}
            type="button"
            aria-current={n === current ? 'true' : undefined}
            onClick={() => setSelected(n)}
            className={cn(
              'serif-display rounded-2xl px-5 py-3 text-left text-2xl transition-colors',
              n === current ? 'sheet text-ink' : 'text-muted-foreground hover:text-ink',
            )}
          >
            {`Nº ${n}`}
          </button>
        ))}
      </nav>
      <div className="sheet flex flex-col gap-8 rounded-[2rem] p-8 md:p-10">
        {Object.entries(data).map(([itemId, ks]) => {
          const item = getItem(itemId)
          return (
            <div key={itemId} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-4">
                <p className="serif-text text-2xl">{item.text}</p>
                <p className="text-sm tabular-nums text-muted-foreground">{ks.join(' → ')}</p>
              </div>
              <div className="relative flex items-end gap-2" style={{ height: 96 }}>
                <span
                  className="absolute inset-x-0 border-t border-dashed border-ochre/70"
                  style={{ bottom: `${item.franja}%` }}
                  aria-hidden="true"
                />
                {ks.map((k, i) => (
                  <span
                    key={i}
                    className={cn('w-10 rounded-t-md transition-[height] duration-1000', k >= item.franja ? 'bg-jade' : 'bg-jade/40')}
                    style={{ height: `${k}%` }}
                    title={`Lectura ${i + 1}: κ ${k}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{`línea ocre: franja ${item.franja}`}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
