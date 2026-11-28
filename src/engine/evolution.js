// Evolusi gaya TCG: kartu Tahap 1/2 diletakkan di atas monster yang sudah ada.
// HP yang hilang, relik, dan status ikut terbawa; tidak kena "baru dipanggil".
import { defOf, patchPlayer } from './util.js';

export function canEvolve(g, side, slot, handUid) {
  const p = g.players[side];
  const m = p.monsters[slot];
  const card = p.hand.find((c) => c.uid === handUid);
  if (g.active !== side) return { ok: false, reason: 'Bukan giliranmu' };
  if (!m || !card) return { ok: false, reason: 'Target atau kartu tidak ada' };
  const nd = defOf(card);
  if (!nd?.evolvesFrom) return { ok: false, reason: 'Bukan kartu evolusi' };
  if (g.turn <= 1) return { ok: false, reason: 'Belum boleh berevolusi di giliran pertama' };
  if (nd.evolvesFrom !== m.id) return { ok: false, reason: `Hanya dari ${defOf(m)?.name}` };
  if (m.evolvedTurn === g.turn) return { ok: false, reason: 'Sudah berevolusi giliran ini' };
  if (m.summonedTurn === g.turn) return { ok: false, reason: 'Baru dipanggil giliran ini' };
  if (p.mana < nd.cost) return { ok: false, reason: `Butuh ${nd.cost} energi` };
  return { ok: true, card, def: nd };
}

export function evolve(g, side, slot, handUid) {
  const chk = canEvolve(g, side, slot, handUid);
  if (!chk.ok) return { g, events: [], error: chk.reason };
  const { card, def } = chk;
  const events = [{ type: 'evolve', side, slot, from: g.players[side].monsters[slot].id, to: card.id }];
  const ng = patchPlayer(g, side, (p) => {
    const monsters = p.monsters.slice();
    const old = monsters[slot];
    const lost = old.maxHp - old.hp;
    const maxHp = def.hp ?? def.def ?? old.maxHp;
    monsters[slot] = {
      ...old,
      id: card.id,
      uid: card.uid,
      maxHp,
      hp: Math.max(1, maxHp - lost),
      evolvedTurn: g.turn,
      charge: old.charge || 0,
    };
    return {
      ...p,
      monsters,
      mana: p.mana - def.cost,
      hand: p.hand.filter((c) => c.uid !== handUid),
    };
  });
  return { g: ng, events };
}