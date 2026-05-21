// Simple browser-based sound effects using Web Audio API
let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function tone(freq, duration, type = 'sine', volume = 0.15) {
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + duration)
}

export const sounds = {
  correct: () => { tone(523, 0.1); setTimeout(() => tone(784, 0.2), 80) },
  wrong: () => { tone(200, 0.15, 'square', 0.1) },
  click: () => { tone(600, 0.05, 'sine', 0.08) },
  win: () => {
    tone(523, 0.15)
    setTimeout(() => tone(659, 0.15), 120)
    setTimeout(() => tone(784, 0.15), 240)
    setTimeout(() => tone(1047, 0.3), 360)
  },
}