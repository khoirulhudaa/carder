// Keyword: perhitungan serangan, status giliran, dan pembatasan target.
import { hasKw, patchMon, liveSlots, other } from './util.js';
import { hurt } from './reactions.js';

/** Terapkan efek keyword pada satu serangan biasa. `base` = damage setelah rumus ATK/DEF engine. */
export function resolveStrike(g, aSide, aSlot, dSide, dSlot, base) {
  const events = [];
  const a = g.players[aSide].monsters[aSlot];
  const d = g.players[dSide].monsters[dSlot];
  if (!a || !d) return { g, events, dealt: 0 };

  const pierce = hasKw(a, 'tembus') && !hasKw(d, 'dinding');
  let dmg = base;

  if (d.shield && !pierce) {
    g = patchMon(g, dSide, dSlot, (x) => ({ ...x, shield: false }));
    events.push({ type: 'shield', side: dSide, slot: dSlot });
    dmg = 0;
  } else if (d.shield && pierce) {
    g = patchMon(g, dSide, dSlot, (x) => ({ ...x, shield: false }));
  }

  const before = g.players[dSide].monsters[dSlot].hp;
  g = hurt(g, dSide, dSlot, dmg, events);
  const after = g.players[dSide].monsters[dSlot]?.hp ?? 0;
  const dealt = Math.max(0, before - Math.max(0, after));

  if (dealt > 0) {
    if (hasKw(a, 'sedot') && g.players[aSide].monsters[aSlot]) {
      const blocked = (g.players[aSide].monsters[aSlot].venom || 0) > 0;
      if (!blocked) {
        g = patchMon(g, aSide, aSlot, (x) => ({ ...x, hp: Math.min(x.maxHp, x.hp + dealt) }));
        events.push({ type: 'heal', side: aSide, slot: aSlot, value: dealt });
      }
    }
    if (hasKw(a, 'racun') && g.players[dSide].monsters[dSlot]) {
      g = patchMon(g, dSide, dSlot, (x) => ({ ...x, venom: (x.venom || 0) + 1 }));
    }
    if (hasKw(a, 'bungkam') && g.players[dSide].monsters[dSlot]) {
      g = patchMon(g, dSide, dSlot, (x) => ({ ...x, silence: Math.max(x.silence || 0, 1) }));
    }
    if (hasKw(d, 'duri') && g.players[aSide].monsters[aSlot]) {
      g = hurt(g, aSide, aSlot, 2, events);
    }
  }
  return { g, events, dealt };
}

/** Awal giliran `side`: racun menggigit, bungkam berkurang. */
export function tickStatuses(g, side) {
  const events = [];
  liveSlots(g, side).forEach((s) => {
    const m = g.players[side].monsters[s];
    if (!m) return;
    if (m.venom > 0) g = hurt(g, side, s, m.venom, events);
    if (g.players[side].monsters[s] && g.players[side].monsters[s].silence > 0) {
      g = patchMon(g, side, s, (x) => ({ ...x, silence: x.silence - 1 }));
    }
  });
  return { g, events };
}

/** Bersihkan racun (dipakai kartu pembersih). */
export function cleanse(g, side, slot) {
  return patchMon(g, side, slot, (x) => ({ ...x, venom: 0, burn: 0, silence: 0 }));
}

/** Sergap: boleh menyerang walau baru dipanggil. */
export const ignoresSummonSickness = (inst) => hasKw(inst, 'sergap');

/** Pancing: jika ada monster Pancing di lawan, hanya merekalah target sah (kecuali penyerang Tembus). */
export function applyTaunt(g, dSide, attacker, slots) {
  if (hasKw(attacker, 'tembus')) return slots;
  const taunters = slots.filter((s) => hasKw(g.players[dSide].monsters[s], 'pancing'));
  return taunters.length ? taunters : slots;
}

export { other };