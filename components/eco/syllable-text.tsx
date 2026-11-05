import { Fragment } from 'react'
import type { Item } from '@/lib/content'
import { cn } from '@/lib/utils'

interface SyllableTextProps {
  item: Item
  active?: number
  /** Cortes de línea tras estas sílabas (cadencia del niño o del modelo). */
  breaks?: number[]
  highlight?: string
  showDots?: boolean
  easy?: boolean
  className?: string
  tone?: 'jade' | 'clay'
}

/** La palabra protagonista: serif grande, sílabas con punto fino (wa·ter). */
export function SyllableText({ item, active = -1, breaks = [], highlight, showDots = true, easy, className, tone = 'jade' }: SyllableTextProps) {
  let g = -1
  const lines: React.ReactNode[][] = [[]]
  const hl = highlight?.toLowerCase().replace(/[.,]/g, '')

  item.words.forEach((word, wi) => {
    const plain = word.join('').toLowerCase().replace(/[.,]/g, '')
    const marked = hl !== undefined && hl.split(' ').includes(plain)
    const sylNodes = word.map((s, si) => {
      g++
      const idx = g
      const isActive = idx === active
      return (
        <Fragment key={si}>
          {si > 0 && showDots && <span className="syl-dot" aria-hidden="true">·</span>}
          <span
            className={cn(
              'transition-[color,opacity] duration-300',
              active >= 0 && !isActive && 'opacity-45',
              isActive && (tone === 'jade' ? 'text-jade' : 'text-clay'),
            )}
          >
            {s}
          </span>
        </Fragment>
      )
    })
    lines[lines.length - 1].push(
      <span
        key={wi}
        className={cn('inline-block whitespace-nowrap', marked && 'underline decoration-clay decoration-dotted decoration-2 underline-offset-[0.18em]')}
      >
        {sylNodes}
      </span>,
    )
    const lastIdx = g
    if (breaks.includes(lastIdx) && wi < item.words.length - 1) lines.push([])
  })

  return (
    <p
      lang={item.lang}
      aria-label={item.text}
      className={cn(
        'serif-display text-balance font-light text-ink',
        item.kind === 'palabra' ? 'text-[clamp(6rem,18vw,15rem)] leading-[0.9] tracking-tight' : 'text-[clamp(2.4rem,5.4vw,5rem)] leading-[1.15]',
        easy && 'tracking-wide',
        className,
      )}
    >
      {lines.map((ws, li) => (
        <span key={li} className="block" aria-hidden="true">
          {ws.map((w, i) => (
            <Fragment key={i}>
              {i > 0 && (easy ? '\u2003' : ' ')}
              {w}
            </Fragment>
          ))}
        </span>
      ))}
    </p>
  )
}
