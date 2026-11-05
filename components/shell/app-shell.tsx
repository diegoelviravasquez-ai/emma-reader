'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/clase', label: 'Alumno' },
  { href: '/docente', label: 'Docente' },
  { href: '/casos', label: 'Casos' },
  { href: '/ajustes', label: 'Ajustes' },
]

function subscribe(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

function OfflineMark() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  return (
    <span className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
      <span className={cn('size-1.5 rounded-full', online ? 'bg-ochre' : 'bg-jade')} aria-hidden="true" />
      {online ? 'en este dispositivo · no usa la red' : 'modo avión · todo funciona'}
    </span>
  )
}

export function AppShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname()
  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5 md:px-10">
        <Link href="/" className="flex shrink-0 items-baseline gap-3" aria-label="EMMA, inicio">
          <span className="serif-display text-xl tracking-tight sm:text-2xl">EMMA</span>
          <span className="hidden text-xs text-muted-foreground lg:inline">lee a tu ritmo</span>
        </Link>
        <nav aria-label="Principal" className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href === '/clase' && pathname === '/nino')
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-2 text-xs transition-colors sm:px-3.5 sm:text-sm',
                  active ? 'bg-ink/[0.06] text-ink' : 'text-muted-foreground hover:text-ink',
                )}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
        <OfflineMark />
      </header>
      <main className={cn('relative flex flex-1 flex-col', className)}>{children}</main>
    </div>
  )
}

export function Honesty({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-xs leading-relaxed text-muted-foreground', className)}>{children}</p>
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground', className)}>{children}</p>
}
