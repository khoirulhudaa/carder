// AI lawan: mensimulasikan tiap aksi 1 langkah ke depan dan memilih yang skornya terbaik.
import { CARDS } from '../data/cards.js';
import { reduce, legalActions, statsOf, opp } from './engine.js';

const NOISE = { mudah: 380, normal: 120, sulit: 15 };

function boardValue(s, side) {
  const p = s.players[side];
  let v = 0;
  p.monsters.forEach((m, slot) => {
    if (!m) return;
    const st = statsOf(s, side, slot);
    v += st.atk + st.def * 0.35 + m.hp * 0.75;
    if (m.shield) v += 350;
    if (st.kw.includes('taunt')) v += 150;
    if (st.kw.includes('lifesteal')) v += 200;
    if (st.kw.includes('pierce')) v += 200;
    if (m.burn > 0) v -= 250;
    if (m.stun > 0 || m.frozen) v -= 300;
  });
  if (p.field) v += 350;
  v += p.traps.filter(Boolean).length * 550;
  return v;
}

export function evaluate(s, side) {
  if (s.winner) return s.winner === side ? 1e6 : -1e6;
  const me = s.players[side];
  const fo = s.players[opp(side)];
  return (
    (me.lp - fo.lp) * 0.85 +
    boardValue(s, side) -
    boardValue(s, opp(side)) +
    (me.hand.length - fo.hand.length) * 230
  );
}

export function chooseAction(s, side, difficulty = 'normal') {
  const END = { type: 'END_TURN', side };
  const acts = legalActions(s, side);
  const base = evaluate(s, side);
  const noise = NOISE[difficulty] ?? NOISE.normal;
  const lowLp = s.players[side].lp < 3000;
  let best = null;
  let bestScore = -Infinity;

  for (const a of acts) {
    if (a.type === 'END_TURN') continue;
    const ns = reduce(s, a, { sim: true });
    let sc = evaluate(ns, side) - base;
    sc += (s.players[side].mana - ns.players[side].mana) * 35;
    if (a.type === 'PLAY' && a.pos) {
      const d = CARDS[s.players[side].hand.find((c) => c.uid === a.uid).id];
      if (a.pos === 'def') sc += d.def > d.atk || lowLp ? 160 : -80;
    }
    sc += (Math.random() - 0.5) * noise;
    if (sc > bestScore) {
      bestScore = sc;
      best = a;
    }
  }
  if (!best || bestScore < 40) return END;
  if (difficulty === 'mudah' && Math.random() < 0.12) return END;
  return best;
}
