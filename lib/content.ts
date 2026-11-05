import type { Bands, ComprehensionType, Devolucion, Dimension, Lang, Operation, Target } from './engine/types'

export interface ChoiceOption {
  text: string
  ok: boolean
  tipo?: ComprehensionType
  fragmento?: string
  hipotesis?: string
}

export interface Gesture {
  op: Exclude<Operation, 'limites'>
  prompt: string
  options: ChoiceOption[]
}

export interface Item {
  id: string
  lang: Lang
  kind: 'palabra' | 'frase'
  text: string
  /** Sílabas por palabra, con su puntuación pegada a la última sílaba. */
  words: string[][]
  /** Índice global de sílaba tras el que el modelo hace pausa. */
  breaks: number[]
  /** 0..1 — dónde sube y baja la voz del modelo, una por sílaba. */
  contour: number[]
  stress: number[]
  foco?: Dimension
  bands: Bands
  franja: number
  gloss: string
  gestures: Gesture[]
  limitWords: string[]
  levers: Partial<Record<ComprehensionType, Devolucion>>
  prosodyLevers?: Partial<Record<Dimension, Devolucion>>
}

const ES_BANDS: Bands = { nPVI: [28, 55], pctV: [48, 84], deltaF0: [3, 10] }
const EN_BANDS: Bands = { nPVI: [42, 72], pctV: [45, 80], deltaF0: [4, 12] }

