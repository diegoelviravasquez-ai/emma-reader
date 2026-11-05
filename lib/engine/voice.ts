import { AUDIO_FILES } from '../audio-manifest'
import type { Item } from '../content'
import { syllablesOf } from '../content'
import { audioContext } from './capture'

export type ModelSource = 'archivo' | 'voz-local' | 'tono'

export const MODEL_SOURCE_LABEL: Record<ModelSource, string> = {
  archivo: 'modelo grabado en el dispositivo',
  'voz-local': 'voz del sistema, sin red',
  tono: 'modelo provisional en tono (sustituir con prebuild-audio)',
}

export interface Playback {
  source: ModelSource
  stop: () => void
  done: Promise<void>
}

interface PlayOptions {
  rate?: number
  onSyllable?: (index: number) => void
}

function localVoice(lang: string) {
  if (typeof speechSynthesis === 'undefined') return null
  return speechSynthesis.getVoices().find((v) => v.localService && v.lang.toLowerCase().startsWith(lang)) ?? null
}

function scheduleSyllables(count: number, totalMs: number, onSyllable?: (i: number) => void) {
  const timers: ReturnType<typeof setTimeout>[] = []
  if (!onSyllable) return timers
  for (let i = 0; i < count; i++) timers.push(setTimeout(() => onSyllable(i), (i / count) * totalMs))
  timers.push(setTimeout(() => onSyllable(-1), totalMs))
  return timers
}

/**
 * Reproduce el modelo: fichero local pre-generado → voz del sistema (solo si es
 * local) → tono provisional que sigue el contorno de la frase.
 */
export function playModel(item: Item, { rate = 1, onSyllable }: PlayOptions = {}): Playback {
  const syl = syllablesOf(item)

  if (AUDIO_FILES.includes(item.id)) {
    const audio = new Audio(`/audio/${item.id}.wav`)
    audio.playbackRate = rate
    let timers: ReturnType<typeof setTimeout>[] = []
    const done = new Promise<void>((resolve) => {
      audio.onloadedmetadata = () => (timers = scheduleSyllables(syl.length, (audio.duration * 1000) / rate, onSyllable))
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
    })
    audio.play().catch(() => {})
    return {
      source: 'archivo',
      done,
      stop: () => {
        audio.pause()
        timers.forEach(clearTimeout)
        onSyllable?.(-1)
      },
    }
  }

  const voice = localVoice(item.lang)
  if (voice) {
    const u = new SpeechSynthesisUtterance(item.text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = rate * 0.85
    const estMs = (syl.length / (3.6 * rate)) * 1000
    const timers = scheduleSyllables(syl.length, estMs, onSyllable)
    const done = new Promise<void>((resolve) => {
      u.onend = () => resolve()
      u.onerror = () => resolve()
    })
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
    return {
      source: 'voz-local',
      done,
      stop: () => {
        speechSynthesis.cancel()
        timers.forEach(clearTimeout)
        onSyllable?.(-1)
      },
    }
  }

  return playTone(item, rate, onSyllable)
}

function playTone(item: Item, rate: number, onSyllable?: (i: number) => void): Playback {
  const ctx = audioContext()
  ctx.resume().catch(() => {})
  const syl = syllablesOf(item)
  const master = ctx.createGain()
  master.gain.value = 0.16
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1400
  master.connect(filter).connect(ctx.destination)

  const start = ctx.currentTime + 0.05
  let t = start
  const oscs: OscillatorNode[] = []
  const timers: ReturnType<typeof setTimeout>[] = []
  syl.forEach((_, i) => {
    const stressed = item.stress.includes(i)
    const dur = (stressed ? 0.36 : 0.26) / rate
    const f = 196 * 2 ** (((item.contour[i] ?? 0.5) - 0.5) * 10 / 12)
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(f, t)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(stressed ? 1 : 0.7, t + 0.03)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(g).connect(master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
    oscs.push(osc)
    if (onSyllable) timers.push(setTimeout(() => onSyllable(i), (t - ctx.currentTime) * 1000))
    t += dur + (item.breaks.includes(i) ? 0.3 / rate : 0.04 / rate)
  })
  const totalMs = (t - ctx.currentTime) * 1000
  if (onSyllable) timers.push(setTimeout(() => onSyllable(-1), totalMs))
  const done = new Promise<void>((resolve) => timers.push(setTimeout(resolve, totalMs)))
  return {
    source: 'tono',
    done,
    stop: () => {
      oscs.forEach((o) => {
        try {
          o.stop()
        } catch {}
      })
      timers.forEach(clearTimeout)
      onSyllable?.(-1)
    },
  }
}

/** Reproduce la propia lectura del niño (solo en memoria, nunca se guarda). */
export function playBuffer(buffer: AudioBuffer, onEnd?: () => void) {
  const ctx = audioContext()
  ctx.resume().catch(() => {})
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.connect(ctx.destination)
  src.onended = () => onEnd?.()
  src.start()
  return () => {
    try {
      src.stop()
    } catch {}
  }
}
