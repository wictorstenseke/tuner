import { useCallback, useRef, useState } from 'react'
import { PitchDetector } from 'pitchy'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

// Standard guitar tuning frequencies
const GUITAR_STRINGS = [
  { note: 'E', octave: 2, freq: 82.41 },
  { note: 'A', octave: 2, freq: 110.0 },
  { note: 'D', octave: 3, freq: 146.83 },
  { note: 'G', octave: 3, freq: 196.0 },
  { note: 'B', octave: 3, freq: 246.94 },
  { note: 'E', octave: 4, freq: 329.63 },
] as const

export interface TunerState {
  isListening: boolean
  note: string | null
  frequency: number | null
  cents: number
  octave: number | null
  clarity: number
  closestString: (typeof GUITAR_STRINGS)[number] | null
  error: string | null
}

function frequencyToNote(freq: number) {
  const semitones = 12 * Math.log2(freq / 440)
  const roundedSemitones = Math.round(semitones)
  const cents = (semitones - roundedSemitones) * 100
  const noteIndex = ((roundedSemitones % 12) + 12) % 12
  const noteName = NOTE_NAMES[(noteIndex + 9) % 12] // A = 440Hz is index 0
  const octave = Math.floor((roundedSemitones + 9) / 12) + 4
  return { note: noteName, octave, cents }
}

function findClosestString(freq: number) {
  let closest: (typeof GUITAR_STRINGS)[number] = GUITAR_STRINGS[0]
  let minDist = Infinity
  for (const s of GUITAR_STRINGS) {
    const dist = Math.abs(1200 * Math.log2(freq / s.freq))
    if (dist < minDist) {
      minDist = dist
      closest = s
    }
  }
  return minDist < 300 ? closest : null
}

export function useTuner() {
  const [state, setState] = useState<TunerState>({
    isListening: false,
    note: null,
    frequency: null,
    cents: 0,
    octave: null,
    clarity: 0,
    closestString: null,
    error: null,
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioContextRef.current?.close()
    audioContextRef.current = null
    setState((s) => ({ ...s, isListening: false, note: null, frequency: null, cents: 0, clarity: 0, closestString: null }))
  }, [])

  const start = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState((s) => ({ ...s, error: 'Mic not available. Use HTTPS or localhost.' }))
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 4096
      source.connect(analyser)
      analyserRef.current = analyser

      const detector = PitchDetector.forFloat32Array(analyser.fftSize)
      const buffer = new Float32Array(analyser.fftSize)

      setState((s) => ({ ...s, isListening: true, error: null }))

      let smoothedCents = 0
      let lastNote = ''
      const EMA_ALPHA = 0.06 // lower = smoother, higher = more responsive

      const detect = () => {
        analyser.getFloatTimeDomainData(buffer)
        const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate)

        if (clarity > 0.85 && pitch > 60 && pitch < 1200) {
          const { note, octave, cents } = frequencyToNote(pitch)
          const closestString = findClosestString(pitch)

          // Reset smoothing on note change
          if (note !== lastNote) {
            smoothedCents = cents
            lastNote = note
          } else {
            smoothedCents = smoothedCents + EMA_ALPHA * (cents - smoothedCents)
          }

          // Hysteresis: only update display if change is meaningful
          const displayCents = Math.round(smoothedCents)

          setState({
            isListening: true,
            note,
            frequency: Math.round(pitch * 10) / 10,
            cents: displayCents,
            octave,
            clarity: Math.round(clarity * 100) / 100,
            closestString,
            error: null,
          })
        } else {
          setState((s) => ({
            ...s,
            clarity: Math.round(clarity * 100) / 100,
          }))
        }

        rafRef.current = requestAnimationFrame(detect)
      }

      detect()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mic access denied'
      setState((s) => ({ ...s, error: msg }))
    }
  }, [])

  const toggle = useCallback(() => {
    if (state.isListening) {
      stop()
    } else {
      start()
    }
  }, [state.isListening, start, stop])

  return { ...state, toggle, start, stop }
}

export { GUITAR_STRINGS }
