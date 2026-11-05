'use client'

import { useEffect, useState } from 'react'
import { useEmma } from '@/components/providers/emma-store'
import { cn } from '@/lib/utils'

interface EchoFieldProps {
  tone?: 'jade' | 'clay' | 'ochre'
  /** calm: eco en bucle lento. active: escuchando de verdad. */
  mode?: 'calm' | 'active'
  rings?: number
  /** Nivel de voz en vivo, 0..1. Hace latir el núcleo. */
  level?: number
  className?: string
  size?: string
}

const TONE = { jade: 'text-jade', clay: 'text-clay', ochre: 'text-ochre' }

function useStill() {
  const { settings } = useEmma()
  const [prefers, setPrefers] = useState(false)
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    setPrefers(mq.matches)
    const on = () => setPrefers(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return settings.reduceMotion || prefers
}

/**
 * Un solo SVG: los anillos se repintan en una capa en lugar de componer
 * una capa gigante por anillo, para que el eco no ahogue tablets modestas.
 */
export function EchoField({ tone = 'jade', mode = 'calm', rings = 6, level = 0, className, size = '120vmin' }: EchoFieldProps) {
  const still = useStill()
  const dur = mode === 'active' ? 2.6 : 9
  const peak = mode === 'active' ? 0.55 : 0.32
  const stroke = mode === 'active' ? 0.3 : 0.2

  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', TONE[tone], className)}>
      <div className="absolute left-1/2 top-1/2" style={{ width: size, height: size, translate: '-50% -50%' }}>
        <svg viewBox="0 0 100 100" className="size-full overflow-visible">
          <defs>
            <radialGradient id={`echo-core-${tone}`}>
              <stop offset="0" stopColor="currentColor" stopOpacity="1" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          {Array.from({ length: rings }, (_, i) => {
            const begin = `${(-dur / rings) * i}s`
            if (still) {
              return <circle key={i} cx="50" cy="50" r={12 + (i / rings) * 36} fill="none" stroke="currentColor" strokeWidth={stroke} opacity={0.25} />
            }
            return (
              <circle key={i} cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth={stroke} opacity="0" vectorEffect="non-scaling-stroke">
                <animate attributeName="r" values="9;50" dur={`${dur}s`} begin={begin} repeatCount="indefinite" calcMode="spline" keySplines="0.22 0.61 0.36 1" />
                <animate attributeName="opacity" values={`0;${peak};0`} keyTimes="0;0.12;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
              </circle>
            )
          })}
          <circle
            cx="50"
            cy="50"
            r={15 * (1 + level * 1.6)}
            fill={`url(#echo-core-${tone})`}
            opacity={mode === 'active' ? 0.1 + level * 0.3 : 0.06}
            style={{ transition: 'r 150ms, opacity 150ms' }}
          />
        </svg>
      </div>
    </div>
  )
}
