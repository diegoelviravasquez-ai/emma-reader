import type { Bands, Envelope, Measurement, RawProsody } from './types'

const FRAME_S = 0.025
const HOP_S = 0.01
const MIN_PAUSE_S = 0.18
const MIN_NUCLEUS_GAP_S = 0.1
const MAX_SYLLABLE_INTERVAL_S = 0.6

export const DEFAULT_BANDS: Bands = { nPVI: [35, 65], pctV: [45, 82], deltaF0: [4, 12] }

interface Profile {
  durationS: number
  rms: Float32Array
  voiced: Uint8Array
  first: number
  last: number
  nuclei: number[]
  pauses: Array<[number, number]>
  pitchSt: Array<number | null>
  empty: boolean
  raw: RawProsody
}

const EMPTY_RAW: RawProsody = {
  nPVI: 0,
  pctV: 0,
  deltaF0St: 0,
  pauses: 0,
  pauseRatio: 0,
  sylRate: 0,
  nuclei: 0,
  durationS: 0,
}

const cache = new WeakMap<AudioBuffer, Profile>()

function toMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0)
  const out = new Float32Array(buffer.length)
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const d = buffer.getChannelData(c)
    for (let i = 0; i < d.length; i++) out[i] += d[i] / buffer.numberOfChannels
  }
  return out
}

function percentile(values: ArrayLike<number>, p: number): number {
  if (values.length === 0) return 0
  const sorted = Array.from(values).sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))))
  return sorted[idx]
}

function decimate(x: Float32Array, factor: number): Float32Array {
  if (factor <= 1) return x
  const out = new Float32Array(Math.floor(x.length / factor))
  for (let i = 0; i < out.length; i++) {
    let s = 0
    for (let k = 0; k < factor; k++) s += x[i * factor + k]
    out[i] = s / factor
  }
  return out
}

/** Tono por autocorrelación normalizada, 80–400 Hz. */
function pitchAt(y: Float32Array, center: number, sr: number): number | null {
  const win = Math.round(0.04 * sr)
  const minLag = Math.floor(sr / 400)
  const maxLag = Math.ceil(sr / 80)
  const start = Math.max(0, center - (win >> 1))
  if (start + win + maxLag >= y.length) return null

  let e0 = 0
  for (let j = 0; j < win; j++) e0 += y[start + j] * y[start + j]
  if (e0 < 1e-7) return null

  let best = 0
  let bestLag = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    let num = 0
    let e1 = 0
    for (let j = 0; j < win; j++) {
      const b = y[start + j + lag]
      num += y[start + j] * b
      e1 += b * b
    }
    const r = num / Math.sqrt(e0 * e1 + 1e-12)
    if (r > best) {
      best = r
      bestLag = lag
    }
  }
  if (best < 0.55 || bestLag === 0) return null
  return sr / bestLag
}

