/**
 * Contrato estable motor ↔ interfaz.
 * La UI solo depende de estos tipos: se puede sustituir el analizador local
 * por un motor real sin tocar ninguna pantalla.
 */

export type Lang = 'es' | 'en'
export type Dimension = 'ritmo' | 'cadencia' | 'melodia' | 'fluidez'
export type ComprehensionType =
  | 'vocabulario'
  | 'causa-efecto'
  | 'inferencia'
  | 'referente'
  | 'secuencia'
export type Operation = 'reformula' | 'transfiere' | 'objeta' | 'limites'
export type Disposicion = 'con-ganas' | 'normal' | 'cansado'
export type AndamioKind = 'audio-model' | 'rhythm-tap' | 'chunk' | 'melody-follow' | 'none'
export type Level = 0 | 1 | 2 | 3

export interface Bands {
  /** Variabilidad rítmica (nPVI) esperada. */
  nPVI: [number, number]
  /** Porcentaje de tiempo sonoro esperado. */
  pctV: [number, number]
  /** Rango melódico esperado en semitonos (p90 − p10). */
  deltaF0: [number, number]
}

export interface RawProsody {
  nPVI: number
  pctV: number
  deltaF0St: number
  pauses: number
  pauseRatio: number
  sylRate: number
  nuclei: number
  durationS: number
}

export interface ComprehensionResult {
  ops: Record<Operation, boolean>
  tipo?: ComprehensionType
  fragmento?: string
  hipotesis?: string
}

/** Salida de `analyze()`: puntuaciones 0..100 + valores crudos. */
export interface Measurement {
  kappa: number
  nPVI_V: number
  pctV: number
  deltaF0: number
  fluency: number
  raw: RawProsody
  empty: boolean
  simulated?: boolean
  comprension?: ComprehensionResult
}

export interface Barrier {
  plano: 'prosodia' | 'comprension'
  dimension?: Dimension
  tipo?: ComprehensionType
  fragmento?: string
  /** 0..100 — distancia a la franja. */
  severity: number
  detail: string
  /** Siempre formulada como hipótesis revisable ("parece que aquí…"). */
  hypothesis: string
}

export interface Devolucion {
  kind: 'pregunta' | 'pista' | 'reformulacion' | 'conexion' | 'audio'
  text: string
}

export interface Andamio {
  level: Level
  kind: AndamioKind
  instruction: string
  audio: boolean
  dimension?: Dimension
  devolucion?: Devolucion
}

export interface Contract {
  item: string
  text: string
  capa: 'leer'
  disposicion: Disposicion
  kappa: number
  barrier: Barrier | null
  andamio: Andamio
  retired: boolean
  givesAnswer: false
}

export interface Target {
  itemId: string
  text: string
  syllables: number
  bands: Bands
  /** κ a partir de la cual se considera "en franja". */
  franja: number
  levers: Partial<Record<ComprehensionType, Devolucion>>
  prosodyLevers?: Partial<Record<Dimension, Devolucion>>
}

export interface FacilitatorState {
  item: string
  level: Level
  kappas: number[]
  retired: boolean
  comprehensionDemonstrated: boolean
}

export interface FacilitateInput {
  measurement: Measurement
  target: Target
  disposicion: Disposicion
  foco?: Dimension
  state?: FacilitatorState
}

export interface FacilitateOutput {
  contract: Contract
  state: FacilitatorState
}

export interface Envelope {
  env: number[]
  nuclei: number[]
  pauses: Array<[number, number]>
  pitch: Array<number | null>
  durationS: number
}
