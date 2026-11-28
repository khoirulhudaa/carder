// Charge dan Ultimate: monster mengisi Charge saat menyerang atau diserang.
// Saat penuh, ia bisa memakai Ultimate sekali (bisa dihalangi dengan Bungkam / dibunuh sebelum penuh).
import { defOf, patchMon, patchPlayer, liveSlots, other } from './util.js';
import { hurt, applyElementHit } from './reactions.js';

export const CHARGE_MAX = 3;

export function gainCharge(g, side, slot, n = 1) {
  return patchMon(g, side, slot, (m) => ({ ...m, charge: Math.min(CHARGE_MAX, (m.charge || 0) + n) }));
}

export function canUltimate(g, side, slot) {
  const m = g.players[side].monsters[slot];
  const d = defOf(m);
  if (g.active !== side) return { ok: false, reason: 'Bukan giliranmu' };
  if (!m || !d?.ult) return { ok: false, reason: 'Tidak punya Ultimate' };
  if (m.silence > 0) return { ok: false, reason: 'Sedang dibungkam' };
  if (m.ultUsed) return { ok: false, reason: 'Ultimate sudah dipakai' };
  if ((m.charge || 0) < CHARGE_MAX) return { ok: false, reason: `Charge ${m.charge || 0}/${CHARGE_MAX}` };
  return { ok: true };
}

/** kind: aoe | react | heal | draw | silenceAll */
export function useUltimate(g, side, slot) {
  const chk = canUltimate(g, side, slot);
  if (!chk.ok) return { g, events: [], error: chk.reason };
  const m = g.players[side].monsters[slot];
  const u = defOf(m).ult;
  const foe = other(side);
  const events = [{ type: 'skill', side, slot, name: u.name }];
  let ng = patchMon(g, side, slot, (x) => ({ ...x, charge: 0, ultUsed: true, acted: true }));

  switch (u.kind) {
    case 'aoe':
      liveSlots(ng, foe).forEach((s) => { ng = hurt(ng, foe, s, u.value, events); });
      break;
    case 'react':
      liveSlots(ng, foe).forEach((s) => {
        const r = applyElementHit(ng, foe, s, u.element);
        ng = r.g; events.push(...r.events);
        const r2 = applyElementHit(ng, foe, s, defOf(m).element);
        ng = r2.g; events.push(...r2.events);
      });
      break;
    case 'heal':
      liveSlots(ng, side).forEach((s) => {
        ng = patchMon(ng, side, s, (x) => ({ ...x, hp: Math.min(x.maxHp, x.hp + u.value) }));
        events.push({ type: 'heal', side, slot: s, value: u.value });
      });
      break;
    case 'silenceAll':
      liveSlots(ng, foe).forEach((s) => { ng = patchMon(ng, foe, s, (x) => ({ ...x, silence: u.value })); });
      break;
    case 'draw':
      ng = patchPlayer(ng, side, (p) => {
        const take = p.deck.slice(0, u.value);
        events.push({ type: 'draw', side });
        return { ...p, deck: p.deck.slice(take.length), hand: [...p.hand, ...take] };
      });
      break;
    default:
      break;
  }
  return { g: ng, events };
}