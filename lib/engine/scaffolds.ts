import type { AndamioKind, ComprehensionType, Devolucion, Dimension, Level } from './types'

/**
 * Banco FIJO de andamios. Texto revisable por docentes; nunca generado por IA.
 * El adaptador solo elige una entrada.
 */

export const DIMENSION_LABEL: Record<Dimension, string> = {
  ritmo: 'ritmo',
  cadencia: 'cadencia',
  melodia: 'melodía',
  fluidez: 'fluidez',
}

export const KIND_BY_DIMENSION: Record<Dimension, AndamioKind> = {
  ritmo: 'rhythm-tap',
  cadencia: 'chunk',
  melodia: 'melody-follow',
  fluidez: 'audio-model',
}

export const SCAFFOLD_BANK: Record<Dimension, Record<Exclude<Level, 0>, string>> = {
  ritmo: {
    3: 'Escucha y marca cada sílaba con un toque, igual que el modelo.',
    2: 'Da un toque por sílaba mientras lo dices tú.',
    1: 'Léelo marcando el pulso solo con la voz.',
  },
  cadencia: {
    3: 'Escucha cómo el modelo agrupa las palabras. Lee un trozo cada vez.',
    2: 'Lee por trozos: respira solo en las marcas.',
    1: 'Léelo entero, respirando donde tú sientas el trozo.',
  },
  melodia: {
    3: 'Escucha cómo sube y baja la voz y sigue la línea con el dedo.',
    2: 'Sigue la línea con la voz: sube donde sube.',
    1: 'Léelo dejando que la voz suba y baje sola.',
  },
  fluidez: {
    3: 'Escúchalo una vez entero y léelo justo después, sin parar.',
    2: 'Léelo de corrido; si te paras, sigue desde ahí.',
    1: 'Léelo una vez más, a tu paso.',
  },
}

export const PROSODY_HYPOTHESIS: Record<Dimension, string> = {
  ritmo: 'Parece que aquí se traba el ritmo: las sílabas aún no llevan su propio pulso.',
  cadencia: 'Parece que aquí la frase todavía no encuentra sus trozos.',
  melodia: 'Parece que aquí la voz se queda plana; la frase aún no canta.',
  fluidez: 'Parece que aquí la lectura se detiene antes de llegar al final.',
}

export const PROSODY_LEVERS: Record<Dimension, Devolucion> = {
  ritmo: { kind: 'pista', text: 'Da una palmada suave en la sílaba que pesa más.' },
  cadencia: { kind: 'pista', text: 'Respira solo donde hay una marca. Lo demás, de un tirón.' },
  melodia: { kind: 'audio', text: 'Escucha el modelo y deja que tu voz suba donde sube la suya.' },
  fluidez: { kind: 'pista', text: 'Si te paras, no vuelvas atrás: sigue desde la palabra siguiente.' },
}

export const GENERIC_LEVERS: Record<ComprehensionType, Devolucion> = {
  vocabulario: { kind: 'conexion', text: '¿Dónde has oído esta palabra antes? ¿Qué estaba pasando?' },
  'causa-efecto': { kind: 'pregunta', text: '¿Qué pasaría si eso no ocurriera?' },
  inferencia: { kind: 'pregunta', text: '¿Qué sabes tú que el texto no dice?' },
  referente: { kind: 'pregunta', text: '¿De quién o de qué se está hablando aquí?' },
  secuencia: { kind: 'pregunta', text: '¿Qué pasa primero? ¿Y después?' },
}

export const COMPREHENSION_LABEL: Record<ComprehensionType, string> = {
  vocabulario: 'una palabra',
  'causa-efecto': 'una relación causa-efecto',
  inferencia: 'una inferencia',
  referente: 'el referente de un pronombre',
  secuencia: 'el orden de lo que pasa',
}
