import { useCallback, useEffect, useRef, useState } from 'react'
import { PitchDetector } from 'pitchy'
import { useWakeLock } from './useWakeLock'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export type GuitarString = { note: string; octave: number; freq: number }

export interface Tuning {
  name: string
  label: string
  strings: GuitarString[]
}

export const TUNINGS: Tuning[] = [
  {
    name: 'standard',
    label: 'STANDARD',
    strings: [
      { note: 'E', octave: 2, freq: 82.41 },
      { note: 'A', octave: 2, freq: 110.0 },
      { note: 'D', octave: 3, freq: 146.83 },
      { note: 'G', octave: 3, freq: 196.0 },
      { note: 'B', octave: 3, freq: 246.94 },
      { note: 'E', octave: 4, freq: 329.63 },
    ],
  },
  {
    name: 'drop-d',
    label: 'DROP D',
    strings: [
      { note: 'D', octave: 2, freq: 73.42 },
      { note: 'A', octave: 2, freq: 110.0 },
      { note: 'D', octave: 3, freq: 146.83 },
      { note: 'G', octave: 3, freq: 196.0 },
      { note: 'B', octave: 3, freq: 246.94 },
      { note: 'E', octave: 4, freq: 329.63 },
    ],
  },
  {
    name: 'open-g',
    label: 'OPEN G',
    strings: [
      { note: 'D', octave: 2, freq: 73.42 },
      { note: 'G', octave: 2, freq: 98.0 },
      { note: 'D', octave: 3, freq: 146.83 },
      { note: 'G', octave: 3, freq: 196.0 },
      { note: 'B', octave: 3, freq: 246.94 },
      { note: 'D', octave: 4, freq: 293.66 },
    ],
  },
  {
    name: 'open-d',
    label: 'OPEN D',
    strings: [
      { note: 'D', octave: 2, freq: 73.42 },
      { note: 'A', octave: 2, freq: 110.0 },
      { note: 'D', octave: 3, freq: 146.83 },
      { note: 'F#', octave: 3, freq: 185.0 },
      { note: 'A', octave: 3, freq: 220.0 },
      { note: 'D', octave: 4, freq: 293.66 },
    ],
  },
  {
    name: 'dadgad',
    label: 'DADGAD',
    strings: [
      { note: 'D', octave: 2, freq: 73.42 },
      { note: 'A', octave: 2, freq: 110.0 },
      { note: 'D', octave: 3, freq: 146.83 },
      { note: 'G', octave: 3, freq: 196.0 },
      { note: 'A', octave: 3, freq: 220.0 },
      { note: 'D', octave: 4, freq: 293.66 },
    ],
  },
]

export interface TunerState {
  isListening: boolean
  note: string | null
  frequency: number | null
  cents: number
  octave: number | null
  clarity: number
  closestString: GuitarString | null
  error: string | null
  tuningIndex: number
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

function findClosestString(freq: number, strings: GuitarString[]) {
  let closest: GuitarString = strings[0]
  let minDist = Infinity
  for (const s of strings) {
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
    tuningIndex: 0,
  })

  const tuningIndexRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const detectRef = useRef<(() => void) | null>(null)
  const isListeningRef = useRef(false)

  const wakeLock = useWakeLock()

  const stop = useCallback(() => {
    isListeningRef.current = false
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioContextRef.current?.close()
    audioContextRef.current = null
    detectRef.current = null
    wakeLock.release()
    setState((s) => ({ ...s, isListening: false, note: null, frequency: null, cents: 0, clarity: 0, closestString: null }))
  }, [wakeLock])

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
      // iOS/Android suspend AudioContext until user gesture
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 4096
      source.connect(analyser)
      analyserRef.current = analyser

      const detector = PitchDetector.forFloat32Array(analyser.fftSize)
      const buffer = new Float32Array(analyser.fftSize)

      isListeningRef.current = true
      setState((s) => ({ ...s, isListening: true, error: null }))
      await wakeLock.request()

      let smoothedCents = 0
      let lastNote = ''
      const EMA_ALPHA = 0.06

      const detect = () => {
        analyser.getFloatTimeDomainData(buffer)
        const [pitch, clarity] = detector.findPitch(buffer, audioContext.sampleRate)

        if (clarity > 0.85 && pitch > 60 && pitch < 1200) {
          const { note, octave, cents } = frequencyToNote(pitch)
          const closestString = findClosestString(pitch, TUNINGS[tuningIndexRef.current].strings)

          if (note !== lastNote) {
            smoothedCents = cents
            lastNote = note
          } else {
            smoothedCents = smoothedCents + EMA_ALPHA * (cents - smoothedCents)
          }

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
            tuningIndex: tuningIndexRef.current,
          })
        } else {
          setState((s) => ({
            ...s,
            clarity: Math.round(clarity * 100) / 100,
          }))
        }

        rafRef.current = requestAnimationFrame(detect)
      }

      detectRef.current = detect
      detect()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mic access denied'
      setState((s) => ({ ...s, error: msg }))
    }
  }, [wakeLock])

  // Pause on background, resume on foreground
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'hidden') {
        if (isListeningRef.current && audioContextRef.current) {
          cancelAnimationFrame(rafRef.current)
          audioContextRef.current.suspend()
        }
      } else if (document.visibilityState === 'visible') {
        if (isListeningRef.current && audioContextRef.current && detectRef.current) {
          await audioContextRef.current.resume()
          rafRef.current = requestAnimationFrame(detectRef.current)
          await wakeLock.request()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [wakeLock])

  const toggle = useCallback(() => {
    if (state.isListening) {
      stop()
    } else {
      start()
    }
  }, [state.isListening, start, stop])

  const prevTuning = useCallback(() => {
    const next = (tuningIndexRef.current - 1 + TUNINGS.length) % TUNINGS.length
    tuningIndexRef.current = next
    setState((s) => ({ ...s, tuningIndex: next }))
  }, [])

  const nextTuning = useCallback(() => {
    const next = (tuningIndexRef.current + 1) % TUNINGS.length
    tuningIndexRef.current = next
    setState((s) => ({ ...s, tuningIndex: next }))
  }, [])

  return { ...state, toggle, start, stop, prevTuning, nextTuning }
}
