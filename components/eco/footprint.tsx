import type { Envelope } from '@/lib/engine/types'
import { cn } from '@/lib/utils'

interface FootprintProps {
  envelope: Envelope
  height?: number
  detail?: boolean
  tone?: 'jade' | 'clay'
  className?: string
  label?: string
}

const W = 1000

/** Huella de lectura dibujada desde el audio real: onda, vocales, pausas y entonación. */
export function Footprint({ envelope, height = 220, detail = true, tone = 'jade', className, label }: FootprintProps) {
  const { env, nuclei, pauses, pitch } = envelope
  const mid = height / 2
  const amp = height * 0.36
  const n = env.length
  if (n === 0) {
    return (
      <div className={cn('grid place-items-center text-sm text-muted-foreground', className)} style={{ height }}>
        No se oyó voz en esta lectura.
      </div>
    )
  }
  const x = (i: number) => (i / (n - 1)) * W

  const top = env.map((v, i) => `${x(i).toFixed(1)},${(mid - v * amp).toFixed(1)}`)
  const bottom = env.map((v, i) => `${x(i).toFixed(1)},${(mid + v * amp * 0.55).toFixed(1)}`).reverse()
  const area = `M${top.join(' L')} L${bottom.join(' L')} Z`
  const line = `M${top.join(' L')}`

  const pitchSegments: string[] = []
  let current: string[] = []
  pitch.forEach((p, i) => {
    if (p === null) {
      if (current.length > 1) pitchSegments.push(`M${current.join(' L')}`)
      current = []
    } else current.push(`${x(i).toFixed(1)},${(height * 0.12 + (1 - p) * height * 0.22).toFixed(1)}`)
  })
  if (current.length > 1) pitchSegments.push(`M${current.join(' L')}`)

  const stroke = tone === 'jade' ? 'stroke-jade' : 'stroke-clay'
  const fill = tone === 'jade' ? 'fill-jade' : 'fill-clay'

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className={cn('w-full overflow-visible', className)}
      style={{ height }}
      role="img"
      aria-label={label ?? `Huella de lectura: ${nuclei.length} núcleos silábicos, ${pauses.length} pausas largas.`}
    >
      {detail &&
        pauses.map(([a, b], i) => (
          <rect key={i} x={a * W} y={height * 0.08} width={Math.max(2, (b - a) * W)} height={height * 0.84} className="fill-ochre" opacity={0.14} rx={4} />
        ))}
      <line x1={0} x2={W} y1={mid} y2={mid} className="stroke-ink" strokeOpacity={0.12} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <path d={area} className={fill} opacity={0.12} />
      <path d={line} fill="none" className={cn(stroke, 'draw')} strokeWidth={1.6} vectorEffect="non-scaling-stroke" style={{ '--len': 2400 } as React.CSSProperties} />
      {detail &&
        pitchSegments.map((d, i) => (
          <path key={i} d={d} fill="none" className="stroke-clay" strokeWidth={1.4} strokeDasharray="1 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.85} />
        ))}
      {detail &&
        nuclei.map((p, i) => (
          <line key={i} x1={p * W} x2={p * W} y1={height * 0.86} y2={height * 0.94} className="stroke-ink" strokeOpacity={0.55} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        ))}
    </svg>
  )
}

export function FootprintLegend() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
      <li className="flex items-center gap-2">
        <span className="h-px w-5 bg-jade" aria-hidden="true" /> onda de voz
      </li>
      <li className="flex items-center gap-2">
        <span className="h-2.5 w-px bg-ink/60" aria-hidden="true" /> vocales (núcleos)
      </li>
      <li className="flex items-center gap-2">
        <span className="h-3 w-4 rounded-sm bg-ochre/25" aria-hidden="true" /> pausas
      </li>
      <li className="flex items-center gap-2">
        <span className="w-5 border-t border-dotted border-clay" aria-hidden="true" /> entonación
      </li>
    </ul>
  )
}
