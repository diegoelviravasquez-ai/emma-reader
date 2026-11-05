import { EchoField } from '@/components/eco/echo-field'
import { Eyebrow, Honesty } from '@/components/shell/app-shell'
import type { Disposicion } from '@/lib/engine/types'

const OPTIONS: Array<{ value: Disposicion; face: string; label: string; note: string }> = [
  { value: 'con-ganas', face: '🙂', label: 'Con ganas', note: 'Vamos un poco más deprisa.' },
  { value: 'normal', face: '😐', label: 'Normal', note: 'A tu paso de siempre.' },
  { value: 'cansado', face: '😴', label: 'Cansado', note: 'Más apoyo, sin prisa. Puedes parar.' },
]

export function DisposicionStep({ student, onChoose }: { student: number; onChoose: (d: Disposicion) => void }) {
  return (
    <section className="relative flex flex-1 flex-col justify-center px-6 pb-16 md:px-16" aria-labelledby="dispo-title">
      <EchoField tone="ochre" size="140vmin" className="opacity-60" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-14 md:grid-cols-[1fr_1.3fr] md:items-end">
        <div className="rise flex flex-col gap-5">
          <Eyebrow>{`Número ${student}`}</Eyebrow>
          <h1 id="dispo-title" className="serif-display text-balance text-6xl font-light leading-[1.02] md:text-7xl">
            ¿Cómo estás hoy?
          </h1>
          <p className="max-w-sm text-pretty text-lg leading-relaxed text-muted-foreground">
            No hay respuesta incorrecta. Lo dices tú; EMMA no lo adivina.
          </p>
        </div>
        <ul className="flex flex-col gap-4">
          {OPTIONS.map((o, i) => (
            <li key={o.value} className="rise" style={{ animationDelay: `${0.12 + i * 0.1}s` }}>
              <button
                type="button"
                onClick={() => onChoose(o.value)}
                className="sheet group flex w-full items-center gap-6 rounded-[1.75rem] px-7 py-6 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-jade"
              >
                <span className="text-5xl" aria-hidden="true">
                  {o.face}
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="serif-display text-3xl font-light">{o.label}</span>
                  <span className="text-sm text-muted-foreground">{o.note}</span>
                </span>
                <span className="text-jade opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <Honesty className="relative mx-auto mt-14 w-full max-w-6xl">
        La disposición es una declaración del niño, no una inferencia de la máquina. Solo ajusta cuánto apoyo se ofrece.
      </Honesty>
    </section>
  )
}
