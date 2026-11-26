/* ------------------------------------------------------------------ */
/*  sfxfx.js — suara tambahan duel (Web Audio, tanpa file audio)       */
/*  Taruh di: src/lib/sfxfx.js  (sfx.js asli TIDAK diubah)             */
/*                                                                    */
/*  - Serangan & skill: tiap ELEMEN punya karakter suara sendiri       */
/*  - Panggil / sihir / ambil hadiah: tingkat KARTU (C/R/E/L) makin    */
/*    megah: C = satu nada, R = dua nada, E = arpeggio, L = akor+kilau */
/*  - Bertahan (blok/perisai) dan tukar posisi serang <-> bertahan     */
/*  Mengikuti tombol mute di store (useStore.muted).                   */
/* ------------------------------------------------------------------ */
import { useStore } from '../store/useStore.js';

let ctx = null;
let master = null;
let noiseBuf = null;

function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
// buka audio pada interaksi pertama (kebijakan autoplay browser)
if (typeof window !== 'undefined') {
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => ac(), { passive: true }));
}
const enabled = () => {
  try { return !useStore.getState().muted; } catch (e) { return true; }
};

/* ---------- blok dasar ---------- */
function tone({ f = 440, to = null, type = 'sine', d = 0.2, v = 0.2, at = 0.005, t = 0, lp = null, det = 0 }) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + t;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + d);
  if (det) o.detune.value = det;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t0 + at);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  let last = o;
  if (lp) {
    const fl = c.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = lp;
    o.connect(fl);
    last = fl;
  }
  last.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + d + 0.05);
}

function noise({ d = 0.2, v = 0.2, type = 'bandpass', f = 1000, to = null, q = 1, t = 0, at = 0.004 }) {
  const c = ac();
  if (!c) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  const t0 = c.currentTime + t;
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const fl = c.createBiquadFilter();
  fl.type = type;
  fl.Q.value = q;
  fl.frequency.setValueAtTime(f, t0);
  if (to) fl.frequency.exponentialRampToValueAtTime(Math.max(to, 20), t0 + d);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t0 + at);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(fl);
  fl.connect(g);
  g.connect(master);
  s.start(t0);
  s.stop(t0 + d + 0.05);
}

/* ---------- suara tiap elemen ----------
   o   = jeda awal (detik), b = skala durasi (1 = serangan, 1.6 = skill) */
const VOICE = {
  // api: desis naik + dentum berat + percikan retak
  api(o, b) {
    noise({ d: 0.32 * b, v: 0.32, type: 'bandpass', f: 300, to: 2300, q: 0.7, t: o });
    tone({ f: 150, to: 45, type: 'sawtooth', d: 0.28 * b, v: 0.22, lp: 700, t: o });
    for (let i = 0; i < 4; i += 1) noise({ d: 0.035, v: 0.22, type: 'highpass', f: 4500, t: o + 0.05 + i * 0.055 });
  },
  // air: gelembung naik + cipratan
  air(o, b) {
    for (let i = 0; i < 3; i += 1) tone({ f: 500 + i * 180, to: 900 + i * 260, type: 'sine', d: 0.12, v: 0.18, t: o + i * 0.06 });
    noise({ d: 0.26 * b, v: 0.2, type: 'bandpass', f: 1800, to: 600, q: 2, t: o + 0.08 });
  },
  // tanah: gedebuk rendah + gemuruh + kerikil
  tanah(o, b) {
    tone({ f: 95, to: 38, type: 'sine', d: 0.38 * b, v: 0.55, t: o });
    noise({ d: 0.32 * b, v: 0.3, type: 'lowpass', f: 500, to: 120, t: o });
    noise({ d: 0.05, v: 0.3, type: 'highpass', f: 1500, t: o + 0.02 });
    noise({ d: 0.04, v: 0.18, type: 'highpass', f: 2500, t: o + 0.12 });
  },
  // angin: desir panjang menyapu
  angin(o, b) {
    noise({ d: 0.42 * b, v: 0.3, type: 'bandpass', f: 3200, to: 500, q: 3, t: o });
    noise({ d: 0.3 * b, v: 0.18, type: 'bandpass', f: 1200, to: 3600, q: 2, t: o + 0.1 });
  },
  // petir: retak tajam + zap turun + gemuruh jauh
  petir(o, b) {
    noise({ d: 0.05, v: 0.45, type: 'highpass', f: 2500, t: o });
    tone({ f: 2400, to: 90, type: 'square', d: 0.22 * b, v: 0.15, t: o });
    for (let i = 0; i < 3; i += 1) noise({ d: 0.03, v: 0.3, type: 'highpass', f: 5000, t: o + 0.08 + i * 0.05 });
    tone({ f: 60, to: 40, type: 'sine', d: 0.35 * b, v: 0.32, t: o + 0.06 });
  },
  // alam: petikan kayu + gemerisik daun
  alam(o, b) {
    tone({ f: 330, to: 300, type: 'triangle', d: 0.16, v: 0.3, t: o });
    tone({ f: 495, type: 'triangle', d: 0.18, v: 0.22, t: o + 0.07 });
    tone({ f: 660, type: 'triangle', d: 0.16, v: 0.15, t: o + 0.13 });
    noise({ d: 0.26 * b, v: 0.12, type: 'highpass', f: 5000, t: o + 0.02 });
  },
  // cahaya: denting lonceng berkilau
  cahaya(o, b) {
    [1318, 1760, 2637].forEach((f, i) => tone({ f, type: 'sine', d: 0.5 * b, v: 0.14, t: o + i * 0.06 }));
    tone({ f: 880, type: 'triangle', d: 0.3, v: 0.12, t: o });
    noise({ d: 0.2, v: 0.06, type: 'highpass', f: 7000, t: o + 0.05 });
  },
  // gelap: dengung turun, sedikit sumbang
  gelap(o, b) {
    tone({ f: 220, to: 55, type: 'sawtooth', d: 0.5 * b, v: 0.2, lp: 500, t: o });
    tone({ f: 233, to: 58, type: 'sawtooth', d: 0.5 * b, v: 0.16, lp: 500, t: o });
    noise({ d: 0.4 * b, v: 0.18, type: 'lowpass', f: 900, to: 100, t: o });
    tone({ f: 70, type: 'sine', d: 0.45, v: 0.3, t: o + 0.05 });
  },
  // netral: pukulan polos
  netral(o) {
    tone({ f: 240, to: 90, type: 'square', d: 0.15, v: 0.18, lp: 1500, t: o });
    noise({ d: 0.08, v: 0.25, type: 'highpass', f: 2000, t: o });
  },
};
const CHARGE_BASE = { api: 200, air: 300, tanah: 90, angin: 400, petir: 600, alam: 260, cahaya: 700, gelap: 110, netral: 220 };
const voice = (el) => VOICE[el] || VOICE.netral;

