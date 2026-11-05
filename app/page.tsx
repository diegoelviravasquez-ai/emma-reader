import Link from 'next/link'
import { EchoField } from '@/components/eco/echo-field'

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-dvh flex-col overflow-hidden px-6 py-8 md:px-16 md:py-12">
      <EchoField tone="jade" size="min(140vmin, 1500px)" rings={7} className="[&>div]:left-[68%]" />

      <header className="relative flex items-baseline justify-between">
        <div className="flex flex-col gap-1">
          <span className="serif-display text-3xl tracking-tight">EMMA</span>
          <span className="text-xs tracking-wide text-muted-foreground">Extended Mind · Measurement &amp; Accompaniment</span>
        </div>
        <span className="text-xs text-muted-foreground">offline · sin nube · sin cuentas</span>
      </header>

      <section className="relative flex flex-1 flex-col justify-center gap-10 py-16" aria-labelledby="hero-title">
        <h1 id="hero-title" className="serif-display rise max-w-5xl text-balance text-[clamp(4.5rem,11vw,11rem)] font-light leading-[0.92] tracking-tight">
          Ve por el eco.
        </h1>
        <div className="rise flex max-w-xl flex-col gap-4" style={{ animationDelay: '.15s' }}>
          <p className="serif-text text-pretty text-2xl leading-snug md:text-3xl">
            La inteligencia artificial que se mide por cuánto menos la necesitas.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">EMMA no te enseña a leer. Te enseña a oírte.</p>
        </div>
        <div className="rise flex flex-wrap gap-3 pt-4" style={{ animationDelay: '.3s' }}>
          <Link
            href="/clase"
            className="inline-flex min-h-14 items-center gap-3 rounded-full bg-clay px-8 text-base font-medium text-on-clay shadow-[0_10px_30px_-12px_var(--clay)] transition-[filter] hover:brightness-105"
          >
            Empezar la clase <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/docente"
            className="inline-flex min-h-14 items-center rounded-full px-8 text-base text-jade ring-1 ring-jade/40 transition-colors hover:bg-jade/[0.06]"
          >
            Soy docente
          </Link>
          <Link href="/casos" className="inline-flex min-h-14 items-center px-4 text-base text-muted-foreground hover:text-ink">
            Ver casos trabajados
          </Link>
        </div>
      </section>

      <footer className="relative flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground md:flex-row md:justify-between">
        <span>Todo ocurre en este dispositivo. La voz se analiza y se olvida.</span>
        <span>Instrumento de medida de la lectura, no prueba de eficacia.</span>
      </footer>
    </main>
  )
}
