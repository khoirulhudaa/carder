import { useStore } from '../store/useStore.js';

/* Suara sobekan bungkus foil, dibuat dengan WebAudio (tanpa file audio). */
let ctx = null;
function audio() {
  if (!ctx) {
    const C = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(a, t, freq, dur, vol) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function tearSound() {
  if (useStore.getState().muted) return;
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime;
  const dur = 0.8;

  // 1) sobekan: derau yang terputus-putus (kresek) lalu meredup
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  const chunk = Math.floor(a.sampleRate * 0.0022);
  let gate = 1;
  for (let i = 0; i < len; i += 1) {
    if (i % chunk === 0) gate = Math.random() > 0.38 ? 1 : 0.12;
    const p = i / len;
    const env = Math.min(1, p / 0.04) * (1 - p) ** 0.7;
    d[i] = (Math.random() * 2 - 1) * gate * env;
  }
  const src = a.createBufferSource();
  src.buffer = buf;

  const hp = a.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1500;

  const bp = a.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(2600, t0);
  bp.frequency.exponentialRampToValueAtTime(7000, t0 + dur * 0.8);

  const g = a.createGain();
  g.gain.setValueAtTime(0.7, t0);
  g.gain.exponentialRampToValueAtTime(0.01, t0 + dur);

  src.connect(hp).connect(bp).connect(g).connect(a.destination);
  src.start(t0);

  // 2) "tak" kecil di awal sobekan
  const snap = a.createBuffer(1, Math.floor(a.sampleRate * 0.03), a.sampleRate);
  const sd = snap.getChannelData(0);
  for (let i = 0; i < sd.length; i += 1) sd[i] = (Math.random() * 2 - 1) * (1 - i / sd.length) ** 2;
  const s2 = a.createBufferSource();
  s2.buffer = snap;
  const sg = a.createGain();
  sg.gain.value = 0.9;
  s2.connect(sg).connect(a.destination);
  s2.start(t0);

  // 3) kilau di akhir (kartu keluar)
  blip(a, t0 + 0.5, 1760, 0.18, 0.08);
  blip(a, t0 + 0.58, 2349, 0.18, 0.07);
  blip(a, t0 + 0.66, 3136, 0.22, 0.06);
}