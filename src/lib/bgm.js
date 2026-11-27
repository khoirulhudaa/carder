/* ------------------------------------------------------------------ */
/*  Musik latar prosedural (Web Audio API), tanpa file audio.          */
/*                                                                    */
/*  Tiga lagu:                                                        */
/*    menu   : tenang, hangat (lobi, deck, koleksi, toko, dll.)        */
/*    tense  : tegang, berdrum (layar Duel)                            */
/*    summon : mistis, makin memuncak (animasi Gacha & Fusi)           */
/*                                                                    */
/*  Pemakaian:                                                        */
/*    bgm.setBase('menu' | 'tense')  -> lagu dasar sesuai layar        */
/*    bgm.setOverlay('summon' | null) -> lagu sementara di atas dasar  */
/*    bgm.setMuted(true | false)     -> ikut tombol suara              */
/*                                                                    */
/*  Browser memblokir suara sebelum ada interaksi, jadi musik mulai   */
/*  setelah klik / tekan tombol / sentuh pertama.                      */
/* ------------------------------------------------------------------ */
const MASTER = 0.5;
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

let ctx = null;
let master = null;
let fxIn = null;
let noiseBuf = null;
let base = 'menu';
let overlay = null;
let muted = false;
let unlocked = false;
let current = null;
let pending = false;

function ensureCtx() {
  if (ctx) return true;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return false;
  ctx = new AC();

  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp);
  comp.connect(ctx.destination);

  // gema (delay berumpan balik) untuk nuansa ruang
  fxIn = ctx.createGain();
  const dly = ctx.createDelay(1);
  dly.delayTime.value = 0.36;
  const fb = ctx.createGain();
  fb.gain.value = 0.4;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  fxIn.connect(dly);
  dly.connect(lp);
  lp.connect(fb);
  fb.connect(dly);
  lp.connect(master);

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  return true;
}

