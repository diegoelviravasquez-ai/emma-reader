let sharedContext: AudioContext | null = null

export function audioContext(): AudioContext {
  if (!sharedContext) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    sharedContext = new Ctor()
  }
  return sharedContext
}

export interface CaptureResult {
  buffer: AudioBuffer
  simulated: boolean
  reason?: string
}

export interface RecordOptions {
  durationMs?: number
  syllables: number
  contour?: number[]
  attempt?: number
  onStart?: () => void
  onLevel?: (level: number) => void
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Graba ~3,5 s con getUserMedia + MediaRecorder y decodifica en el dispositivo.
 * Si no hay micro o permiso, cae a una lectura sintética y lo marca como simulada.
 */
export async function recordReading(opts: RecordOptions): Promise<CaptureResult> {
  const { durationMs = 3500, onStart, onLevel } = opts
  const ctx = audioContext()
  await ctx.resume().catch(() => {})

  let stream: MediaStream
  try {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error('Este dispositivo no permite grabar desde el navegador.')
    }
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
    })
  } catch (err) {
    const reason =
      err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'No hay permiso para usar el micrófono.'
        : err instanceof Error
          ? err.message
          : 'No se encontró micrófono.'
    return simulate(ctx, opts, reason)
  }

  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  source.connect(analyser)
  const data = new Float32Array(analyser.fftSize)
  let raf = 0
  const tick = () => {
    analyser.getFloatTimeDomainData(data)
    let s = 0
    for (let i = 0; i < data.length; i++) s += data[i] * data[i]
    onLevel?.(Math.min(1, Math.sqrt(s / data.length) * 6))
    raf = requestAnimationFrame(tick)
  }

  const recorder = new MediaRecorder(stream)
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()))

  recorder.start()
  onStart?.()
  tick()
  await sleep(durationMs)
  recorder.stop()
  await stopped
  cancelAnimationFrame(raf)
  onLevel?.(0)
  source.disconnect()
  stream.getTracks().forEach((t) => t.stop())

  try {
    const blob = new Blob(chunks, { type: recorder.mimeType })
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer())
    return { buffer, simulated: false }
  } catch {
    return simulate(ctx, { ...opts, durationMs: 0 }, 'No se pudo decodificar la grabación.')
  }
}

function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Lectura sintética: más regular y melódica a cada intento. Solo para demostrar el bucle. */
export function synthReading(ctx: BaseAudioContext, syllables: number, attempt = 0, contour?: number[]) {
  const sr = ctx.sampleRate
  const buffer = ctx.createBuffer(1, Math.round(sr * 3.5), sr)
  const out = buffer.getChannelData(0)
  const quality = Math.min(1, 0.3 + attempt * 0.24)
  const rand = seeded(syllables * 97 + attempt * 13 + 7)
  const range = 1.5 + quality * 10

  let t = 0.25
  for (let k = 0; k < syllables && t < 3.3; k++) {
    const stressed = k % 2 === 0
    const irregular = (1 - quality) * (rand() - 0.5) * 0.24
    const dur = 0.17 + (stressed ? 0.07 * quality : 0) + irregular
    const c = contour?.[k] ?? 0.5
    const f0 = 190 * 2 ** (((c - 0.5) * range) / 12)
    const amp = stressed ? 0.32 : 0.24
    const start = Math.round(t * sr)
    const len = Math.round(Math.max(0.09, dur) * sr)
    for (let i = 0; i < len && start + i < out.length; i++) {
      const u = i / len
      const env = Math.sin(Math.PI * u) ** 0.7
      const ph = (2 * Math.PI * f0 * i) / sr
      const v = Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph) + 0.12 * Math.sin(4 * ph)
      out[start + i] += amp * env * v * 0.55
    }
    const pause = rand() < (1 - quality) * 0.45 ? 0.24 + rand() * 0.2 : 0.035
    t += Math.max(0.09, dur) + pause
  }
  for (let i = 0; i < out.length; i++) out[i] += (rand() - 0.5) * 0.004
  return buffer
}

async function simulate(ctx: AudioContext, opts: RecordOptions, reason: string): Promise<CaptureResult> {
  const { durationMs = 3500, onStart, onLevel, syllables, attempt = 0, contour } = opts
  const buffer = synthReading(ctx, syllables, attempt, contour)
  onStart?.()
  if (durationMs > 0) {
    const data = buffer.getChannelData(0)
    const started = performance.now()
    let raf = 0
    const tick = () => {
      const t = (performance.now() - started) / 1000
      const i = Math.floor(t * buffer.sampleRate)
      let s = 0
      for (let j = i; j < i + 512 && j < data.length; j++) s += data[j] * data[j]
      onLevel?.(Math.min(1, Math.sqrt(s / 512) * 6))
      raf = requestAnimationFrame(tick)
    }
    tick()
    await sleep(durationMs)
    cancelAnimationFrame(raf)
    onLevel?.(0)
  }
  return { buffer, simulated: true, reason }
}
