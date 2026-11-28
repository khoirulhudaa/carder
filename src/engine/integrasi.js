// Penghubung engine.js (state diubah langsung) dengan modul baru (fungsi murni).
// Letakkan di folder engine/, sejajar dengan engine.js.
import { CARDS } from '../data/cards.js';
import { registerCards, liveSlots } from './util.js';
import { hurt, applyElementHit } from './reactions.js';
import { resolveStrike } from './keywords.js';
import { canSwap, swapSlots, filterAttackTargets } from './lanes.js';
import { canEvolve, evolve } from './evolution.js';
import { gainCharge, canUltimate, useUltimate } from './charge.js';
import { resolveSpell } from './spell.js';

registerCards(CARDS);

export { filterAttackTargets };

/** Field tambahan untuk setiap monster baru. */
export const extraFields = (turn) => ({
  charge: 0, venom: 0, silence: 0, revived: false, ultUsed: false,
  marks: [], summonedTurn: turn,
});

export function createMechanics({ emit, destroyMonster, actorReady }) {
  /** Salin isi `next` ke objek lama tanpa mengganti referensinya. */
  function sync(p, next) {
    if (p === next) return;
    const arr = p.monsters;
    const old = arr.slice();
    next.monsters.forEach((m, i) => {
      const same = m && old.find((o) => o && o.uid === m.uid);
      arr[i] = same ? Object.assign(same, m) : m;
    });
    Object.assign(p, next, { monsters: arr });
  }

  /** Salin hasil modul ke state. Kematian dialihkan ke destroyMonster
   *  supaya kuburan, relik, dan onDeath tetap diproses. */
  function apply(s, res) {
    if (res.error) return false;
    const events = res.events || [];
    const dead = events.filter((e) => e.type === 'destroy');
    // monster yang mati dibiarkan di slotnya sampai destroyMonster memprosesnya
    const keep = dead.map((e) => ({ ...e, m: s.players[e.side].monsters[e.slot] }));
    ['player', 'enemy'].forEach((side) => sync(s.players[side], res.g.players[side]));
    keep.forEach(({ side, slot, m }) => { s.players[side].monsters[slot] = m; });
    events.filter((e) => e.type !== 'destroy').forEach((e) => emit(s, e));
    dead.forEach(({ side, slot }) => destroyMonster(s, side, slot));
    return true;
  }

  const react = (s, side, slot, element) => apply(s, applyElementHit(s, side, slot, element));

  const charge = (s, side, slot) => {
    if (s.players[side].monsters[slot]) apply(s, { g: gainCharge(s, side, slot) });
  };

  /** Serangan monster ke monster. Pengganti damageMonster di doAttack. */
  function strike(s, aSide, aSlot, dSide, dSlot, base, element, mult) {
    const target = s.players[dSide].monsters[dSlot];
    const hpBefore = target.hp;
    const attackerUid = s.players[aSide].monsters[aSlot].uid;
    const res = resolveStrike(s, aSide, aSlot, dSide, dSlot, base);
    const hit = res.events.find((e) => e.type === 'dmg' && e.side === dSide && e.slot === dSlot);
    if (hit) hit.mult = mult;
    const killed = res.events.some((e) => e.type === 'destroy' && e.side === dSide && e.slot === dSlot);
    apply(s, res);

    react(s, dSide, dSlot, element);
    charge(s, dSide, dSlot);
    if (s.players[aSide].monsters[aSlot]?.uid === attackerUid) charge(s, aSide, aSlot);

    return {
      dealt: res.dealt,
      killed,
      overflow: killed ? Math.max(0, base - hpBefore) : 0,
    };
  }

  /** Awal giliran: reset tukar posisi dan racun menggigit. */
  function onTurnStart(s, side) {
    s.players[side].swapped = false;
    liveSlots(s, side).forEach((slot) => {
      const m = s.players[side].monsters[slot];
      if (!m || !(m.venom > 0)) return;
      const events = [];
      const g = hurt(s, side, slot, m.venom * 10, events);
      apply(s, { g, events });
    });
  }

  /** Bungkam dikurangi di AKHIR giliran pemiliknya. */
  function onTurnEnd(s, side) {
    s.players[side].monsters.forEach((m) => {
      if (m && m.silence > 0) m.silence -= 1;
    });
  }

  /** Sihir berformat baru (punya `effect`). */
  function spell(s, side, cardId, target) {
    const res = resolveSpell(s, side, cardId, target, CARDS);
    // 'cast' sudah dikirim engine
    apply(s, { ...res, events: res.events.filter((e) => e.type !== 'cast') });
  }

  function checkUltimate(s, side, slot) {
    if (!actorReady(s, side, slot)) return { ok: false, reason: 'Monster belum bisa beraksi' };
    return canUltimate(s, side, slot);
  }

  /** Aksi SWAP {a,b}, EVOLVE {slot,uid}, ULTIMATE {slot}. */
  function doExtra(s, a) {
    if (a.type === 'SWAP') apply(s, swapSlots(s, a.side, a.a, a.b));
    else if (a.type === 'EVOLVE') apply(s, evolve(s, a.side, a.slot, a.uid));
    else if (a.type === 'ULTIMATE' && checkUltimate(s, a.side, a.slot).ok) {
      apply(s, useUltimate(s, a.side, a.slot));
    }
  }

  /** Aksi tambahan untuk AI. */
  function extraActions(s, side) {
    const acts = [];
    const p = s.players[side];
    [[0, 1], [1, 2], [0, 2]].forEach(([a, b]) => {
      if (canSwap(s, side, a, b).ok) acts.push({ type: 'SWAP', side, a, b });
    });
    p.monsters.forEach((m, slot) => {
      if (!m) return;
      p.hand.forEach((c) => {
        if (canEvolve(s, side, slot, c.uid).ok) acts.push({ type: 'EVOLVE', side, slot, uid: c.uid });
      });
      if (checkUltimate(s, side, slot).ok) acts.push({ type: 'ULTIMATE', side, slot });
    });
    return acts;
  }

  return { react, strike, onTurnStart, onTurnEnd, spell, doExtra, extraActions, checkUltimate };
}