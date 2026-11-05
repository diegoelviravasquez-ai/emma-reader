'use client'

import { type Settings, useEmma } from '@/components/providers/emma-store'
import { Eyebrow, Honesty } from '@/components/shell/app-shell'
import { cn } from '@/lib/utils'

const THEMES: Array<{ id: Settings['theme']; label: string }> = [
  { id: 'claro', label: 'Papel' },
  { id: 'oscuro', label: 'Carbón' },
  { id: 'sistema', label: 'Como el dispositivo' },
]

const TOGGLES: Array<{ key: 'largeText' | 'reduceMotion' | 'easyText'; label: string; note: string }> = [
  { key: 'largeText', label: 'Texto más grande', note: 'Aumenta todo el tamaño de letra.' },
  { key: 'reduceMotion', label: 'Menos movimiento', note: 'El eco queda quieto.' },
  { key: 'easyText', label: 'Lectura fácil', note: 'Más espacio entre palabras y cortes por grupos.' },
]

export function SettingsPanel() {
  const { settings, setSettings } = useEmma()
  return (
    <section className="flex flex-1 flex-col gap-12 px-6 pb-12 md:px-16" aria-labelledby="aj-title">
      <div className="flex flex-col gap-3">
        <Eyebrow>Ajustes</Eyebrow>
        <h1 id="aj-title" className="serif-display text-6xl font-light leading-[1.02] md:text-7xl">
          A la medida de quien lee.
        </h1>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 text-sm text-muted-foreground">Aspecto</legend>
        <div className="flex flex-wrap gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={settings.theme === t.id}
              onClick={() => setSettings({ theme: t.id })}
              className={cn(
                'serif-display rounded-full px-6 py-3 text-xl ring-1 transition-colors',
                settings.theme === t.id ? 'bg-jade/10 text-jade ring-jade/50' : 'ring-ink/15 hover:ring-ink/30',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <ul className="grid gap-4 md:grid-cols-3">
        {TOGGLES.map((t) => {
          const on = settings[t.key]
          return (
            <li key={t.key}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => setSettings({ [t.key]: !on })}
                className="sheet flex w-full items-start justify-between gap-6 rounded-[1.75rem] p-7 text-left"
              >
                <span className="flex flex-col gap-1">
                  <span className="serif-display text-2xl">{t.label}</span>
                  <span className="text-sm text-muted-foreground">{t.note}</span>
                </span>
                <span className={cn('relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors', on ? 'bg-jade' : 'bg-ink/15')} aria-hidden="true">
                  <span className={cn('absolute top-1 size-5 rounded-full bg-paper transition-[left]', on ? 'left-6' : 'left-1')} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <Honesty>Solo estos ajustes se recuerdan en el dispositivo. Las lecturas, la κ y las hipótesis se borran al cerrar.</Honesty>
    </section>
  )
}