function profileOf(buffer: AudioBuffer): Profile {
  const cached = cache.get(buffer)
  if (cached) return cached

  const sr = buffer.sampleRate
  const x = toMono(buffer)
  const frameLen = Math.round(FRAME_S * sr)
  const hop = Math.round(HOP_S * sr)
  const n = x.length > frameLen ? Math.floor((x.length - frameLen) / hop) + 1 : 0
  const durationS = buffer.duration

  const rms = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    const off = i * hop
    for (let j = 0; j < frameLen; j++) s += x[off + j] * x[off + j]
    rms[i] = Math.sqrt(s / frameLen)
  }

  const floor = percentile(rms, 10)
  const peak = percentile(rms, 95)
  const empty = n < 20 || peak < 0.004 || peak - floor < 0.003

  const emptyProfile: Profile = {
    durationS,
    rms: new Float32Array(n),
    voiced: new Uint8Array(n),
    first: 0,
    last: Math.max(0, n - 1),
    nuclei: [],
    pauses: [],
    pitchSt: [],
    empty: true,
    raw: { ...EMPTY_RAW, durationS },
  }
  if (empty) {
    cache.set(buffer, emptyProfile)
    return emptyProfile
  }

  const thr = floor + 0.18 * (peak - floor)
  const voiced = new Uint8Array(n)
  let first = -1
  let last = -1
  for (let i = 0; i < n; i++) {
    if (rms[i] > thr) {
      voiced[i] = 1
      if (first < 0) first = i
      last = i
    }
  }
  if (first < 0 || last - first < 10) {
    cache.set(buffer, emptyProfile)
    return emptyProfile
  }

  // Normalizamos la envolvente para dibujar.
  const norm = new Float32Array(n)
  for (let i = 0; i < n; i++) norm[i] = Math.min(1, Math.max(0, (rms[i] - floor) / (peak - floor)))

  // Suavizado para detectar núcleos silábicos.
  const smooth = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    let c = 0
    for (let k = -2; k <= 2; k++) {
      const j = i + k
      if (j >= 0 && j < n) {
        s += rms[j]
        c++
      }
    }
    smooth[i] = s / c
  }

  const minGap = Math.round(MIN_NUCLEUS_GAP_S / HOP_S)
  const nuclei: number[] = []
  for (let i = Math.max(1, first); i < Math.min(n - 1, last + 1); i++) {
    if (smooth[i] <= thr || smooth[i] < smooth[i - 1] || smooth[i] <= smooth[i + 1]) continue
    const prev = nuclei[nuclei.length - 1]
    if (prev === undefined) {
      nuclei.push(i)
      continue
    }
    let valley = Infinity
    for (let j = prev; j <= i; j++) valley = Math.min(valley, smooth[j])
    const lower = Math.min(smooth[prev], smooth[i])
    if (i - prev >= minGap && valley < 0.82 * lower) {
      nuclei.push(i)
    } else if (smooth[i] > smooth[prev]) {
      nuclei[nuclei.length - 1] = i
    }
  }

  // Pausas ≥180 ms dentro del habla.
  const minPause = Math.round(MIN_PAUSE_S / HOP_S)
  const pauses: Array<[number, number]> = []
  let run = 0
  let voicedCount = 0
  for (let i = first; i <= last; i++) {
    if (voiced[i]) {
      voicedCount++
      if (run >= minPause) pauses.push([i - run, i - 1])
      run = 0
    } else run++
  }
  const span = last - first + 1
  const pauseFrames = pauses.reduce((s, [a, b]) => s + (b - a + 1), 0)

  // nPVI entre intervalos silábicos (sin cruzar pausas largas).
  const intervals: number[] = []
  for (let k = 1; k < nuclei.length; k++) {
    const d = (nuclei[k] - nuclei[k - 1]) * HOP_S
    if (d <= MAX_SYLLABLE_INTERVAL_S) intervals.push(d)
  }
  let nPVI = 0
  if (intervals.length >= 2) {
    let s = 0
    for (let k = 1; k < intervals.length; k++) {
      const a = intervals[k - 1]
      const b = intervals[k]
      s += Math.abs(a - b) / ((a + b) / 2)
    }
    nPVI = (100 * s) / (intervals.length - 1)
  }

  // Melodía por autocorrelación sobre señal diezmada (~16 kHz).
  const factor = Math.max(1, Math.floor(sr / 16000))
  const y = decimate(x, factor)
  const dsr = sr / factor
  const pitchSt: Array<number | null> = new Array(n).fill(null)
  const pitched: number[] = []
  for (let i = first; i <= last; i += 2) {
    if (!voiced[i]) continue
    const center = Math.round((i * hop + frameLen / 2) / factor)
    const f = pitchAt(y, center, dsr)
    if (f) {
      const st = 12 * Math.log2(f / 100)
      pitchSt[i] = st
      if (i + 1 < n) pitchSt[i + 1] = st
      pitched.push(st)
    }
  }
  const deltaF0St = pitched.length >= 5 ? percentile(pitched, 90) - percentile(pitched, 10) : 0

  const speechS = (span - pauseFrames) * HOP_S
  const raw: RawProsody = {
    nPVI: Math.round(nPVI * 10) / 10,
    pctV: Math.round((voicedCount / span) * 1000) / 10,
    deltaF0St: Math.round(deltaF0St * 10) / 10,
    pauses: pauses.length,
    pauseRatio: Math.round((pauseFrames / span) * 1000) / 1000,
    sylRate: speechS > 0 ? Math.round((nuclei.length / speechS) * 10) / 10 : 0,
    nuclei: nuclei.length,
    durationS: Math.round(span * HOP_S * 100) / 100,
  }

  const profile: Profile = { durationS, rms: norm, voiced, first, last, nuclei, pauses, pitchSt, empty: false, raw }
  cache.set(buffer, profile)
  return profile
}

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(hi, Math.max(lo, v))
}

