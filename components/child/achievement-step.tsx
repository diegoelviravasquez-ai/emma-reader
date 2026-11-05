import { Action } from '@/components/eco/actions'
import { EchoField } from '@/components/eco/echo-field'
import { Honesty } from '@/components/shell/app-shell'
import type { Item } from '@/lib/content'

export function AchievementStep({ item, kappas, franja, onNext }: { item: Item; kappas: number[]; franja: number; onNext: () => void }) {
  return (
    <section className="relative flex flex-1 flex-col justify-center gap-12 px-6 pb-12 md:px-16" aria-labelledby="logro-title">
      <EchoField tone="jade" size="160vmin" rings={4} className="opacity-50" />
      <div className="rise relative flex max-w-4xl flex-col gap-6">
        <p className="serif-display text-6xl text-jade" aria-hidden="true">
          ✓
        </p>
        <h1 id="logro-title" className="serif-display text-balance text-7xl font-light leading-[1.02] md:text-8xl">
          ¡Lo tienes! Ya lo lees tú solo.
        </h1>
        <p className="serif-text text-2xl italic text-muted-foreground">{`«${item.text}»`}</p>
      </div>

      <div className="relative flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Tu recorrido con este texto</p>
        <ol className="flex items-end gap-3" aria-label="Trayectoria de κ">
          {kappas.map((k, i) => (
            <li key={i} className="flex flex-col items-center gap-2">
              <span className="w-10 rounded-t-md bg-jade/70" style={{ height: `${Math.max(6, k * 1.2)}px` }} />
              <span className="text-xs tabular-nums text-muted-foreground">{k}</span>
            </li>
          ))}
          <li className="ml-2 self-center text-xs text-ochre">{`franja ${franja}`}</li>
        </ol>
      </div>

      <div className="relative flex flex-wrap items-center gap-6">
        <Action icon="next" onClick={onNext}>
          Siguiente texto
        </Action>
        <Honesty className="max-w-md">El apoyo se ha retirado. Si lo necesitas otra vez, vuelve solo.</Honesty>
      </div>
    </section>
  )
}
