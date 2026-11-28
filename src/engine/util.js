// Util dasar: semua fungsi bersifat murni (tidak mengubah state lama).

export const SLOTS = 3;

export function patchMon(g, side, slot, fn) {
  const p = g.players[side];
  const m = p.monsters[slot];
  if (!m) return g;
  const monsters = p.monsters.slice();
  monsters[slot] = fn({ ...m });
  return { ...g, players: { ...g.players, [side]: { ...p, monsters } } };
}

export function setMon(g, side, slot, inst) {
  const p = g.players[side];
  const monsters = p.monsters.slice();
  monsters[slot] = inst;
  return { ...g, players: { ...g.players, [side]: { ...p, monsters } } };
}

export function patchPlayer(g, side, fn) {
  return { ...g, players: { ...g.players, [side]: fn({ ...g.players[side] }) } };
}

export const other = (side) => (side === 'player' ? 'enemy' : 'player');

export function liveSlots(g, side) {
  return g.players[side].monsters
    .map((m, i) => (m ? i : -1))
    .filter((i) => i >= 0);
}

// Registri definisi kartu (isi sekali saat start: registerCards(CARDS)).
let REG = {};
export const registerCards = (cards) => { REG = cards; };
export const defOf = (inst) => (inst ? REG[inst.id] : null);

// Keyword aktif suatu monster (kosong jika sedang dibungkam).
export function kwOf(inst) {
  if (!inst || inst.silence > 0) return [];
  return defOf(inst)?.kw || [];
}
export const hasKw = (inst, k) => kwOf(inst).includes(k);