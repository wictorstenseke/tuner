import { useTuner, TUNINGS } from './useTuner'
import './App.css'

function ArcMeter({ cents, active }: { cents: number; active: boolean }) {
  const width = 240
  const height = 80
  const cx = width / 2
  // Pivot far below visible area — long virtual needle = subtle swing
  const pivotY = 320
  const arcRadius = 260
  const arcCenterY = height + 10

  // Arc spans ~120° centered at top
  const arcStartAngle = -60
  const arcEndAngle = 60
  const totalSegments = 21

  // Needle angle: map cents (-50..+50) to arc angle range
  const clampedCents = Math.max(-50, Math.min(50, cents))
  const needleAngle = active ? (clampedCents / 50) * 60 : 0

  const degToRad = (d: number) => (d * Math.PI) / 180

  // Generate arc segment positions
  const segments = Array.from({ length: totalSegments }, (_, i) => {
    const t = i / (totalSegments - 1)
    const angle = arcStartAngle + t * (arcEndAngle - arcStartAngle)
    const rad = degToRad(angle - 90)
    const x = cx + arcRadius * Math.cos(rad)
    const y = arcCenterY + arcRadius * Math.sin(rad)

    // Color zones: center green, mid yellow, edges red
    const normalizedPos = Math.abs(t - 0.5) * 2 // 0 at center, 1 at edges
    let color: string
    if (normalizedPos < 0.25) color = '#00cc44'
    else if (normalizedPos < 0.75) color = '#ffaa00'
    else color = '#ff2222'

    return { x, y, angle, color }
  })

  // Needle line from pivot to above arc
  const needleRad = degToRad(needleAngle - 90)
  const needleLength = pivotY - arcCenterY + arcRadius + 20
  const needleTipX = cx + needleLength * Math.cos(needleRad)
  const needleTipY = pivotY + needleLength * Math.sin(needleRad)

  const inTune = active && Math.abs(cents) < 3

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

        {/* Arc segments */}
        {segments.map((seg, i) => {
          const segPos = Math.abs(i - (totalSegments - 1) / 2) / ((totalSegments - 1) / 2)
          const needlePos = Math.abs(clampedCents) / 50
          const lit = active && segPos <= needlePos + 0.05 &&
            ((clampedCents >= 0 && i >= (totalSegments - 1) / 2) ||
             (clampedCents < 0 && i <= (totalSegments - 1) / 2) ||
             Math.abs(i - (totalSegments - 1) / 2) < 1.5)

          return (
            <circle
              key={i}
              cx={seg.x}
              cy={seg.y}
              r={3}
              fill={lit ? seg.color : '#333'}
              filter={lit ? 'url(#glow)' : undefined}
              opacity={lit ? 1 : 0.5}
            />
          )
        })}

        {/* Center tick mark */}
        <line
          x1={cx}
          y1={arcCenterY - arcRadius - 6}
          x2={cx}
          y2={arcCenterY - arcRadius - 12}
          stroke={inTune ? '#00ff88' : '#555'}
          strokeWidth={1.5}
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={pivotY}
          x2={needleTipX}
          y2={needleTipY}
          stroke={inTune ? '#00ff88' : '#ff6644'}
          strokeWidth={1.5}
          strokeLinecap="round"
          className="arc-needle"
          style={{
            filter: inTune ? 'drop-shadow(0 0 4px #00ff88)' : 'drop-shadow(0 0 3px rgba(255,102,68,0.5))',
            transformOrigin: `${cx}px ${pivotY}px`,
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
