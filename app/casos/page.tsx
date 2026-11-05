import { AppShell, Eyebrow, Honesty } from '@/components/shell/app-shell'
import { WORKED_CASES } from '@/lib/content'

export const metadata = { title: 'Casos trabajados · EMMA' }

const STEPS = [
  ['produce', 'el niño'],
  ['hipotesis', 'hipótesis de EMMA'],
  ['palanca', 'la devolución'],
  ['demuestra', 'qué demuestra'],
] as const

export default function CasosPage() {
  return (
    <AppShell>
      <section className="flex flex-1 flex-col gap-12 px-6 pb-12 md:px-16" aria-labelledby="casos-title">
        <div className="flex flex-col gap-3">
          <Eyebrow>Comprensión demostrable</Eyebrow>
          <h1 id="casos-title" className="serif-display max-w-4xl text-balance text-6xl font-light leading-[1.02] md:text-7xl">
            Completar no es comprender.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Tres bucles reales: lo que el niño produce, dónde EMMA sospecha la barrera y la única palanca que devuelve.
          </p>
        </div>
        <ol className="grid gap-6 lg:grid-cols-3">
          {WORKED_CASES.map((c, i) => (
            <li key={c.texto} className="sheet rise flex flex-col gap-6 rounded-[2rem] p-8" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <span>{c.plano === 'prosodia' ? 'cómo lee' : 'qué entiende'}</span>
                <span className="text-ochre">{c.operacion}</span>
              </div>
              <p className="serif-display text-3xl leading-tight">{`«${c.texto}»`}</p>
              <dl className="flex flex-col gap-4">
                {STEPS.map(([k, label]) => (
                  <div key={k} className="flex flex-col gap-1 border-t border-ink/10 pt-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd
                      className={
                        k === 'palanca'
                          ? 'serif-text text-xl italic text-jade'
                          : k === 'hipotesis'
                            ? 'border-b border-dotted border-clay/60 pb-1 leading-relaxed'
                            : 'leading-relaxed'
                      }
                    >
                      {c[k]}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
        <Honesty>Hipótesis, no etiqueta. Demuestra la comprensión de esta tarea; no es prueba de eficacia.</Honesty>
      </section>
    </AppShell>
  )
}
