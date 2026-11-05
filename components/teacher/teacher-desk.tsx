'use client'

import { useState } from 'react'
import { Eyebrow, Honesty } from '@/components/shell/app-shell'
import { cn } from '@/lib/utils'
import { BlindJudgment } from './blind-judgment'
import { Calibration } from './calibration'
import { Trajectories } from './trajectories'

const TABS = [
  { id: 'mapa', label: 'Mapa de κ' },
  { id: 'juicio', label: 'Juicio ciego' },
  { id: 'calibrar', label: 'Tu voz de referencia' },
] as const

type Tab = (typeof TABS)[number]['id']

export function TeacherDesk() {
  const [tab, setTab] = useState<Tab>('mapa')
  return (
    <section className="relative flex flex-1 flex-col gap-10 px-6 pb-12 md:px-16" aria-labelledby="doc-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <Eyebrow>Docente</Eyebrow>
          <h1 id="doc-title" className="serif-display text-6xl font-light leading-[1.02] md:text-7xl">
            La máquina da señales.
            <span className="block text-muted-foreground">El juicio es tuyo.</span>
          </h1>
        </div>
        <div role="tablist" aria-label="Secciones del docente" className="flex gap-1 rounded-full bg-ink/[0.04] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-full px-4 py-2.5 text-sm transition-colors',
                tab === t.id ? 'sheet text-ink' : 'text-muted-foreground hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="flex flex-1 flex-col">
        {tab === 'mapa' && <Trajectories />}
        {tab === 'juicio' && <BlindJudgment />}
        {tab === 'calibrar' && <Calibration />}
      </div>

      <Honesty>
        Evidencia individual, offline. Sin ranking entre niños, sin inferencia automática de estados, sin diagnóstico. Todo se borra al cerrar la
        sesión.
      </Honesty>
    </section>
  )
}