export const ITEMS: Item[] = [
  {
    id: 'water',
    lang: 'en',
    kind: 'palabra',
    text: 'water',
    words: [['wa', 'ter']],
    breaks: [],
    contour: [0.7, 0.3],
    stress: [0],
    foco: 'ritmo',
    bands: { ...EN_BANDS, deltaF0: [2, 9] },
    franja: 70,
    gloss: 'agua',
    gestures: [
      {
        op: 'reformula',
        prompt: '¿Qué quiere decir water?',
        options: [
          { text: 'El agua que bebes y que llueve.', ok: true },
          { text: 'Una botella de plástico.', ok: false, tipo: 'vocabulario', fragmento: 'water', hipotesis: 'Parece que aquí «water» se confunde con el recipiente.' },
          { text: 'Un río muy grande.', ok: false, tipo: 'vocabulario', fragmento: 'water', hipotesis: 'Parece que aquí «water» se queda pegada a un solo lugar.' },
        ],
      },
      {
        op: 'transfiere',
        prompt: '¿Dónde más encontrarías water?',
        options: [
          { text: 'En la lluvia que llena la cubeta del patio.', ok: true },
          { text: 'En una piedra seca del camino.', ok: false, tipo: 'vocabulario', fragmento: 'water', hipotesis: 'Parece que aquí el sentido de «water» aún no viaja a otros casos.' },
          { text: 'En el sol de mediodía.', ok: false, tipo: 'vocabulario', fragmento: 'water' },
        ],
      },
      {
        op: 'objeta',
        prompt: '¿Cuál de estas NO cuadra?',
        options: [
          { text: 'Water is dry.', ok: true },
          { text: 'Water is wet.', ok: false, tipo: 'vocabulario', fragmento: 'water' },
          { text: 'Plants drink water.', ok: false, tipo: 'vocabulario', fragmento: 'water' },
        ],
      },
    ],
    limitWords: ['water'],
    levers: {
      vocabulario: { kind: 'conexion', text: '¿Qué usas en casa para lavarte las manos?' },
    },
  },
  {
    id: 'rio',
    lang: 'es',
    kind: 'frase',
    text: 'El agua baja de la sierra. El río la lleva hasta el mar.',
    words: [
      ['El'], ['a', 'gua'], ['ba', 'ja'], ['de'], ['la'], ['sie', 'rra.'],
      ['El'], ['rí', 'o'], ['la'], ['lle', 'va'], ['has', 'ta'], ['el'], ['mar.'],
    ],
    breaks: [7],
    contour: [0.4, 0.7, 0.5, 0.6, 0.45, 0.4, 0.4, 0.5, 0.2, 0.45, 0.75, 0.5, 0.6, 0.65, 0.5, 0.45, 0.4, 0.2],
    stress: [1, 3, 7, 9, 12, 14, 17],
    foco: 'cadencia',
    bands: ES_BANDS,
    franja: 68,
    gloss: 'El río lleva el agua de la sierra al mar.',
    gestures: [
      {
        op: 'reformula',
        prompt: 'Dilo con otras palabras. ¿Cuál se parece más a lo que leíste?',
        options: [
          { text: 'El agua viaja con el río hasta llegar al mar.', ok: true },
          { text: 'El río lleva una barca hasta el mar.', ok: false, tipo: 'referente', fragmento: 'la', hipotesis: 'Parece que aquí no queda claro a qué se refiere «la».' },
          { text: 'La sierra baja hasta el mar.', ok: false, tipo: 'referente', fragmento: 'la', hipotesis: 'Parece que aquí «la» se pega a la sierra y no al agua.' },
        ],
      },
      {
        op: 'transfiere',
        prompt: '¿Dónde pasa algo parecido?',
        options: [
          { text: 'La acequia lleva el agua del pozo hasta la milpa.', ok: true },
          { text: 'El mar sube cada noche hasta la sierra.', ok: false, tipo: 'secuencia', fragmento: 'baja de la sierra', hipotesis: 'Parece que aquí el camino del agua se lee al revés.' },
          { text: 'La lluvia se queda quieta en la nube.', ok: false, tipo: 'inferencia', hipotesis: 'Parece que aquí falta ver que el agua se mueve.' },
        ],
      },
      {
        op: 'objeta',
        prompt: '¿Cuál de estas NO cuadra con el texto?',
        options: [
          { text: 'El agua nace en el mar y sube a la sierra.', ok: true },
          { text: 'El agua acaba en el mar.', ok: false, tipo: 'secuencia', fragmento: 'hasta el mar', hipotesis: 'Parece que aquí el orden de lo que pasa aún no está firme.' },
          { text: 'El río se mueve.', ok: false, tipo: 'inferencia', hipotesis: 'Parece que aquí algo que el texto no dice aún no se infiere.' },
        ],
      },
    ],
    limitWords: ['sierra', 'la', 'lleva', 'hasta'],
    levers: {
      referente: { kind: 'pregunta', text: '¿Qué puede llevar un río, si no es el agua?' },
      secuencia: { kind: 'pregunta', text: 'Si el agua baja de la sierra, ¿adónde llega primero: al río o al mar?' },
      vocabulario: { kind: 'conexion', text: '¿Hay una sierra cerca de donde vives? ¿Qué baja de ella cuando llueve?' },
    },
  },
  {
    id: 'planta',
    lang: 'en',
    kind: 'frase',
    text: 'The plant needs water to grow.',
    words: [['The'], ['plant'], ['needs'], ['wa', 'ter'], ['to'], ['grow.']],
    breaks: [],
    contour: [0.3, 0.7, 0.5, 0.65, 0.35, 0.4, 0.2],
    stress: [1, 3, 6],
    foco: 'ritmo',
    bands: EN_BANDS,
    franja: 70,
    gloss: 'La planta necesita agua para crecer.',
    gestures: [
      {
        op: 'reformula',
        prompt: '¿Qué dice la frase, con tus palabras?',
        options: [
          { text: 'Sin agua, la planta no crece.', ok: true },
          { text: 'La planta, el agua, crecer.', ok: false, tipo: 'causa-efecto', fragmento: 'to grow', hipotesis: 'Parece que aquí se traduce palabra a palabra y se pierde la causa.' },
          { text: 'La planta crece y luego bebe agua.', ok: false, tipo: 'causa-efecto', fragmento: 'needs … to grow', hipotesis: 'Parece que aquí la causa y el efecto están al revés.' },
        ],
      },
      {
        op: 'transfiere',
        prompt: '¿Dónde pasa lo mismo cerca de ti?',
        options: [
          { text: 'Si no llueve, el maíz del huerto no crece.', ok: true },
          { text: 'Si llueve, el sol se apaga.', ok: false, tipo: 'causa-efecto', hipotesis: 'Parece que aquí la relación causa-efecto aún no viaja a otro caso.' },
          { text: 'Las piedras crecen con agua.', ok: false, tipo: 'inferencia', hipotesis: 'Parece que aquí falta ver que solo lo vivo crece.' },
        ],
      },
      {
        op: 'objeta',
        prompt: '¿Cuál NO cuadra?',
        options: [
          { text: 'The plant grows without water.', ok: true },
          { text: 'Plants need water.', ok: false, tipo: 'causa-efecto' },
          { text: 'Water helps plants grow.', ok: false, tipo: 'causa-efecto' },
        ],
      },
    ],
    limitWords: ['plant', 'needs', 'grow'],
    levers: {
      'causa-efecto': { kind: 'pregunta', text: '¿Qué le pasaría a la planta sin agua?' },
      vocabulario: { kind: 'conexion', text: 'Piensa en el huerto de tu casa: ¿qué hace una planta cuando «grow»?' },
    },
  },
  {
    id: 'estrella',
    lang: 'en',
    kind: 'frase',
    text: 'Twinkle, twinkle, little star.',
    words: [['Twin', 'kle,'], ['twin', 'kle,'], ['lit', 'tle'], ['star.']],
    breaks: [1, 3],
    contour: [0.2, 0.2, 0.75, 0.75, 0.9, 0.9, 0.7],
    stress: [0, 2, 4, 6],
    foco: 'melodia',
    bands: { ...EN_BANDS, deltaF0: [6, 14] },
    franja: 70,
    gloss: 'Brilla, brilla, estrellita.',
    gestures: [
      {
        op: 'reformula',
        prompt: '¿Qué está diciendo la canción?',
        options: [
          { text: 'Brilla, brilla, estrellita.', ok: true },
          { text: 'La estrella se cae.', ok: false, tipo: 'vocabulario', fragmento: 'twinkle', hipotesis: 'Parece que aquí «twinkle» aún no tiene imagen.' },
          { text: 'Hay muchas estrellas grandes.', ok: false, tipo: 'vocabulario', fragmento: 'little', hipotesis: 'Parece que aquí «little» se pierde.' },
        ],
      },
      {
        op: 'transfiere',
        prompt: '¿Qué otra cosa también «twinkle»?',
        options: [
          { text: 'Una luciérnaga en el campo, de noche.', ok: true },
          { text: 'Una piedra en la sombra.', ok: false, tipo: 'vocabulario', fragmento: 'twinkle' },
          { text: 'Un pan recién hecho.', ok: false, tipo: 'vocabulario', fragmento: 'twinkle' },
        ],
      },
      {
        op: 'objeta',
        prompt: '¿Cuál NO cuadra con la canción?',
        options: [
          { text: 'The star is very big and dark.', ok: true },
          { text: 'The star is little.', ok: false, tipo: 'vocabulario', fragmento: 'little' },
          { text: 'The star shines.', ok: false, tipo: 'vocabulario', fragmento: 'twinkle' },
        ],
      },
    ],
    limitWords: ['twinkle', 'little', 'star'],
    levers: {
      vocabulario: { kind: 'conexion', text: '¿Has visto una luz que se enciende y se apaga en la noche?' },
    },
    prosodyLevers: {
      melodia: { kind: 'audio', text: 'Sube la voz donde sube la estrella.' },
    },
  },
]

