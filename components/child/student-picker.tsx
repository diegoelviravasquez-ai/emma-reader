'use client'

import { useRouter } from 'next/navigation'
import { EchoField } from '@/components/eco/echo-field'
import { useEmma } from '@/components/providers/emma-store'
import { Eyebrow, Honesty } from '@/components/shell/app-shell'

const SEATS = Array.from({ length: 24 }, (_, i) => i + 1)

export function StudentPicker() {
  const router = useRouter()
  const { setStudent, setDisposicion, trajectories } = useEmma()

  function choose(n: number) {
    setStudent(n)
    setDisposicion(null)
    router.push('/nino')
  }

  return (
    <section className="relative flex flex-1 flex-col gap-12 px-6 pb-12 md:px-16" aria-labelledby="clase-title">
      <EchoField tone="ochre" className="opacity-40" />
      <div className="relative flex flex-col gap-3">
        <Eyebrow>Tablet compartida</Eyebrow>
        <h1 id="clase-title" className="serif-display text-6xl font-light leading-[1.02] md:text-7xl">
          ¿Qué número eres?
        </h1>
        <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">Sin nombres ni cuentas. Solo tu número de la lista.</p>
      </div>
      <ul className="relative grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
        {SEATS.map((n) => {
          const read = Boolean(trajectories[n])
          return (
            <li key={n}>
              <button
                type="button"
                onClick={() => choose(n)}
                className="sheet serif-display relative grid aspect-square w-full place-items-center rounded-[1.5rem] text-4xl font-light transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-jade"
                aria-label={`Número ${n}${read ? ', ya ha leído hoy' : ''}`}
              >
                {n}
                {read && <span className="absolute right-3 top-3 size-1.5 rounded-full bg-jade" aria-hidden="true" />}
              </button>
            </li>
          )
        })}
      </ul>
      <Honesty className="relative">El punto jade solo indica que ese número ya ha leído en esta sesión. No hay orden ni comparación.</Honesty>
    </section>
  )
}
