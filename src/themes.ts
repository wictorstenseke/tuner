export interface PedalTheme {
  id: string
  label: string
  // Pedal body
  pedalGradient: string
  sideGradient: string
  sideAccent: string
  // Brand text
  brandColor: string
  brandShadow: string
  // Accent colors (indicators, LED, in-tune states)
  accent: string
  accentDark: string
  accentGlow: string
  // LED
  ledOff: string
  ledGradient: string
  ledGlow: string
}

export const THEMES: PedalTheme[] = [
  {
    id: 'red',
    label: 'Red',
    pedalGradient: 'linear-gradient(175deg, #d42a2a 0%, #bb1515 15%, #aa1111 40%, #881010 85%, #6e0c0c 100%)',
    sideGradient: 'linear-gradient(180deg, #6e0c0c 0%, #3a0505 40%, #1a0202 100%)',
    sideAccent: 'rgba(255, 80, 80, 0.08)',
    brandColor: 'rgba(255, 255, 255, 0.85)',
    brandShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
    accent: '#00ff88',
    accentDark: '#00cc44',
    accentGlow: 'rgba(0, 255, 136, 0.5)',
    ledOff: '#113311',
    ledGradient: 'radial-gradient(circle at 40% 35%, #ffffff, #44ffaa 40%, #00ff66 70%)',
    ledGlow: '0 0 8px #00ff66, 0 0 18px rgba(0, 255, 102, 0.7), 0 0 36px rgba(0, 255, 102, 0.4), 0 0 56px rgba(0, 255, 102, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.15)',
  },
  {
    id: 'yellow',
    label: 'Yellow',
    pedalGradient: 'linear-gradient(175deg, #e8c820 0%, #d4b010 15%, #c09e0e 40%, #9a7e0a 85%, #7a6208 100%)',
    sideGradient: 'linear-gradient(180deg, #7a6208 0%, #3d3004 40%, #1a1502 100%)',
    sideAccent: 'rgba(255, 220, 80, 0.08)',
    brandColor: 'rgba(0, 0, 0, 0.7)',
    brandShadow: '0 1px 2px rgba(255, 255, 255, 0.15)',
    accent: '#ff4444',
    accentDark: '#cc2222',
    accentGlow: 'rgba(255, 68, 68, 0.5)',
    ledOff: '#331111',
    ledGradient: 'radial-gradient(circle at 40% 35%, #ffffff, #ff8888 40%, #ff4444 70%)',
    ledGlow: '0 0 8px #ff4444, 0 0 18px rgba(255, 68, 68, 0.7), 0 0 36px rgba(255, 68, 68, 0.4), 0 0 56px rgba(255, 68, 68, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.15)',
  },
  {
    id: 'white',
    label: 'White',
    pedalGradient: 'linear-gradient(175deg, #e8e8e8 0%, #d8d8d8 15%, #c8c8c8 40%, #a8a8a8 85%, #909090 100%)',
    sideGradient: 'linear-gradient(180deg, #909090 0%, #505050 40%, #2a2a2a 100%)',
    sideAccent: 'rgba(255, 255, 255, 0.1)',
    brandColor: 'rgba(0, 0, 0, 0.75)',
    brandShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
    accent: '#00cc99',
    accentDark: '#009977',
    accentGlow: 'rgba(0, 204, 153, 0.5)',
    ledOff: '#0d2620',
    ledGradient: 'radial-gradient(circle at 40% 35%, #ffffff, #44ddbb 40%, #00cc99 70%)',
    ledGlow: '0 0 8px #00cc99, 0 0 18px rgba(0, 204, 153, 0.7), 0 0 36px rgba(0, 204, 153, 0.4), 0 0 56px rgba(0, 204, 153, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.15)',
  },
  {
    id: 'black',
    label: 'Black',
    pedalGradient: 'linear-gradient(175deg, #3a3a3a 0%, #2e2e2e 15%, #252525 40%, #1a1a1a 85%, #111111 100%)',
    sideGradient: 'linear-gradient(180deg, #111111 0%, #0a0a0a 40%, #050505 100%)',
    sideAccent: 'rgba(255, 255, 255, 0.04)',
    brandColor: 'rgba(255, 255, 255, 0.7)',
    brandShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
    accent: '#ff6633',
    accentDark: '#cc4422',
    accentGlow: 'rgba(255, 102, 51, 0.5)',
    ledOff: '#331508',
    ledGradient: 'radial-gradient(circle at 40% 35%, #ffffff, #ff9966 40%, #ff6633 70%)',
    ledGlow: '0 0 8px #ff6633, 0 0 18px rgba(255, 102, 51, 0.7), 0 0 36px rgba(255, 102, 51, 0.4), 0 0 56px rgba(255, 102, 51, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.15)',
  },
  {
    id: 'orange',
    label: 'Orange',
    pedalGradient: 'linear-gradient(175deg, #e87020 0%, #d45e15 15%, #c05010 40%, #983e0c 85%, #7a3008 100%)',
    sideGradient: 'linear-gradient(180deg, #7a3008 0%, #3d1804 40%, #1a0a02 100%)',
    sideAccent: 'rgba(255, 140, 60, 0.08)',
    brandColor: 'rgba(255, 255, 255, 0.85)',
    brandShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
    accent: '#ffcc00',
    accentDark: '#cc9900',
    accentGlow: 'rgba(255, 204, 0, 0.5)',
    ledOff: '#332200',
    ledGradient: 'radial-gradient(circle at 40% 35%, #ffffff, #ffdd55 40%, #ffcc00 70%)',
    ledGlow: '0 0 8px #ffcc00, 0 0 18px rgba(255, 204, 0, 0.7), 0 0 36px rgba(255, 204, 0, 0.4), 0 0 56px rgba(255, 204, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.15)',
  },
]

const STORAGE_KEY = 'tuner-theme'

export function loadTheme(): PedalTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const found = THEMES.find(t => t.id === saved)
      if (found) return found
    }
  } catch { /* ignore */ }
  return THEMES[0]
}

export function saveTheme(themeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, themeId)
  } catch { /* ignore */ }
}
