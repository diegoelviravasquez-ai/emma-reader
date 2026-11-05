import { cn } from '@/lib/utils'

type Variant = 'clay' | 'jade' | 'quiet'

const VARIANT: Record<Variant, string> = {
  clay: 'bg-clay text-on-clay shadow-[0_10px_30px_-12px_var(--clay)] hover:brightness-105',
  jade: 'bg-transparent text-jade ring-1 ring-jade/40 hover:bg-jade/[0.06]',
  quiet: 'bg-transparent text-muted-foreground hover:text-ink',
}

export function Action({
  variant = 'clay',
  className,
  icon,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: 'play' | 'rec' | 'next' | 'back' }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-14 items-center justify-center gap-3 rounded-full px-7 text-base font-medium transition-[filter,background-color,color,opacity] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-jade disabled:opacity-40',
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {icon === 'play' && <span aria-hidden="true" className="text-sm">►</span>}
      {icon === 'rec' && <span aria-hidden="true" className="size-2.5 rounded-full bg-current" />}
      {children}
      {icon === 'next' && <span aria-hidden="true">→</span>}
    </button>
  )
}
