// Reaksi Elemen: dua elemen berbeda yang mengenai target yang sama dalam
// satu giliran memicu reaksi. Urutan serangan jadi bagian dari strategi.
import { other, patchMon, setMon, liveSlots, hasKw } from './util.js';

// Sesuaikan jika id elemen di data/elements.js berbeda.
const ALIAS = {
  api: 'api', fire: 'api',
  air: 'air', water: 'air',
  listrik: 'listrik', lightning: 'listrik', electric: 'listrik', petir: 'listrik',
  tanah: 'tanah', earth: 'tanah', batu: 'tanah',
  es: 'es', ice: 'es', salju: 'es',
  angin: 'angin', wind: 'angin',
  gelap: 'gelap', dark: 'gelap',
  cahaya: 'cahaya', light: 'cahaya',
};
export const norm = (el) => ALIAS[String(el || '').toLowerCase()] || null;

const pair = (a, b) => [a, b].sort().join('+');

export const REACTIONS = {
  [pair('api', 'air')]:      { id: 'uap',      name: 'Uap',      desc: '2 damage ke semua monster lawan' },
  [pair('air', 'listrik')]:  { id: 'konduksi', name: 'Konduksi', desc: '3 damage ke monster di sebelah target' },
  [pair('api', 'tanah')]:    { id: 'magma',    name: 'Magma',    desc: 'Target terbakar (2x2) dan kehilangan perisai' },
  [pair('api', 'es')]:       { id: 'retak',    name: 'Retak',    desc: 'Perisai hancur, +3 damage' },
  [pair('angin', 'listrik')]:{ id: 'badai',    name: 'Badai',    desc: 'Target membeku giliran depan' },
  [pair('cahaya', 'gelap')]: { id: 'gerhana',  name: 'Gerhana',  desc: 'Target dibungkam 2 giliran' },
};

export function hurt(g, side, slot, amount, events, mult = 1) {
  const m = g.players[side].monsters[slot];
  if (!m || amount <= 0) return g;
  const hp = m.hp - amount;
  events.push({ type: 'dmg', side, slot, value: amount, mult });
  if (hp > 0) return patchMon(g, side, slot, (x) => ({ ...x, hp }));
  if (hasKw(m, 'bangkit') && !m.revived) {
    events.push({ type: 'heal', side, slot, value: Math.ceil(m.maxHp / 2) });
    return patchMon(g, side, slot, (x) => ({ ...x, hp: Math.ceil(x.maxHp / 2), revived: true }));
  }
  events.push({ type: 'destroy', side, slot });
  return setMon(g, side, slot, null);
}

/**
 * Catat serangan elemen ke target; jika ada tanda elemen lain pada giliran
 * yang sama, picu reaksi. Mengembalikan { g, events, reaction }.
 */
export function applyElementHit(g, side, slot, element, turn = g.turn) {
  const el = norm(element);
  const events = [];
  const m = g.players[side].monsters[slot];
  if (!m || !el) return { g, events, reaction: null };

  const marks = (m.marks || []).filter((k) => k.turn === turn);
  const partner = marks.find((k) => k.el !== el);
  if (!partner) {
    const next = patchMon(g, side, slot, (x) => ({
      ...x, marks: [...marks.filter((k) => k.el !== el), { el, turn }],
    }));
    return { g: next, events, reaction: null };
  }

  const r = REACTIONS[pair(el, partner.el)];
  let ng = patchMon(g, side, slot, (x) => ({ ...x, marks: [] }));
  if (!r) return { g: ng, events, reaction: null };
  events.push({ type: 'reaction', side, slot, id: r.id, name: r.name });

  switch (r.id) {
    case 'uap':
      liveSlots(ng, side).forEach((s) => { ng = hurt(ng, side, s, 2, events); });
      break;
    case 'konduksi':
      [slot - 1, slot + 1].forEach((s) => { if (ng.players[side].monsters[s]) ng = hurt(ng, side, s, 3, events); });
      break;
    case 'magma':
      ng = patchMon(ng, side, slot, (x) => ({ ...x, burn: 2, burnDmg: 2, shield: false }));
      events.push({ type: 'burn', side, slot });
      break;
    case 'retak':
      ng = patchMon(ng, side, slot, (x) => ({ ...x, shield: false }));
      ng = hurt(ng, side, slot, 3, events);
      break;
    case 'badai':
      ng = patchMon(ng, side, slot, (x) => ({ ...x, stun: Math.max(1, x.stun || 0) }));
      events.push({ type: 'stun', side, slot });
      break;
    case 'gerhana':
      ng = patchMon(ng, side, slot, (x) => ({ ...x, silence: 2 }));
      break;
    default:
      break;
  }
  return { g: ng, events, reaction: r };
}

export { other };