import { cn } from '@/lib/utils'

interface KappaRingProps {
  value: number
  franja?: number
  size?: number
  className?: string
  tone?: 'jade' | 'clay'
}

/** κ como anillo que respira. No es una nota: es una distancia a la propia franja. */
export function KappaRing({ value, franja, size = 168, className, tone = 'jade' }: KappaRingProps) {
  const r = 44
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value)) / 100
  const fr = franja !== undefined ? franja / 100 : null
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90 breathe" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={1.5} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className={tone === 'jade' ? 'stroke-jade' : 'stroke-clay'}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          style={{ transition: 'stroke-dasharray 1.6s cubic-bezier(.22,.61,.36,1)' }}
        />
        {fr !== null && (
          <circle
            cx={50 + r * Math.cos(fr * 2 * Math.PI)}
            cy={50 + r * Math.sin(fr * 2 * Math.PI)}
            r={1.8}
            className="fill-ochre"
          />
        )}
      </svg>
      <div className="flex flex-col items-center">
        <span className="serif-display text-ochre text-sm italic leading-none">κ</span>
        <span className="serif-display text-5xl font-light leading-none tabular-nums">{Math.round(value)}</span>
      </div>
      <span className="sr-only">{`κ ${Math.round(value)} de 100${franja ? `, franja en ${franja}` : ''}`}</span>
    </div>
  )
}
