/* ------------------------------------------------------------------ */
/*  vfx.js — animasi duel (tanpa CSS tambahan, memakai Web Animations) */
/*  Taruh di: src/lib/vfx.js                                           */
/*                                                                    */
/*  Cara kerja: tiap event dari engine (attack, skill, dmg, heal,      */
/*  summon, destroy, ...) diterjemahkan jadi animasi. Elemen kartu     */
/*  sumber (api/air/tanah/angin/petir/alam/cahaya/gelap/netral)        */
/*  menentukan gaya proyektil & efek benturan, jadi SEMUA kartu        */
/*  otomatis punya animasi sendiri tanpa perlu diatur satu per satu.   */
/* ------------------------------------------------------------------ */
import { CARDS } from '../data/cards.js';

const PAL = {
  api: { c: '#ff6a00', c2: '#ffd23f' },
  air: { c: '#38bdf8', c2: '#e0f7ff' },
  tanah: { c: '#b45309', c2: '#e7d3a0' },
  angin: { c: '#5eead4', c2: '#ecfeff' },
  petir: { c: '#facc15', c2: '#ffffff' },
  alam: { c: '#22c55e', c2: '#d9f99d' },
  cahaya: { c: '#fde68a', c2: '#ffffff' },
  gelap: { c: '#7c3aed', c2: '#f0abfc' },
  netral: { c: '#cbd5e1', c2: '#ffffff' },
};
const pal = (el) => PAL[el] || PAL.netral;
const rnd = (a, b) => a + Math.random() * (b - a);
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const tr = (x, y, s = 1, r = 0) => `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${r}deg) scale(${s})`;

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- dasar ---------- */
let layer = null;
function getLayer() {
  if (layer && layer.isConnected) return layer;
  layer = document.createElement('div');
  Object.assign(layer.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '45', overflow: 'hidden' });
  document.body.appendChild(layer);
  return layer;
}
function mk(css) {
  const d = document.createElement('div');
  Object.assign(d.style, { position: 'absolute', left: '0', top: '0', willChange: 'transform,opacity', ...css });
  getLayer().appendChild(d);
  return d;
}
function anim(el, frames, opts) {
  const a = el.animate(frames, { fill: 'both', ...opts });
  a.onfinish = () => el.remove();
  a.oncancel = () => el.remove();
  return a;
}
function center(key) {
  const node = document.querySelector(`[data-fx="${key}"]`);
  if (!node) return { x: innerWidth / 2, y: innerHeight / 2, w: 100, h: 100 };
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

/* ---------- primitif ---------- */
function burst(p, { colors, count = 12, dist = 60, size = 6, dur = 650, gravity = 0, shape = '50%', spread = 360, angle = 0, delay = 0 }) {
  for (let i = 0; i < count; i += 1) {
    const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const d = dist * rnd(0.5, 1.1);
    const col = colors[i % colors.length];
    const s = size * rnd(0.6, 1.3);
    const el = mk({ width: `${s}px`, height: `${s}px`, borderRadius: shape, background: col, boxShadow: `0 0 ${s * 1.5}px ${col}` });
    anim(
      el,
      [
        { transform: tr(p.x, p.y, 1, 0), opacity: 1 },
        { transform: tr(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d + gravity, 0.1, rnd(-180, 180)), opacity: 0 },
      ],
      { duration: dur * rnd(0.7, 1.1), delay, easing: EASE },
    );
  }
}
function implode(p, { colors, count = 12, dist = 70, size = 5, dur = 500, delay = 0 }) {
  for (let i = 0; i < count; i += 1) {
    const a = rnd(0, Math.PI * 2);
    const col = colors[i % colors.length];
    const el = mk({ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: col, boxShadow: `0 0 8px ${col}` });
    anim(
      el,
      [
        { transform: tr(p.x + Math.cos(a) * dist, p.y + Math.sin(a) * dist, 1), opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { transform: tr(p.x, p.y, 0.3), opacity: 0 },
      ],
      { duration: dur, delay: delay + rnd(0, 120), easing: 'ease-in' },
    );
  }
}
function ring(p, col, { size = 60, dur = 500, width = 3, delay = 0, from = 0.2, to = 1.6 } = {}) {
  const el = mk({ width: `${size}px`, height: `${size}px`, borderRadius: '50%', border: `${width}px solid ${col}`, boxShadow: `0 0 12px ${col}, inset 0 0 12px ${col}` });
  anim(el, [{ transform: tr(p.x, p.y, from), opacity: 0.95 }, { transform: tr(p.x, p.y, to), opacity: 0 }], { duration: dur, delay, easing: EASE });
}
function glow(p, col, { size = 90, dur = 350, delay = 0 } = {}) {
  const el = mk({ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: `radial-gradient(circle, ${col} 0%, ${col}66 40%, transparent 70%)` });
  anim(el, [{ transform: tr(p.x, p.y, 0.3), opacity: 0.95 }, { transform: tr(p.x, p.y, 1.4), opacity: 0 }], { duration: dur, delay, easing: 'ease-out' });
}
function slash(p, col, { len = 100, angle = -35, dur = 280, delay = 0 } = {}) {
  const el = mk({ width: `${len}px`, height: '5px', borderRadius: '5px', background: `linear-gradient(90deg, transparent, #fff, ${col}, transparent)`, boxShadow: `0 0 12px ${col}` });
  const base = `translate(${p.x}px,${p.y}px) translate(-50%,-50%) rotate(${angle}deg)`;
  anim(el, [{ transform: `${base} scaleX(0)`, opacity: 1 }, { transform: `${base} scaleX(1)`, opacity: 1, offset: 0.4 }, { transform: `${base} scaleX(1.1)`, opacity: 0 }], { duration: dur, delay, easing: EASE });
}
function text(p, str, { size = 20, col = '#fff', dur = 800, delay = 0, rise = 60, dx = 0 } = {}) {
  const el = mk({ fontSize: `${size}px`, fontWeight: '800', color: col, textShadow: `0 0 8px ${col}`, lineHeight: '1' });
  el.textContent = str;
  anim(
    el,
    [
      { transform: tr(p.x + dx, p.y, 0.6), opacity: 0 },
      { transform: tr(p.x + dx, p.y - rise * 0.4, 1.1), opacity: 1, offset: 0.25 },
      { transform: tr(p.x + dx, p.y - rise, 0.9), opacity: 0 },
    ],
    { duration: dur, delay, easing: 'ease-out' },
  );
}
function screenFlash(col, { dur = 450, alpha = '55' } = {}) {
  const el = mk({ width: '100vw', height: '100vh', background: `radial-gradient(circle at 50% 50%, ${col}${alpha}, transparent 70%)` });
  anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], { duration: dur });
}
function vignette(col, dur = 450) {
  const el = mk({ width: '100vw', height: '100vh', boxShadow: `inset 0 0 140px ${col}` });
  anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: dur });
}
function shake(amp = 6) {
  const t = document.querySelector('.duel-main');
  if (!t) return;
  const f = [{ transform: 'translate(0,0)' }];
  for (let i = 0; i < 6; i += 1) f.push({ transform: `translate(${rnd(-amp, amp)}px,${rnd(-amp, amp)}px)` });
  f.push({ transform: 'translate(0,0)' });
  t.animate(f, { duration: 320, easing: 'ease-out' });
}
function bolt(from, to, c, c2) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  Object.assign(svg.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', overflow: 'visible' });
  const pts = [];
  const n = 7;
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const j = i === 0 || i === n ? 0 : 22;
    pts.push(`${from.x + (to.x - from.x) * t + rnd(-j, j)},${from.y + (to.y - from.y) * t + rnd(-j, j)}`);
  }
  [[c, 9, 0.5], [c2, 3, 1]].forEach(([col, w, o]) => {
    const pl = document.createElementNS(NS, 'polyline');
    pl.setAttribute('points', pts.join(' '));
    pl.setAttribute('fill', 'none');
    pl.setAttribute('stroke', col);
    pl.setAttribute('stroke-width', w);
    pl.setAttribute('stroke-linecap', 'round');
    pl.setAttribute('stroke-linejoin', 'round');
    pl.setAttribute('opacity', o);
    pl.style.filter = `drop-shadow(0 0 6px ${c})`;
    svg.appendChild(pl);
  });
  getLayer().appendChild(svg);
  anim(svg, [{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }, { opacity: 0 }], { duration: 300 });
}

