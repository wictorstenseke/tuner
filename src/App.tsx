import { useTuner, GUITAR_STRINGS } from './useTuner'
import './App.css'

function CentsStrip({ cents, active }: { cents: number; active: boolean }) {
  const totalDots = 23
  const center = Math.floor(totalDots / 2)

  const inTuneZone = active && Math.abs(cents) < 3
  const label = !active ? '\u00A0' : inTuneZone ? 'IN TUNE' : cents < 0 ? 'FLAT' : 'SHARP'

  return (
    <div className="cents-strip">
      <div className="cents-dots">
        {Array.from({ length: totalDots }, (_, i) => {
          if (i === center) {
            const inZone = active && Math.abs(cents) < 3
            return (
              <div
                key="center-block"
                className={`center-block ${inZone ? 'lit' : ''}`}
                style={{
                  background: inZone ? '#00ff88' : '#333',
                  boxShadow: inZone ? '0 0 8px #00ff88' : 'none',
                }}
              />
            )
          }
          const position = ((i - center) / center) * 50
          const isCenterBlock = Math.abs(i - center) <= 1
          if (isCenterBlock) return null

          const dist = active ? Math.abs(position - cents) : Infinity
          const lit = dist < 6

          let color = '#333'
          if (lit) {
            if (Math.abs(position) < 12) color = '#00cc44'
            else if (Math.abs(position) >= 40) color = '#ff2222'
            else color = '#ffaa00'
          }

          const beforeCenter = i === center - 2
          const afterCenter = i === center + 2

          return (
            <div
              key={i}
              className={`cents-dot ${lit ? 'lit' : ''} ${beforeCenter ? 'before-center' : ''} ${afterCenter ? 'after-center' : ''}`}
              style={{
                background: color,
                boxShadow: lit ? `0 0 6px ${color}` : 'none',
              }}
            />
          )
        })}
      </div>
      <div className={`cents-label-text ${inTuneZone ? 'in-tune' : ''}`}>{label}</div>
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

  const inTune = tuner.note && Math.abs(tuner.cents) < 5

  return (
    <div className="pedal-board">
      <div className="pedal">
        <Screw className="top-left" />
        <Screw className="top-right" />

        <div className="pedal-top-label">
          <span className="brand">CHROMATIC</span>
          <span className="model">OS-1</span>
        </div>

        <div className="display">
          <div className="display-inner">
            <div className={`note-display ${inTune ? 'in-tune' : ''}`}>
              {tuner.note || '--'}
            </div>

            <CentsStrip cents={tuner.cents} active={!!tuner.note} />

            {tuner.error && (
              <div className="error-display">{tuner.error}</div>
            )}
          </div>
        </div>

        <div className="string-indicators">
          {GUITAR_STRINGS.map((s) => (
            <StringIndicator
              key={`${s.note}${s.octave}`}
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
          <div className="jack-label left">
            <span className="arrow">&larr;</span> OUTPUT
          </div>
          <div className={`status-led ${tuner.isListening ? 'on' : ''}`} />
          <div className="jack-label right">
            INPUT <span className="arrow">&larr;</span>
          </div>
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
  )
}
