import {
  DIMENSION_LABEL,
  GENERIC_LEVERS,
  KIND_BY_DIMENSION,
  PROSODY_HYPOTHESIS,
  PROSODY_LEVERS,
  SCAFFOLD_BANK,
} from './scaffolds'
import type {
  Andamio,
  Barrier,
  ComprehensionResult,
  Dimension,
  FacilitateInput,
  FacilitateOutput,
  FacilitatorState,
  Level,
  Measurement,
} from './types'

export function initialState(item: string): FacilitatorState {
  return { item, level: 3, kappas: [], retired: false, comprehensionDemonstrated: false }
}

export function demonstratedOps(c: ComprehensionResult) {
  return Object.values(c.ops).filter(Boolean).length
}

function dimensionScores(m: Measurement): Record<Dimension, number> {
  return { ritmo: m.nPVI_V, cadencia: m.pctV, melodia: m.deltaF0, fluidez: m.fluency }
}

function weakest(m: Measurement, foco?: Dimension): Dimension {
  const scores = dimensionScores(m)
  if (foco && scores[foco] < 75) return foco
  return (Object.keys(scores) as Dimension[]).reduce((a, b) => (scores[b] < scores[a] ? b : a))
}

function prosodyDetail(d: Dimension, m: Measurement): string {
  const r = m.raw
  switch (d) {
    case 'ritmo':
      return `${r.nuclei} núcleos silábicos · variabilidad ${r.nPVI}`
    case 'cadencia':
      return `${r.pctV}% del tiempo con voz`
    case 'melodia':
      return `${r.deltaF0St} semitonos de rango`
    case 'fluidez':
      return r.pauses === 1 ? '1 pausa larga' : `${r.pauses} pausas largas`
  }
}

/**
 * El adaptador CLASIFICA, no genera: elige del banco fijo según la barrera,
 * desvanece el andamio al mejorar, lo restituye si recae y lo retira en franja.
 */
export function facilitate({ measurement, target, disposicion, foco, state }: FacilitateInput): FacilitateOutput {
  const prev = state && state.item === target.itemId ? state : initialState(target.itemId)
  const kappa = measurement.kappa
  const last = prev.kappas[prev.kappas.length - 1]
  const kappas = [...prev.kappas, kappa]

  const comp = measurement.comprension
  const comprehensionDemonstrated = comp ? demonstratedOps(comp) >= 3 : prev.comprehensionDemonstrated
  const inBand = kappa >= target.franja

  let level: Level = prev.level === 0 ? 2 : prev.level
  const fadeStep = disposicion === 'con-ganas' ? 3 : 4
  if (last !== undefined) {
    if (kappa - last >= fadeStep) level = Math.max(1, level - 1) as Level
    else if (last - kappa >= 6) level = Math.min(3, level + 1) as Level
  }
  if (disposicion === 'cansado' && !inBand) level = Math.max(level, 2) as Level

  const retired = inBand && comprehensionDemonstrated
  if (retired) level = 0

  let barrier: Barrier | null = null
  if (comp && !comprehensionDemonstrated && comp.tipo) {
    barrier = {
      plano: 'comprension',
      tipo: comp.tipo,
      fragmento: comp.fragmento,
      severity: (4 - demonstratedOps(comp)) * 25,
      detail: `${demonstratedOps(comp)} de 4 gestos demostrados`,
      hypothesis: comp.hipotesis ?? 'Parece que aquí algo del sentido aún no ha entrado.',
    }
  } else if (!inBand && !measurement.empty) {
    const d = weakest(measurement, foco)
    barrier = {
      plano: 'prosodia',
      dimension: d,
      severity: Math.round(100 - dimensionScores(measurement)[d]),
      detail: prosodyDetail(d, measurement),
      hypothesis: PROSODY_HYPOTHESIS[d],
    }
  }

  let andamio: Andamio
  if (level === 0) {
    andamio = { level: 0, kind: 'none', instruction: '', audio: false }
  } else {
    const dimension = barrier?.dimension ?? foco ?? weakest(measurement, foco)
    const devolucion =
      barrier?.plano === 'comprension' && barrier.tipo
        ? target.levers[barrier.tipo] ?? GENERIC_LEVERS[barrier.tipo]
        : target.prosodyLevers?.[dimension] ?? PROSODY_LEVERS[dimension]
    andamio = {
      level,
      kind: KIND_BY_DIMENSION[dimension],
      instruction: SCAFFOLD_BANK[dimension][level as 1 | 2 | 3],
      audio: level >= 2,
      dimension,
      devolucion,
    }
  }

  return {
    contract: {
      item: target.itemId,
      text: target.text,
      capa: 'leer',
      disposicion,
      kappa,
      barrier,
      andamio,
      retired,
      givesAnswer: false,
    },
    state: { item: target.itemId, level, kappas, retired, comprehensionDemonstrated },
  }
}

export { DIMENSION_LABEL }