/* ---------- instrumen dasar ---------- */
function tone(out, freq, t, dur, o = {}) {
  const { type = 'sine', gain = 0.1, attack = 0.01, sustain = 0, cutoff = 0, send = 0, pan = 0, detune = 0 } = o;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  if (sustain) g.gain.setValueAtTime(gain, t + dur * sustain);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  let node = osc;
  if (cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    node.connect(f);
    node = f;
  }
  node.connect(g);

  let tail = g;
  if (pan && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    tail = p;
  }
  tail.connect(out);
  if (send) {
    const s = ctx.createGain();
    s.gain.value = send;
    tail.connect(s);
    s.connect(fxIn);
  }
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(out, t, dur, o = {}) {
  const { type = 'highpass', f = 6000, to = 0, gain = 0.05, q = 1, swell = false } = o;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const fl = ctx.createBiquadFilter();
  fl.type = type;
  fl.Q.value = q;
  fl.frequency.setValueAtTime(f, t);
  if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  if (swell) {
    g.gain.linearRampToValueAtTime(gain, t + dur * 0.95);
    g.gain.setValueAtTime(0.0001, t + dur);
  } else {
    g.gain.linearRampToValueAtTime(gain, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  src.connect(fl);
  fl.connect(g);
  g.connect(out);
  src.start(t);
  src.stop(t + dur + 0.05);
}

function drum(out, t, o = {}) {
  const { f0 = 150, f1 = 45, dur = 0.2, gain = 0.5 } = o;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/* ---------- lagu: MENU (tenang) ---------- */
const MENU = [
  { root: 36, pad: [60, 64, 67, 71], mel: { 4: 76, 10: 79 } },
  { root: 33, pad: [57, 60, 64, 67], mel: { 6: 72, 12: 76 } },
  { root: 41, pad: [57, 60, 65, 69], mel: { 4: 77, 8: 81, 12: 79 } },
  { root: 43, pad: [59, 62, 67, 71], mel: { 2: 74, 8: 79, 14: 71 } },
];
const ARP = [0, 2, 1, 3, 2, 3, 1, 2];

const menuTrack = {
  bpm: 84,
  steps: 64,
  play(s, t, sd, out) {
    const bar = Math.floor(s / 16);
    const k = s % 16;
    const c = MENU[bar];
    if (k === 0) {
      c.pad.forEach((m, i) => tone(out, mtof(m), t, sd * 16, { type: 'triangle', gain: 0.032, attack: 1.0, sustain: 0.75, cutoff: 1500, send: 0.5, detune: i * 3 - 3 }));
      tone(out, mtof(c.root), t, sd * 7, { gain: 0.2, attack: 0.03 });
    }
    if (k === 8) tone(out, mtof(c.root), t, sd * 7, { gain: 0.16, attack: 0.03 });
    if (k % 2 === 0) {
      const idx = ARP[(k / 2) % 8];
      tone(out, mtof(c.pad[idx] + 12), t, sd * 4, { gain: k % 8 === 0 ? 0.06 : 0.04, attack: 0.005, send: 0.6, pan: (k / 2) % 2 ? 0.3 : -0.3 });
    }
    if (c.mel[k]) tone(out, mtof(c.mel[k]), t, sd * 6, { gain: 0.05, attack: 0.01, send: 0.8 });
  },
};

/* ---------- lagu: TENSE (duel, tegang) ---------- */
const TENSE = [
  { root: 33, ch: [57, 60, 64] },
  { root: 29, ch: [57, 60, 65] },
  { root: 38, ch: [57, 62, 65] },
  { root: 40, ch: [56, 59, 64] },
];
const BASS = [0, 3, 6, 8, 11, 14];

const tenseTrack = {
  bpm: 132,
  steps: 64,
  play(s, t, sd, out) {
    const bar = Math.floor(s / 16);
    const k = s % 16;
    const c = TENSE[bar];
    if (k % 4 === 0) drum(out, t, { f0: 160, f1: 42, dur: 0.22, gain: 0.55 });
    if (k === 14 && bar % 2 === 1) drum(out, t, { f0: 150, f1: 42, dur: 0.18, gain: 0.35 });
    if (k === 4 || k === 12) {
      noise(out, t, 0.16, { type: 'bandpass', f: 1900, gain: 0.12, q: 0.8 });
      drum(out, t, { f0: 230, f1: 130, dur: 0.12, gain: 0.18 });
    }
    noise(out, t, 0.04, { type: 'highpass', f: 7000, gain: k % 2 === 0 ? 0.05 : 0.028 });
    if (BASS.includes(k)) tone(out, mtof(c.root + (k === 14 ? 12 : 0)), t, sd * 1.7, { type: 'sawtooth', gain: 0.14, attack: 0.004, cutoff: 520 });
    if (k === 0) c.ch.forEach((m) => tone(out, mtof(m), t, sd * 16, { type: 'sawtooth', gain: 0.022, attack: 0.4, sustain: 0.8, cutoff: 850, send: 0.3 }));
    if (k === 3 || k === 7 || k === 11 || k === 13) c.ch.forEach((m) => tone(out, mtof(m + 12), t, sd * 1.2, { type: 'square', gain: 0.018, attack: 0.004, cutoff: 1800, send: 0.25 }));
    if (bar === 3 && k === 8) noise(out, t, sd * 8, { type: 'bandpass', f: 300, to: 5200, gain: 0.1, q: 2, swell: true });
  },
};

/* ---------- lagu: SUMMON (gacha & fusi, makin memuncak) ---------- */
const SUMMON = [
  { root: 38, pad: [62, 65, 69, 74] },
  { root: 34, pad: [62, 65, 70, 74] },
  { root: 31, pad: [62, 67, 70, 74] },
  { root: 33, pad: [61, 64, 69, 73] },
];

const summonTrack = {
  bpm: 104,
  steps: 64,
  play(s, t, sd, out) {
    const bar = Math.floor(s / 16);
    const k = s % 16;
    const c = SUMMON[bar];
    if (k === 0) {
      c.pad.forEach((m, i) => tone(out, mtof(m), t, sd * 16, { type: 'sawtooth', gain: 0.024, attack: 1.2, sustain: 0.8, cutoff: 1100, send: 0.5, detune: i * 4 - 6 }));
      tone(out, mtof(c.root), t, sd * 16, { gain: 0.2, attack: 0.05, sustain: 0.85 });
      tone(out, mtof(c.pad[0] + 12), t, sd * 16, { gain: 0.025, attack: 1.5, sustain: 0.8, send: 0.7 });
    }
    const hit = bar < 2 ? (k === 0 || k === 8) : bar === 2 ? k % 4 === 0 : k % 2 === 0;
    if (hit) drum(out, t, { f0: 130 + bar * 8, f1: 55, dur: 0.3, gain: 0.2 + bar * 0.05 });
    const idx = k % 8;
    tone(out, mtof(c.pad[idx % 4] + 12 * (1 + Math.floor(idx / 4))), t, sd * 2.2, { gain: 0.03, attack: 0.004, send: 0.7, pan: Math.sin(k * 0.9) * 0.7 });
    if (bar === 3 && k === 0) noise(out, t, sd * 16, { type: 'bandpass', f: 260, to: 6500, gain: 0.09, q: 2, swell: true });
  },
};

const TRACKS = { menu: menuTrack, tense: tenseTrack, summon: summonTrack };

/* ---------- pemutar ---------- */
function startTrack(name) {
  const def = TRACKS[name] || menuTrack;
  const bus = ctx.createGain();
  const now = ctx.currentTime;
  bus.gain.setValueAtTime(0.0001, now);
  bus.gain.linearRampToValueAtTime(1, now + 1.6);
  bus.connect(master);

  const sd = 60 / def.bpm / 4;
  let step = 0;
  let next = now + 0.08;
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 0.3) {
      def.play(step % def.steps, next, sd, bus);
      next += sd;
      step += 1;
    }
  }, 90);

  return {
    name,
    stop(fade = 1.2) {
      clearInterval(timer);
      const n = ctx.currentTime;
      bus.gain.cancelScheduledValues(n);
      bus.gain.setValueAtTime(bus.gain.value, n);
      bus.gain.linearRampToValueAtTime(0.0001, n + fade);
      setTimeout(() => bus.disconnect(), (fade + 0.5) * 1000);
    },
  };
}

function apply() {
  pending = false;
  if (!unlocked || !ensureCtx()) return;
  const want = overlay || base;
  if (current && current.name === want) return;
  if (current) current.stop(want === 'summon' || current.name === 'summon' ? 0.8 : 1.4);
  current = startTrack(want);
}

// beberapa pemanggilan beruntun dalam satu tick digabung jadi satu
function queue() {
  if (pending) return;
  pending = true;
  setTimeout(apply, 0);
}

export const bgm = {
  setBase(name) { base = name; queue(); },
  setOverlay(name) { overlay = name || null; queue(); },
  setMuted(m) {
    muted = !!m;
    if (!master) return;
    const n = ctx.currentTime;
    master.gain.cancelScheduledValues(n);
    master.gain.setValueAtTime(master.gain.value, n);
    master.gain.linearRampToValueAtTime(muted ? 0 : MASTER, n + 0.25);
  },
};

/* buka kunci audio pada interaksi pertama; jeda saat tab disembunyikan */
if (typeof window !== 'undefined') {
  const events = ['pointerdown', 'keydown', 'touchstart'];
  const unlock = () => {
    unlocked = true;
    if (ensureCtx() && ctx.state === 'suspended') ctx.resume();
    queue();
    events.forEach((e) => window.removeEventListener(e, unlock));
  };
  events.forEach((e) => window.addEventListener(e, unlock));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });
}