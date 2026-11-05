'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { bandsFromReference, useEmma } from '@/components/providers/emma-store'
import { ITEMS, syllablesOf, toTarget } from '@/lib/content'
import { analyze, envelopeOf } from '@/lib/engine/analyze'
import type { CaptureResult } from '@/lib/engine/capture'
import { facilitate, initialState } from '@/lib/engine/facilitate'
import type { ComprehensionResult, Contract, Envelope, FacilitatorState, Measurement } from '@/lib/engine/types'
import { AchievementStep } from './achievement-step'
import { ComprehensionStep } from './comprehension-step'
import { DevolucionStep } from './devolucion-step'
import { DisposicionStep } from './disposicion-step'
import { FootprintStep } from './footprint-step'
import { ListeningStep } from './listening-step'
import { ReadingStep } from './reading-step'

type Step = 'disposicion' | 'lectura' | 'escucha' | 'huella' | 'comprension' | 'devolucion' | 'logro'

export interface LastReading {
  capture: CaptureResult
  measurement: Measurement
  envelope: Envelope
  readingId: string
}

export function ChildFlow() {
  const router = useRouter()
  const { student, disposicion, setDisposicion, references, addReading, addHypothesis, settings } = useEmma()
  const [step, setStep] = useState<Step>(disposicion ? 'lectura' : 'disposicion')
  const [itemIndex, setItemIndex] = useState(0)
  const [fstate, setFstate] = useState<FacilitatorState>(() => initialState(ITEMS[0].id))
  const [contract, setContract] = useState<Contract | null>(null)
  const [last, setLast] = useState<LastReading | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [baseline, setBaseline] = useState<number | null>(null)

  useEffect(() => {
    if (student === null) router.replace('/clase')
  }, [student, router])

  const item = ITEMS[itemIndex]
  const ref = references[item.id]
  const target = toTarget(item, bandsFromReference(item.bands, ref))

  function runFacilitator(measurement: Measurement, readingId: string) {
    const out = facilitate({ measurement, target, disposicion: disposicion ?? 'normal', foco: item.foco, state: fstate })
    setFstate(out.state)
    setContract(out.contract)
    if (out.contract.barrier && student !== null) {
      addHypothesis({ student, itemId: item.id, barrier: out.contract.barrier, readingId })
    }
    setStep(out.contract.retired ? 'logro' : 'devolucion')
  }

  function onCaptured(capture: CaptureResult) {
    const measurement = { ...analyze(capture.buffer, { bands: target.bands, syllables: target.syllables }), simulated: capture.simulated }
    const envelope = envelopeOf(capture.buffer)
    const reading = addReading({ who: student ?? 0, itemId: item.id, measurement, envelope })
    if (baseline === null && !measurement.empty) setBaseline(measurement.kappa)
    setAttempt((a) => a + 1)
    setLast({ capture, measurement, envelope, readingId: reading.id })
    setStep('huella')
  }

  function afterFootprint() {
    if (!last) return
    if (last.measurement.empty) return setStep('lectura')
    if (!fstate.comprehensionDemonstrated) return setStep('comprension')
    runFacilitator(last.measurement, last.readingId)
  }

  function onComprehension(result: ComprehensionResult) {
    if (!last) return
    runFacilitator({ ...last.measurement, comprension: result }, last.readingId)
  }

  function nextItem() {
    const next = (itemIndex + 1) % ITEMS.length
    setItemIndex(next)
    setFstate(initialState(ITEMS[next].id))
    setContract(null)
    setLast(null)
    setAttempt(0)
    setBaseline(null)
    setStep('lectura')
  }

  function chooseItem(index: number) {
    if (index === itemIndex) return
    setItemIndex(index)
    setFstate(initialState(ITEMS[index].id))
    setContract(null)
    setLast(null)
    setAttempt(0)
    setBaseline(null)
  }

  if (student === null) return null

  switch (step) {
    case 'disposicion':
      return (
        <DisposicionStep
          student={student}
          onChoose={(d) => {
            setDisposicion(d)
            setStep('lectura')
          }}
        />
      )
    case 'lectura':
      return (
        <ReadingStep
          item={item}
          itemIndex={itemIndex}
          onChooseItem={chooseItem}
          andamio={contract && !contract.retired ? contract.andamio : null}
          disposicion={disposicion ?? 'normal'}
          easy={settings.easyText}
          hasReference={Boolean(ref)}
          onRead={() => setStep('escucha')}
        />
      )
    case 'escucha':
      return <ListeningStep item={item} attempt={attempt} onCaptured={onCaptured} onCancel={() => setStep('lectura')} />
    case 'huella':
      return last ? (
        <FootprintStep
          item={item}
          last={last}
          baseline={baseline}
          franja={target.franja}
          onContinue={afterFootprint}
          onRetry={() => setStep('lectura')}
        />
      ) : null
    case 'comprension':
      return <ComprehensionStep item={item} onDone={onComprehension} />
    case 'devolucion':
      return last && contract ? (
        <DevolucionStep item={item} last={last} contract={contract} onAgain={() => setStep('lectura')} />
      ) : null
    case 'logro':
      return <AchievementStep item={item} kappas={fstate.kappas} franja={target.franja} onNext={nextItem} />
  }
}
