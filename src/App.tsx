import { useTuner, GUITAR_STRINGS } from './useTuner'
import './App.css'

function LEDRing({ cents, active }: { cents: number; active: boolean }) {
  const totalLEDs = 25
  const leds = []

  for (let i = 0; i < totalLEDs; i++) {
    const angle = -135 + (i / (totalLEDs - 1)) * 270
    const rad = (angle * Math.PI) / 180
    const r = 44
    const cx = 50 + r * Math.cos(rad)
    const cy = 50 + r * Math.sin(rad)

    const ledPosition = (i / (totalLEDs - 1)) * 100 - 50 // -50 to 50
    const isCenter = i === Math.floor(totalLEDs / 2)

    let lit = false
    if (active) {
      const centsPosition = cents * (50 / 50)
      const dist = Math.abs(ledPosition - centsPosition)
      lit = dist < 4
    }

    const isGreen = Math.abs(ledPosition) < 10
    const isRed = Math.abs(ledPosition) >= 40

    let color = '#333'
    if (lit) {
      if (isCenter && Math.abs(cents) < 3) color = '#00ff88'
      else if (isGreen) color = '#00cc44'
      else if (isRed) color = '#ff2222'
      else color = '#ffaa00'
    }

    leds.push(
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={isCenter ? 2.5 : 2}
        fill={color}
        style={{
          filter: lit ? `drop-shadow(0 0 ${isCenter && Math.abs(cents) < 3 ? '6px' : '4px'} ${color})` : 'none',
          transition: 'fill 0.08s, filter 0.08s',
        }}
      />
    )
  }

  return (
    <svg viewBox="0 0 100 100" className="led-ring">
      {leds}
    </svg>
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
        <Screw className="bottom-left" />
        <Screw className="bottom-right" />

        <div className="pedal-top-label">
          <span className="brand">CHROMATIC</span>
        </div>

        <div className="display">
          <div className="display-inner">
            <LEDRing cents={tuner.cents} active={!!tuner.note} />

            <div className="display-content">
              <div className={`note-display ${inTune ? 'in-tune' : ''}`}>
                {tuner.note || '--'}
              </div>
              <div className="octave-display">
                {tuner.octave !== null ? tuner.octave : ''}
              </div>
            </div>

            <div className="freq-display">
              {tuner.frequency ? `${tuner.frequency} Hz` : '--- Hz'}
            </div>

            <div className="cents-display">
              {tuner.note ? `${tuner.cents > 0 ? '+' : ''}${tuner.cents}\u00A2` : ''}
            </div>

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

        <div className="pedal-name">
          <span className="pedal-name-main">TUNER</span>
          <span className="pedal-name-sub">GT-1</span>
        </div>

        <button
          className={`footswitch ${tuner.isListening ? 'active' : ''}`}
          onClick={tuner.toggle}
        >
          <div className="footswitch-top">
            <div className="footswitch-texture" />
          </div>
        </button>

        <div className={`status-led ${tuner.isListening ? 'on' : ''}`} />

        <div className="pedal-bottom">
          <div className="jack-label left">
            <span className="arrow">&larr;</span> OUTPUT
          </div>
          <div className="jack-label right">
            INPUT <span className="arrow">&rarr;</span>
          </div>
        </div>
      </div>
    </div>
  )
}
