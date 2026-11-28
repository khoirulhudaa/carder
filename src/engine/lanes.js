// Barisan depan/belakang. Slot tengah (1) = garis depan; slot 0 dan 2 = belakang.
// Monster belakang aman dari serangan biasa selama masih ada monster depan,
// tapi tetap bisa memakai skill. Menukar posisi butuh energi (seperti Retreat Cost).
import { patchPlayer, liveSlots } from './util.js';
import { hasKw } from './util.js';
import { applyTaunt } from './keywords.js';

export const FRONT = 1;
export const SWAP_COST = 1;
export const isFront = (slot) => slot === FRONT;

/** Daftar slot yang boleh diserang. `base` = hasil attackTargets lama (angka slot atau ['direct']). */
export function filterAttackTargets(g, dSide, attacker, base) {
  if (base[0] === 'direct') return base;
  let slots = base.slice();
  const frontAlive = !!g.players[dSide].monsters[FRONT];
  if (frontAlive && !hasKw(attacker, 'tembus')) {
    const onlyFront = slots.filter(isFront);
    if (onlyFront.length) slots = onlyFront;
  }
  return applyTaunt(g, dSide, attacker, slots);
}

export function canSwap(g, side, a, b) {
  const p = g.players[side];
  if (g.active !== side) return { ok: false, reason: 'Bukan giliranmu' };
  if (a === b || a < 0 || b < 0 || a > 2 || b > 2) return { ok: false, reason: 'Posisi tidak valid' };
  if (!p.monsters[a] && !p.monsters[b]) return { ok: false, reason: 'Tidak ada monster' };
  if (p.swapped) return { ok: false, reason: 'Sudah menukar posisi giliran ini' };
  if (p.mana < SWAP_COST) return { ok: false, reason: `Butuh ${SWAP_COST} energi` };
  return { ok: true };
}

export function swapSlots(g, side, a, b) {
  const chk = canSwap(g, side, a, b);
  if (!chk.ok) return { g, events: [], error: chk.reason };
  const ng = patchPlayer(g, side, (p) => {
    const monsters = p.monsters.slice();
    [monsters[a], monsters[b]] = [monsters[b], monsters[a]];
    return { ...p, monsters, mana: p.mana - SWAP_COST, swapped: true };
  });
  return { g: ng, events: [{ type: 'swap', side, a, b }] };
}

/** Panggil di awal giliran untuk mereset penanda tukar. */
export const resetSwap = (g, side) => patchPlayer(g, side, (p) => ({ ...p, swapped: false }));

export { liveSlots };