export function getItem(id: string) {
  return ITEMS.find((i) => i.id === id) ?? ITEMS[0]
}

export function syllablesOf(item: Item) {
  return item.words.flat()
}

export function toTarget(item: Item, bands?: Bands): Target {
  return {
    itemId: item.id,
    text: item.text,
    syllables: syllablesOf(item).length,
    bands: bands ?? item.bands,
    franja: item.franja,
    levers: item.levers,
    prosodyLevers: item.prosodyLevers,
  }
}

export interface WorkedCase {
  texto: string
  produce: string
  hipotesis: string
  plano: 'prosodia' | 'comprension'
  palanca: string
  demuestra: string
  operacion: string
}

export const WORKED_CASES: WorkedCase[] = [
  {
    texto: 'El río la lleva hasta el mar.',
    produce: 'Lee «la lleva» de corrido, pero no sabe a qué se refiere «la».',
    plano: 'comprension',
    hipotesis: 'Parece que aquí no queda claro el referente del pronombre.',
    palanca: '¿Qué puede llevar un río, si no es el agua?',
    demuestra: 'Reformula: «el agua».',
    operacion: 'reformula',
  },
  {
    texto: 'The plant needs water to grow.',
    produce: 'Traduce palabra a palabra: «la planta, el agua, crecer».',
    plano: 'comprension',
    hipotesis: 'Parece que aquí se pierde la relación causa-efecto.',
    palanca: '¿Qué le pasaría a la planta sin agua?',
    demuestra: 'Transfiere: «si no llueve, el maíz del huerto no crece».',
    operacion: 'transfiere',
  },
  {
    texto: 'Twinkle, twinkle, little star.',
    produce: 'Lee cada palabra bien, pero en plano, sin melodía.',
    plano: 'prosodia',
    hipotesis: 'Parece que aquí la voz se queda plana: la melodía.',
    palanca: 'El modelo en audio + «sube la voz donde sube la estrella».',
    demuestra: 'Reproduce la subida en «little star».',
    operacion: 'reproduce',
  },
]
