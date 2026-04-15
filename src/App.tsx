import { useState, useEffect, useCallback, useRef } from 'react'
import { useTuner, TUNINGS } from './useTuner'
import './App.css'

function ArcMeter({ cents, active, startupCents }: { cents: number; active: boolean; startupCents?: number | null }) {
  const isStartup = startupCents != null
  const effectiveCents = isStartup ? startupCents : cents
  const effectiveActive = isStartup || active
  const width = 280
  const height = 60
  const cx = width / 2

  // Arc geometry: center far below viewBox, large radius → shallow arc
  // Dots sit near the top of the viewBox
  const arcCenterY = 500        // far below
  const arcRadius = 478          // large radius so arc is shallow
  const arcAngle = 14            // degrees each side — keeps dots within width
  const totalDots = 21

  // Needle pivot below viewBox for subtle angular swing
  const pivotY = 600
  const needleLength = 575       // long enough that tip reaches dot row

  const clampedCents = Math.max(-50, Math.min(50, effectiveCents))
  const needleDeg = effectiveActive ? (clampedCents / 50) * arcAngle : 0
  const inTune = !isStartup && active && Math.abs(cents) < 3

  const degToRad = (d: number) => (d * Math.PI) / 180

  // Dot positions along arc
  const dots = Array.from({ length: totalDots }, (_, i) => {
    const t = (i / (totalDots - 1)) * 2 - 1 // -1 to +1
    const angle = t * arcAngle
    const rad = degToRad(angle)
    const x = cx + arcRadius * Math.sin(rad)
    const y = arcCenterY - arcRadius * Math.cos(rad)

    const norm = Math.abs(t)
    let color: string
    if (norm < 0.15) color = '#00cc44'
    else if (norm < 0.55) color = '#ffaa00'
    else color = '#ff2222'

    return { x, y, color, t }
  })

  // Compute needle line coordinates directly
  const degToRadN = (d: number) => (d * Math.PI) / 180
  const needleRad = degToRadN(needleDeg)
  const tipX = cx + needleLength * Math.sin(needleRad)
  const tipY = pivotY - needleLength * Math.cos(needleRad)
  const bottomX = cx + (pivotY - height) * Math.sin(needleRad) / Math.cos(needleRad || 0.0001)
  const bottomY = height

  return (
    <div className="arc-meter">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Side dots — skip center 3 (indices 9,10,11) */}
        {dots.map((dot, i) => {
          if (i >= 9 && i <= 11) return null
          // Find closest single dot to needle
          const closestIdx = dots.reduce((best, d, j) => {
            if (j >= 9 && j <= 11) return best
            const dDist = Math.abs(d.t * arcAngle - needleDeg)
            return dDist < Math.abs(dots[best].t * arcAngle - needleDeg) ? j : best
          }, 0)
          const lit = effectiveActive && i === closestIdx

          return (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={3}
              fill={lit ? dot.color : '#333'}
              filter={lit ? 'url(#glow)' : undefined}
              opacity={lit ? 1 : 0.4}
            />
          )
        })}

        {/* Center rectangle — green when in tune */}
        {(() => {
          const centerDot = dots[10]
          const leftDot = dots[9]
          const rightDot = dots[11]
          const rectWidth = rightDot.x - leftDot.x + 6
          const rectHeight = 7
          const rectLit = inTune || (effectiveActive && Math.abs(needleDeg) < arcAngle * 0.15)
          const rectColor = inTune ? '#00ff88' : rectLit ? '#00cc44' : '#333'
          return (
            <rect
              x={centerDot.x - rectWidth / 2}
              y={centerDot.y - rectHeight / 2}
              width={rectWidth}
              height={rectHeight}
              rx={3}
              fill={rectColor}
              filter={rectLit ? 'url(#glow)' : undefined}
              opacity={rectLit ? 1 : 0.4}
            />
          )
        })()}

        {/* Needle — computed coordinates, no CSS transform */}
        <line
          x1={bottomX}
          y1={bottomY}
          x2={tipX}
          y2={tipY}
          stroke={inTune ? '#00ff88' : '#ff6644'}
          strokeWidth={1.5}
          strokeLinecap="round"
          style={{
            filter: inTune
              ? 'drop-shadow(0 0 4px #00ff88)'
              : 'drop-shadow(0 0 3px rgba(255,102,68,0.5))',
          }}
        />
      </svg>
    </div>
  )
}

function Screw({ className }: { className: string }) {
  return (
    <div className={`screw ${className}`}>
      <div className="screw-slot" />
    </div>
  )
}

