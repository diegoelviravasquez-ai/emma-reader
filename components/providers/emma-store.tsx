'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Barrier, Bands, Disposicion, Envelope, Measurement, RawProsody } from '@/lib/engine/types'

export interface Settings {
  theme: 'claro' | 'oscuro' | 'sistema'
  largeText: boolean
  reduceMotion: boolean
  easyText: boolean
}

export interface TeacherReference {
  raw: RawProsody
  envelope: Envelope
  simulated: boolean
}

export interface Reading {
  id: string
  who: 'docente' | number
  itemId: string
  measurement: Measurement
  envelope: Envelope
  at: number
}

export interface Hypothesis {
  id: string
  student: number
  itemId: string
  barrier: Barrier
  readingId: string
  verdict?: 'confirma' | 'matiza' | 'descarta'
  teacherFirst?: string
  note?: string
}

interface Store {
  settings: Settings
  setSettings: (s: Partial<Settings>) => void
  student: number | null
  setStudent: (n: number | null) => void
  disposicion: Disposicion | null
  setDisposicion: (d: Disposicion | null) => void
  references: Record<string, TeacherReference>
  setReference: (itemId: string, ref: TeacherReference) => void
  readings: Reading[]
  addReading: (r: Omit<Reading, 'id' | 'at'>) => Reading
  trajectories: Record<number, Record<string, number[]>>
  hypotheses: Hypothesis[]
  addHypothesis: (h: Omit<Hypothesis, 'id'>) => void
  judge: (id: string, patch: Partial<Hypothesis>) => void
}

const DEFAULT_SETTINGS: Settings = { theme: 'sistema', largeText: false, reduceMotion: false, easyText: false }
const SETTINGS_KEY = 'emma:ajustes'

const EmmaContext = createContext<Store | null>(null)

function applySettings(s: Settings) {
  const root = document.documentElement
  const dark = s.theme === 'oscuro' || (s.theme === 'sistema' && matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', dark)
  root.classList.toggle('text-large', s.largeText)
  root.classList.toggle('reduce-motion', s.reduceMotion)
}

let counter = 0
const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`

/**
 * Estado de la sesión de clase. Solo en memoria: las lecturas, la κ y las
 * hipótesis desaparecen al cerrar. Solo los ajustes de accesibilidad se recuerdan.
 */
export function EmmaProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS)
  const [student, setStudent] = useState<number | null>(null)
  const [disposicion, setDisposicion] = useState<Disposicion | null>(null)
  const [references, setReferences] = useState<Record<string, TeacherReference>>({})
  const [readings, setReadings] = useState<Reading[]>([])
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) })
    } catch {}
  }, [])

  useEffect(() => {
    applySettings(settings)
    if (settings.theme !== 'sistema') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applySettings(settings)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [settings])

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const setReference = useCallback((itemId: string, ref: TeacherReference) => {
    setReferences((r) => ({ ...r, [itemId]: ref }))
  }, [])

  const addReading = useCallback((r: Omit<Reading, 'id' | 'at'>) => {
    const reading: Reading = { ...r, id: uid(), at: Date.now() }
    setReadings((list) => [...list, reading])
    return reading
  }, [])

  const addHypothesis = useCallback((h: Omit<Hypothesis, 'id'>) => {
    setHypotheses((list) => [...list, { ...h, id: uid() }])
  }, [])

  const judge = useCallback((id: string, patch: Partial<Hypothesis>) => {
    setHypotheses((list) => list.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }, [])

  const trajectories = useMemo(() => {
    const out: Record<number, Record<string, number[]>> = {}
    for (const r of readings) {
      if (r.who === 'docente' || r.measurement.empty) continue
      out[r.who] ??= {}
      ;(out[r.who][r.itemId] ??= []).push(r.measurement.kappa)
    }
    return out
  }, [readings])

  const value: Store = {
    settings,
    setSettings,
    student,
    setStudent,
    disposicion,
    setDisposicion,
    references,
    setReference,
    readings,
    addReading,
    trajectories,
    hypotheses,
    addHypothesis,
    judge,
  }

  return <EmmaContext.Provider value={value}>{children}</EmmaContext.Provider>
}

export function useEmma() {
  const ctx = useContext(EmmaContext)
  if (!ctx) throw new Error('useEmma debe usarse dentro de EmmaProvider')
  return ctx
}

/** Integrar sin asimilar: la franja se abre alrededor de la cadencia del docente. */
export function bandsFromReference(base: Bands, ref?: TeacherReference): Bands {
  if (!ref || ref.raw.nuclei < 2) return base
  const { nPVI, pctV, deltaF0St } = ref.raw
  return {
    nPVI: nPVI > 0 ? [Math.max(10, nPVI - 14), nPVI + 14] : base.nPVI,
    pctV: [Math.max(20, pctV - 16), Math.min(98, pctV + 16)],
    deltaF0: deltaF0St > 0 ? [Math.max(1.5, deltaF0St - 3.5), deltaF0St + 4] : base.deltaF0,
  }
}