/* ---------- penanda tingkat kartu (C < R < E < L) ---------- */
const STINGER = {
  C() {
    tone({ f: 660, type: 'sine', d: 0.18, v: 0.12 });
  },
  R() {
    [660, 880].forEach((f, i) => tone({ f, type: 'triangle', d: 0.22, v: 0.14, t: i * 0.09 }));
  },
  E() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ f, type: 'triangle', d: 0.3, v: 0.14, t: i * 0.08 }));
    noise({ d: 0.3, v: 0.05, type: 'highpass', f: 7000, t: 0.2 });
  },
  L() {
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, type: 'sawtooth', d: 0.6, v: 0.07, t: i * 0.07, lp: 3000 }));
    [261, 392, 523].forEach((f) => tone({ f, type: 'sine', d: 1.1, v: 0.14, t: 0.3 }));
    noise({ d: 0.9, v: 0.1, type: 'bandpass', f: 5000, to: 9000, q: 1, t: 0.25 });
    tone({ f: 80, to: 40, type: 'sine', d: 0.6, v: 0.35 });
  },
};
const stinger = (r, t = 0) => {
  const fn = STINGER[r] || STINGER.C;
  if (!t) { fn(); return; }
  setTimeout(fn, t * 1000);
};

/* ---------- API publik ---------- */
export const sfxx = {
  // serangan biasa, bunyi sesuai elemen monster
  attack(el) {
    if (!enabled()) return;
    voice(el)(0, 1);
  },
  // skill: suara mengisi tenaga naik, lalu ledakan elemen
  skill(el) {
    if (!enabled()) return;
    const base = CHARGE_BASE[el] || 220;
    tone({ f: base, to: base * 3, type: 'triangle', d: 0.32, v: 0.12 });
    noise({ d: 0.3, v: 0.08, type: 'bandpass', f: base * 2, to: base * 8, q: 2 });
    voice(el)(0.3, 1.6);
  },
  // monster dipanggil: nada elemen + penanda tingkat kartu
  summon(el, rarity) {
    if (!enabled()) return;
    voice(el)(0, 0.8);
    stinger(rarity, 0.12);
  },
  // sihir / jebakan / medan dimainkan
  cast(el, rarity) {
    if (!enabled()) return;
    tone({ f: 400, to: 1000, type: 'sine', d: 0.2, v: 0.1 });
    voice(el)(0.1, 0.9);
    stinger(rarity, 0.2);
  },
  // bertahan: blok serangan / perisai aktif (denting logam)
  defend() {
    if (!enabled()) return;
    tone({ f: 120, to: 70, type: 'sine', d: 0.2, v: 0.4 });
    tone({ f: 880, type: 'square', d: 0.15, v: 0.1, lp: 3000 });
    tone({ f: 1318, type: 'sine', d: 0.45, v: 0.14 });
    tone({ f: 2093, type: 'sine', d: 0.3, v: 0.08, t: 0.01 });
    noise({ d: 0.04, v: 0.3, type: 'highpass', f: 3000 });
  },
  // tukar posisi: bertahan = dentum perisai, menyerang = desing pedang
  toggle(pos) {
    if (!enabled()) return;
    if (pos === 'def') {
      tone({ f: 150, to: 80, type: 'sine', d: 0.18, v: 0.4 });
      tone({ f: 740, type: 'square', d: 0.1, v: 0.08, lp: 2500 });
      noise({ d: 0.05, v: 0.2, type: 'highpass', f: 2500 });
    } else {
      noise({ d: 0.22, v: 0.28, type: 'bandpass', f: 800, to: 3500, q: 2 });
      tone({ f: 1568, type: 'sine', d: 0.3, v: 0.1, t: 0.12 });
      tone({ f: 2349, type: 'sine', d: 0.22, v: 0.06, t: 0.12 });
    }
  },
  // ambil kartu hadiah (acak): kartu dibalik + penanda tingkat kartu yang didapat
  prize(rarity) {
    if (!enabled()) return;
    noise({ d: 0.08, v: 0.25, type: 'bandpass', f: 2500, q: 1 });
    noise({ d: 0.07, v: 0.2, type: 'bandpass', f: 3200, q: 1, t: 0.07 });
    stinger(rarity, 0.16);
  },
};