/** 100 dentro de la franja; cae linealmente fuera de ella. */
function bandScore(v: number, [lo, hi]: [number, number], soft: number) {
  if (v >= lo && v <= hi) return 100
  const dist = v < lo ? lo - v : v - hi
  return clamp(100 - (dist / soft) * 100)
}

export interface AnalyzeOptions {
  bands?: Bands
  syllables?: number
}

/**
 * Huella prosódica de una lectura. Todo en el dispositivo.
 * Devuelve puntuaciones 0..100 por dimensión y κ (mezcla normalizada).
 */
export function analyze(buffer: AudioBuffer, { bands = DEFAULT_BANDS, syllables }: AnalyzeOptions = {}): Measurement {
  const p = profileOf(buffer)
  if (p.empty) {
    return { kappa: 0, nPVI_V: 0, pctV: 0, deltaF0: 0, fluency: 0, raw: p.raw, empty: true }
  }

  let ritmo: number
  if (syllables !== undefined && syllables <= 2) {
    // Palabras cortas: el ritmo es que cada sílaba tenga su núcleo.
    ritmo = clamp(100 - Math.abs(p.raw.nuclei - syllables) * 35)
  } else {
    ritmo = p.raw.nuclei >= 3 ? bandScore(p.raw.nPVI, bands.nPVI, 30) : 20
  }
  const cadencia = bandScore(p.raw.pctV, bands.pctV, 30)
  const melodia = p.raw.deltaF0St > 0 ? bandScore(p.raw.deltaF0St, bands.deltaF0, 6) : 10
  const fluency = clamp(100 - p.raw.pauses * 12 - p.raw.pauseRatio * 140)

  const kappa = Math.round(0.28 * ritmo + 0.22 * cadencia + 0.25 * melodia + 0.25 * fluency)

  return {
    kappa,
    nPVI_V: Math.round(ritmo),
    pctV: Math.round(cadencia),
    deltaF0: Math.round(melodia),
    fluency: Math.round(fluency),
    raw: p.raw,
    empty: false,
  }
}

/** Envolvente lista para dibujar la huella real de la voz. */
export function envelopeOf(buffer: AudioBuffer, points = 220): Envelope {
  const p = profileOf(buffer)
  const n = p.rms.length
  if (n === 0) return { env: [], nuclei: [], pauses: [], pitch: [], durationS: p.durationS }

  const pad = 12
  const a = p.empty ? 0 : Math.max(0, p.first - pad)
  const b = p.empty ? n - 1 : Math.min(n - 1, p.last + pad)
  const len = b - a + 1
  const pos = (i: number) => (i - a) / len

  const env: number[] = []
  const pitchRaw: Array<number | null> = []
  for (let k = 0; k < points; k++) {
    const s = a + Math.floor((k / points) * len)
    const e = Math.max(s + 1, a + Math.floor(((k + 1) / points) * len))
    let m = 0
    let pSum = 0
    let pCount = 0
    for (let i = s; i < e && i < n; i++) {
      m = Math.max(m, p.rms[i])
      const st = p.pitchSt[i]
      if (st !== null && st !== undefined) {
        pSum += st
        pCount++
      }
    }
    env.push(m)
    pitchRaw.push(pCount ? pSum / pCount : null)
  }

  const valid = pitchRaw.filter((v): v is number => v !== null)
  const lo = valid.length ? percentile(valid, 5) : 0
  const hi = valid.length ? percentile(valid, 95) : 1
  const pitch = pitchRaw.map((v) => (v === null ? null : Math.min(1, Math.max(0, (v - lo) / Math.max(1, hi - lo)))))

  return {
    env,
    nuclei: p.nuclei.map(pos),
    pauses: p.pauses.map(([s, e]) => [pos(s), pos(e)] as [number, number]),
    pitch,
    durationS: p.durationS,
  }
}

/**
 * Pausas expresadas como "corte después de la sílaba k", para devolver el
 * material en la cadencia del propio niño.
 */
export function pauseBreaks(buffer: AudioBuffer, syllables: number): number[] {
  const p = profileOf(buffer)
  if (p.empty || p.nuclei.length < 2) return []
  const breaks: number[] = []
  for (const [s] of p.pauses) {
    const before = p.nuclei.filter((i) => i < s).length
    const k = Math.round((before / p.nuclei.length) * syllables) - 1
    if (k >= 0 && k < syllables - 1 && !breaks.includes(k)) breaks.push(k)
  }
  return breaks
}
