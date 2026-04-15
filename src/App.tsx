import { useTuner, TUNINGS } from './useTuner'
import './App.css'

function ArcMeter({ cents, active }: { cents: number; active: boolean }) {
  const width = 240
  const height = 70
  const cx = width / 2

  // Arc geometry: center far below, large radius = shallow curve
  const arcCenterY = 300
  const arcRadius = 270
  const arcAngle = 25 // degrees each side from vertical
  const totalDots = 21

  // Needle pivot even further below for subtle swing
  const pivotY = 400
  const needleReach = arcRadius + 30 // needle tip extends past dots

  const clampedCents = Math.max(-50, Math.min(50, cents))
  const needleDeg = active ? (clampedCents / 50) * arcAngle : 0
  const inTune = active && Math.abs(cents) < 3

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
    if (norm < 0.25) color = '#00cc44'
    else if (norm < 0.75) color = '#ffaa00'
    else color = '#ff2222'

    return { x, y, color, t }
  })

  // Needle tip position
  const needleRad = degToRad(needleDeg)
  const tipX = cx + needleReach * Math.sin(needleRad)
  const tipY = pivotY - needleReach * Math.cos(needleRad)

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

        {/* Dots along arc — always visible, lit when needle is near */}
        {dots.map((dot, i) => {
          const dotAngle = dot.t * arcAngle
          const dist = Math.abs(dotAngle - needleDeg)
          const lit = active && dist < 3.5

          return (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={3.5}
              fill={lit ? dot.color : '#333'}
              filter={lit ? 'url(#glow)' : undefined}
              opacity={lit ? 1 : 0.4}
            />
          )
        })}

        {/* Center tick */}
        {(() => {
          const tickRad = degToRad(0)
          const innerR = arcRadius - 8
          const outerR = arcRadius + 8
          return (
            <line
              x1={cx + innerR * Math.sin(tickRad)}
              y1={arcCenterY - innerR * Math.cos(tickRad)}
              x2={cx + outerR * Math.sin(tickRad)}
              y2={arcCenterY - outerR * Math.cos(tickRad)}
              stroke={inTune ? '#00ff88' : '#444'}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          )
        })()}

        {/* Needle — from below viewport up through dots */}
        <line
          x1={cx}
          y1={pivotY}
          x2={tipX}
          y2={tipY}
          stroke={inTune ? '#00ff88' : '#ff6644'}
          strokeWidth={1.5}
          strokeLinecap="round"
          className="arc-needle"
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
            <div className="tuning-label">{currentTuning.label}</div>
            <div className={`note-display ${inTune ? 'in-tune' : ''}`}>
              {tuner.note || '--'}
            </div>

            <ArcMeter cents={tuner.cents} active={!!tuner.note} />

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
                !!tuner.closestString &&
                tuner.closestString.note === s.note &&
                tuner.closestString.octave === s.octave
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
          onClick={tuner.toggle}
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
