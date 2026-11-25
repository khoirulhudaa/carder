// Efek suara sederhana via WebAudio (tanpa file audio)
let ctx = null;
let muted = false;

export const setMuted = (m) => { muted = m; };

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.12, type = 'sine', vol = 0.07, delay = 0, slide = 0) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}

export const sfx = {
  click: () => tone(520, 0.06, 'triangle', 0.05),
  draw: () => tone(700, 0.05, 'triangle', 0.04),
  cast: () => { tone(440, 0.1, 'triangle'); tone(660, 0.14, 'triangle', 0.07, 0.07); },
  hit: () => tone(200, 0.2, 'sawtooth', 0.08, 0, -120),
  heal: () => { tone(520, 0.12, 'sine'); tone(780, 0.16, 'sine', 0.06, 0.09); },
  buff: () => tone(600, 0.15, 'square', 0.04, 0, 200),
  attack: () => tone(320, 0.14, 'square', 0.05, 0, -160),
  skill: () => { tone(500, 0.1, 'sawtooth', 0.05); tone(750, 0.18, 'sawtooth', 0.05, 0.08); },
  destroy: () => tone(140, 0.35, 'sawtooth', 0.09, 0, -90),
  turn: () => { tone(392, 0.12, 'triangle'); tone(523, 0.16, 'triangle', 0.06, 0.1); },
  flip: () => tone(900, 0.07, 'triangle', 0.05),
  rare: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.07, i * 0.09)); },
  win: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.08, i * 0.11)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sine', 0.08, i * 0.14)); },
};