function StringIndicator({ note, isActive }: { note: string; isActive: boolean }) {
  return (
    <div className={`string-dot ${isActive ? 'active' : ''}`}>
      {note}
    </div>
  )
}

export default function App() {
  const tuner = useTuner()
  const currentTuning = TUNINGS[tuner.tuningIndex]

  // Boot animation state
  const [bootAllLeds, setBootAllLeds] = useState(false)
  const [bootCents, setBootCents] = useState<number | null>(null)
  const [isBooting, setIsBooting] = useState(false)
  const bootRafRef = useRef<number>(0)

  const easeInOut = useCallback((t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t, [])

  const playBootAnimation = useCallback(() => {
    return new Promise<void>((resolve) => {
      setIsBooting(true)
      setBootAllLeds(true)
      const totalDuration = 1800

      const keyframes: [number, number][] = [
        [0, 0],
        [200, -50],
        [800, 50],
        [1400, 0],
      ]

      const startTime = performance.now()

      const animate = (now: number) => {
        const elapsed = now - startTime

        let cents = 0
        for (let k = 0; k < keyframes.length - 1; k++) {
          const [t0, c0] = keyframes[k]
          const [t1, c1] = keyframes[k + 1]
          if (elapsed >= t0 && elapsed < t1) {
            const t = easeInOut((elapsed - t0) / (t1 - t0))
            cents = c0 + (c1 - c0) * t
            break
          }
          if (k === keyframes.length - 2) cents = keyframes[keyframes.length - 1][1]
        }

        if (elapsed < totalDuration) {
          setBootCents(cents)
          bootRafRef.current = requestAnimationFrame(animate)
        } else {
          setBootCents(null)
          setBootAllLeds(false)
          setIsBooting(false)
          resolve()
        }
      }

      bootRafRef.current = requestAnimationFrame(animate)
    })
  }, [easeInOut])

  const handleToggle = useCallback(async () => {
    if (tuner.isListening) {
      tuner.stop()
    } else if (!isBooting) {
      // Start mic first (needs user gesture, triggers permission prompt)
      await tuner.start()
      // Then play animation — mic already listening in background
      await playBootAnimation()
    }
  }, [tuner, isBooting, playBootAnimation])

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(bootRafRef.current)
  }, [])

  const inTune = tuner.note && Math.abs(tuner.cents) < 5

  return (
    <div className="pedal-board">
      <div className="pedal-wrapper">
      <div className="pedal-side" />
      <div className="pedal">
        <Screw className="top-left" />
        <Screw className="top-right" />

        <div className="pedal-top-label">
          <span className="brand">LLESNOTE-1</span>
        </div>

        <div className="display">
          <div className="display-inner">
            {(tuner.isListening || isBooting) && (
              <>
                <div className="version-label">v{APP_VERSION}</div>
                <div className="tuning-label">{currentTuning.label}</div>
              </>
            )}
            <div className={`note-display ${inTune ? 'in-tune' : ''}`}>
              {tuner.isListening || isBooting ? (tuner.note || '--') : ''}
            </div>

            <ArcMeter cents={tuner.cents} active={!!tuner.note} startupCents={bootCents} />

            {tuner.error && (
              <div className="error-display">{tuner.error}</div>
            )}
          </div>
        </div>

        <div className="string-indicators">
          {currentTuning.strings.map((s, i) => (
            <StringIndicator
              key={`${s.note}${s.octave}-${i}`}
              note={s.note}
              isActive={
                bootAllLeds ||
                (!bootAllLeds &&
                !!tuner.closestString &&
                tuner.closestString.note === s.note &&
                tuner.closestString.octave === s.octave)
              }
            />
          ))}
        </div>

        <div className="pedal-mid">
          <button className="jack-btn left" onClick={tuner.prevTuning}>
            <svg className="jack-arrow" viewBox="0 0 20 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="5" x2="1" y2="5" />
              <polyline points="6,1 1,5 6,9" />
            </svg>
            OUTPUT
          </button>
          <div className={`status-led ${tuner.isListening ? 'on' : ''}`} />
          <button className="jack-btn right" onClick={tuner.nextTuning}>
            INPUT
            <svg className="jack-arrow" viewBox="0 0 20 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="5" x2="1" y2="5" />
              <polyline points="6,1 1,5 6,9" />
            </svg>
          </button>
        </div>

        <button
          className={`footswitch ${tuner.isListening ? 'active' : ''}`}
          onClick={handleToggle}
        >
          <div className="footswitch-cap">
            <div className="footswitch-texture" />
          </div>
        </button>
      </div>
      </div>
    </div>
  )
}