/* ---------- proyektil per elemen ---------- */
function projectile(from, to, el, dur, done) {
  const { c, c2 } = pal(el);
  if (el === 'petir') {
    bolt(from, to, c, c2);
    setTimeout(done, 130);
    return;
  }
  const ang = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const orb = (inner) => ({ width: '26px', height: '26px', borderRadius: '50%', background: `radial-gradient(circle, ${inner} 0%, ${c2} 30%, ${c} 60%, transparent 72%)`, boxShadow: `0 0 18px ${c}` });
  const styles = {
    api: orb('#fff'),
    gelap: { ...orb('#000'), background: `radial-gradient(circle, #000 0%, ${c} 55%, transparent 72%)` },
    tanah: { width: '22px', height: '22px', borderRadius: '4px', background: `linear-gradient(135deg, ${c2}, ${c})`, boxShadow: '0 2px 6px #0008' },
    angin: { width: '46px', height: '14px', borderRadius: '50%', borderTop: `4px solid ${c2}`, boxShadow: `0 -3px 10px ${c}` },
    alam: { width: '20px', height: '20px', borderRadius: '0 100% 0 100%', background: `linear-gradient(135deg, ${c2}, ${c})` },
    cahaya: { width: '64px', height: '8px', borderRadius: '8px', background: `linear-gradient(90deg, transparent, ${c2}, #fff)`, boxShadow: `0 0 14px ${c}` },
    air: { width: '20px', height: '26px', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: `radial-gradient(circle at 35% 30%, #fff, ${c2} 30%, ${c})`, boxShadow: `0 0 12px ${c}` },
  };
  const node = mk(styles[el] || orb('#fff'));
  const spin = el === 'tanah' || el === 'alam' ? 360 : 0;
  anim(node, [{ transform: tr(from.x, from.y, 0.6, ang), opacity: 1 }, { transform: tr(to.x, to.y, 1.1, ang + spin), opacity: 1 }], { duration: dur, easing: 'cubic-bezier(.45,0,.9,.6)' });
  for (let i = 1; i <= 6; i += 1) {
    const t = i / 7;
    setTimeout(() => {
      const d = mk({ width: '9px', height: '9px', borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` });
      anim(d, [{ transform: tr(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, 1), opacity: 0.8 }, { transform: tr(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, 0), opacity: 0 }], { duration: 320 });
    }, dur * t);
  }
  setTimeout(done, dur);
}

/* ---------- benturan per elemen ---------- */
const IMPACT = {
  api: (c, c2) => ({ shape: '50%', gravity: -35, count: 16, size: 7, colors: [c, c2, '#ff3d00'] }),
  air: (c, c2) => ({ shape: '50%', gravity: 40, count: 14, size: 6, colors: [c, c2, '#bae6fd'] }),
  tanah: (c, c2) => ({ shape: '2px', gravity: 55, count: 12, size: 9, colors: [c, c2, '#78350f'] }),
  angin: (c, c2) => ({ shape: '50%', gravity: 0, count: 10, size: 4, colors: [c, c2, '#fff'] }),
  petir: (c, c2) => ({ shape: '1px', gravity: 0, count: 14, size: 4, dist: 85, colors: [c, c2, '#fff'] }),
  alam: (c, c2) => ({ shape: '0 100% 0 100%', gravity: 25, count: 12, size: 9, colors: [c, c2, '#4ade80'] }),
  cahaya: (c, c2) => ({ shape: '50%', gravity: -20, count: 12, size: 5, colors: [c, c2, '#fff'] }),
  gelap: (c) => ({ shape: '50%', gravity: 0, count: 14, size: 6, colors: [c, '#a21caf', '#000'] }),
  netral: (c, c2) => ({ shape: '50%', gravity: 0, count: 10, size: 5, colors: [c, c2] }),
};
function impact(p, el, { big = false, melee = false } = {}) {
  const { c, c2 } = pal(el);
  const k = big ? 1.5 : 1;
  const cfg = (IMPACT[el] || IMPACT.netral)(c, c2);
  glow(p, c2, { size: 90 * k });
  ring(p, c, { size: 50 * k, to: 2 * k });
  burst(p, { dist: 60 * k, ...cfg });
  if (el === 'angin' || melee) slash(p, c2, { len: 110 * k });
  if (el === 'angin') slash(p, c, { len: 90 * k, angle: 40, delay: 80 });
  if (el === 'tanah') ring(p, c2, { size: 80 * k, to: 2.4 * k, dur: 600 });
  if (el === 'gelap') ring(p, c, { size: 90 * k, from: 1.8, to: 0.2, dur: 350 });
  if (el === 'cahaya') for (let i = 0; i < 4; i += 1) slash(p, c2, { len: 80 * k, angle: i * 45, dur: 380 });
  if (el === 'petir') slash(p, '#fff', { len: 70 * k, angle: rnd(-60, 60), dur: 200 });
}

/* ---------- efek status ---------- */
function heal(key) {
  const r = center(key);
  const col = '#4ade80';
  glow(r, col, { size: r.w * 0.9, dur: 600 });
  ring(r, col, { size: r.w * 0.5, to: 1.6, dur: 600 });
  for (let i = 0; i < 7; i += 1) text({ x: r.x + rnd(-r.w / 3, r.w / 3), y: r.y + r.h / 4 }, '✚', { size: rnd(12, 20), col, rise: r.h * 0.7, delay: i * 70, dur: 900 });
}
function buff(key) {
  const r = center(key);
  const col = '#fde047';
  glow(r, col, { size: r.w * 0.9, dur: 600 });
  ring(r, col, { size: r.w * 0.5, to: 1.5, dur: 600 });
  for (let i = 0; i < 4; i += 1) text({ x: r.x + (i - 1.5) * (r.w / 5), y: r.y + r.h / 4 }, '▲', { size: 16, col, rise: r.h * 0.6, delay: i * 90, dur: 800 });
}
function shield(key, blocked) {
  const r = center(key);
  const s = Math.min(r.w, r.h) * 0.95;
  const col = '#93c5fd';
  const el = mk({ width: `${s}px`, height: `${s}px`, borderRadius: '50%', border: `3px solid ${col}`, background: 'radial-gradient(circle, rgba(147,197,253,.05), rgba(147,197,253,.3))', boxShadow: `0 0 18px ${col}, inset 0 0 18px ${col}88` });
  anim(el, [{ transform: tr(r.x, r.y, 0.5), opacity: 0 }, { transform: tr(r.x, r.y, 1), opacity: 1, offset: 0.3 }, { transform: tr(r.x, r.y, blocked ? 1.15 : 1), opacity: blocked ? 0.9 : 0.6, offset: 0.65 }, { transform: tr(r.x, r.y, blocked ? 1.4 : 1.05), opacity: 0 }], { duration: blocked ? 700 : 900, easing: 'ease-out' });
  if (blocked) {
    burst(r, { colors: ['#fff', col], count: 10, dist: s * 0.6, size: 5, dur: 450 });
    text({ x: r.x, y: r.y - r.h / 3 }, '🛡', { size: 24, rise: 30, dur: 700 });
  }
}
function stun(key) {
  const r = center(key);
  const col = '#7dd3fc';
  glow(r, col, { size: r.w, dur: 700 });
  ring(r, '#e0f7ff', { size: r.w * 0.6, to: 1.5, dur: 600 });
  for (let i = 0; i < 4; i += 1) {
    const a = i * 90;
    const rad = r.w * 0.38;
    const el = mk({ fontSize: '22px', lineHeight: '1', filter: `drop-shadow(0 0 6px ${col})` });
    el.textContent = '❄️';
    const f = (deg) => `translate(${r.x}px,${r.y}px) translate(-50%,-50%) rotate(${deg}deg) translateX(${rad}px) rotate(${-deg}deg)`;
    anim(el, [{ transform: f(a), opacity: 0 }, { transform: f(a + 100), opacity: 1, offset: 0.2 }, { transform: f(a + 270), opacity: 0 }], { duration: 1000, easing: 'ease-in-out' });
  }
}
function burn(key) {
  const r = center(key);
  glow(r, '#fb923c', { size: r.w, dur: 700 });
  for (let i = 0; i < 6; i += 1) text({ x: r.x + rnd(-r.w / 3, r.w / 3), y: r.y + r.h / 4 }, '🔥', { size: rnd(16, 26), rise: r.h * 0.8, delay: i * 80, dur: 800 });
}
function summon(key, el) {
  const r = center(key);
  const { c, c2 } = pal(el);
  const pillar = mk({ width: `${r.w * 0.5}px`, height: `${r.h * 2.4}px`, background: `linear-gradient(to top, transparent, ${c} 35%, ${c2} 60%, transparent)`, filter: 'blur(2px)', transformOrigin: '50% 70%' });
  const b = `translate(${r.x}px,${r.y}px) translate(-50%,-60%)`;
  anim(pillar, [{ transform: `${b} scaleY(0)`, opacity: 0 }, { transform: `${b} scaleY(1)`, opacity: 1, offset: 0.35 }, { transform: `${b} scaleY(0.2) scaleX(1.6)`, opacity: 0 }], { duration: 650, easing: 'ease-out' });
  ring(r, c, { size: r.w * 0.6, to: 1.8, dur: 600 });
  ring(r, c2, { size: r.w * 0.4, to: 1.5, dur: 500, delay: 120 });
  glow(r, c2, { size: r.w, dur: 600 });
  burst(r, { colors: [c, c2, '#fff'], count: 16, dist: 90, size: 5, dur: 800, gravity: -30, angle: -90, spread: 140 });
}
function destroy(key, el) {
  const r = center(key);
  const { c } = pal(el || 'netral');
  glow(r, '#f87171', { size: r.w, dur: 450 });
  ring(r, '#f87171', { size: r.w * 0.6, to: 1.8, dur: 500 });
  burst(r, { colors: [c, '#94a3b8', '#f87171', '#fff'], count: 18, dist: r.w * 0.7, size: 11, dur: 800, gravity: 80, shape: '2px' });
  slash(r, '#f87171', { len: r.w, angle: 45 });
  slash(r, '#f87171', { len: r.w, angle: -45, delay: 60 });
  shake(6);
}
function bounce(key) {
  const r = center(key);
  const col = '#a5f3fc';
  ring(r, col, { size: r.w * 0.6, to: 1.6, dur: 600 });
  const el = mk({ fontSize: '34px', lineHeight: '1', filter: `drop-shadow(0 0 8px ${col})` });
  el.textContent = '🌀';
  anim(el, [{ transform: tr(r.x, r.y, 0.6, 0), opacity: 0 }, { transform: tr(r.x, r.y - r.h * 0.2, 1.2, 270), opacity: 1, offset: 0.35 }, { transform: tr(r.x, r.y - r.h * 0.7, 1.4, 540), opacity: 0 }], { duration: 800, easing: 'ease-out' });
  burst(r, { colors: [col, '#fff'], count: 10, dist: 70, size: 5, dur: 700, gravity: -50, angle: -90, spread: 120 });
}
function trapFx(key) {
  const r = center(key);
  screenFlash('#818cf8', { dur: 500, alpha: '66' });
  ring(r, '#818cf8', { size: 90, to: 2.6, dur: 600 });
  text(r, '⛓', { size: 34, col: '#c7d2fe', rise: 40, dur: 800 });
  burst(r, { colors: ['#818cf8', '#c7d2fe', '#fff'], count: 14, dist: 80, size: 5 });
}
function lpHit(key, big) {
  const r = center(key);
  glow(r, '#f87171', { size: r.w * 0.8, dur: 450 });
  [[-35, 0], [-60, 70], [-10, 140]].forEach(([a, d]) => slash(r, '#f87171', { len: 80, angle: a, delay: d }));
  vignette('rgba(244,63,94,.55)', big ? 600 : 420);
  shake(big ? 10 : 5);
}
function skillCharge(key, el) {
  const r = center(key);
  const { c, c2 } = pal(el);
  ring(r, c, { size: r.w * 0.8, from: 2.4, to: 0.5, dur: 480 });
  ring(r, c2, { size: r.w * 0.8, from: 2.8, to: 0.5, dur: 480, delay: 120 });
  implode(r, { colors: [c, c2, '#fff'], count: 14, dist: r.w * 0.9 });
  glow(r, c, { size: r.w * 1.2, dur: 600, delay: 150 });
}
function lunge(fromKey, toKey) {
  const node = document.querySelector(`[data-fx="${fromKey}"]`);
  if (!node) return;
  const a = center(fromKey);
  let dx = 0;
  let dy = fromKey.startsWith('player') ? -70 : 70;
  if (toKey) {
    const b = center(toKey);
    dx = (b.x - a.x) * 0.65;
    dy = (b.y - a.y) * 0.65;
  }
  const prevZ = node.style.zIndex;
  node.style.zIndex = '40';
  const anim2 = node.animate(
    [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${-dx * 0.12}px,${-dy * 0.12}px) scale(1.04)`, offset: 0.25 },
      { transform: `translate(${dx}px,${dy}px) scale(1.15)`, offset: 0.5, easing: 'ease-in' },
      { transform: 'translate(0,0) scale(1)' },
    ],
    { duration: 480, easing: 'ease-out' },
  );
  anim2.onfinish = () => { node.style.zIndex = prevZ; };
  anim2.oncancel = () => { node.style.zIndex = prevZ; };
}

/* ------------------------------------------------------------------ */
/*  Runner: dipanggil untuk tiap event di processFx                   */
/*  Satu runner per daftar event (melacak "sumber" serangan/skill).    */
/* ------------------------------------------------------------------ */
export function makeFxRunner(getG, prevG) {
  let src = null; // { el, key, melee }
  const elOf = (side, slot) => {
    const m = getG()?.players[side]?.monsters[slot] || prevG?.players[side]?.monsters[slot];
    return (m && CARDS[m.id]?.element) || 'netral';
  };
  const keyOf = (e) => (e.slot != null ? `${e.side}:${e.slot}` : `${e.side}:lp`);

  return function run(e, i, list) {
    if (reduced() || typeof document === 'undefined') return;
    const key = keyOf(e);
    switch (e.type) {
      case 'attack': {
        const el = elOf(e.side, e.slot);
        src = { el, key, melee: true };
        const tgt = list.slice(i + 1).find((x) => ['dmg', 'lpdmg', 'shield'].includes(x.type) && x.side !== e.side);
        const tkey = tgt ? (tgt.type === 'lpdmg' || tgt.slot == null ? `${tgt.side}:lp` : `${tgt.side}:${tgt.slot}`) : null;
        lunge(key, tkey);
        break;
      }
      case 'skill': {
        const el = elOf(e.side, e.slot);
        src = { el, key, melee: false };
        skillCharge(key, el);
        break;
      }
      case 'cast': {
        const el = CARDS[e.id]?.element || 'netral';
        src = { el, key: `${e.side}:lp`, melee: false };
        if (!e.hidden) screenFlash(pal(el).c);
        break;
      }
      case 'summon': {
        const el = elOf(e.side, e.slot);
        src = { el, key, melee: false };
        summon(key, el);
        break;
      }
      case 'dmg':
      case 'lpdmg': {
        const tkey = e.type === 'lpdmg' ? `${e.side}:lp` : key;
        if (e.type === 'dmg' && !(e.value > 0)) { shield(tkey, true); break; }
        const el = src?.el || 'netral';
        const big = e.value >= 1500;
        const to = center(tkey);
        const land = () => {
          impact(to, el, { big, melee: src?.melee });
          if (e.mult > 1) ring(to, '#fb923c', { size: 80, to: 2.6, dur: 600 });
          else if (e.mult < 1) ring(to, '#94a3b8', { size: 60, to: 1.4, dur: 400 });
          if (e.type === 'lpdmg') lpHit(tkey, big);
          else if (big) shake(8);
        };
        if (src && !src.melee && src.key !== tkey) projectile(center(src.key), to, el, 300, land);
        else if (src?.melee) setTimeout(land, 90);
        else land();
        break;
      }
      case 'heal':
        heal(key);
        break;
      case 'lpheal':
        heal(`${e.side}:lp`);
        break;
      case 'buff':
        buff(key);
        break;
      case 'shield':
        shield(key, true);
        break;
      case 'shieldup':
        shield(key, false);
        break;
      case 'stun':
        stun(key);
        break;
      case 'burn':
        burn(key);
        break;
      case 'destroy':
        destroy(key, src?.el);
        break;
      case 'bounce':
        bounce(key);
        break;
      case 'trap':
        trapFx(`${e.side}:lp`);
        break;
      default:
        break;
    }
  };
}