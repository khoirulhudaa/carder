import { ALL_CARDS, CARDS } from '../data/cards.js';
import { COPY_LIMIT, DECK_MAX, DECK_MIN, RARITY } from './constants.js';

export const copyLimit = (card) => COPY_LIMIT[card.rarity] ?? 3;

export function countIds(ids) {
  const out = {};
  ids.forEach((id) => { out[id] = (out[id] || 0) + 1; });
  return out;
}

export function expandCounts(counts) {
  const ids = [];
  Object.entries(counts).forEach(([id, n]) => { for (let i = 0; i < n; i++) ids.push(id); });
  return ids;
}

// Validasi deck terhadap koleksi (owned = {id: jumlah}); owned null -> abaikan koleksi
export function validateDeck(ids, owned = null) {
  const errors = [];
  if (ids.length < DECK_MIN) errors.push(`Minimal ${DECK_MIN} kartu (sekarang ${ids.length})`);
  if (ids.length > DECK_MAX) errors.push(`Maksimal ${DECK_MAX} kartu (sekarang ${ids.length})`);
  const counts = countIds(ids);
  for (const [id, n] of Object.entries(counts)) {
    const c = CARDS[id];
    if (!c || c.token) { errors.push(`Kartu tidak dikenal: ${id}`); continue; }
    if (n > copyLimit(c)) errors.push(`${c.name}: maks ${copyLimit(c)} salinan`);
    if (owned && n > (owned[id] || 0)) errors.push(`${c.name}: kamu hanya punya ${owned[id] || 0}`);
  }
  return { ok: errors.length === 0, errors };
}

// Bangun deck otomatis dari 1-2 elemen (+ kartu netral)
export function autoDeck(elements, size = 30, owned = null) {
  const counts = {};
  let total = 0;
  const cap = (c) => Math.min(copyLimit(c), owned ? owned[c.id] || 0 : 99);
  const add = (c, n) => {
    const cur = counts[c.id] || 0;
    const k = Math.min(n, cap(c) - cur, size - total);
    if (k > 0) { counts[c.id] = cur + k; total += k; }
  };
  const mine = ALL_CARDS.filter((c) => elements.includes(c.element));
  const neutral = ALL_CARDS.filter((c) => c.element === 'netral');
  const byCost = (a, b) => a.cost - b.cost;
  const mons = mine.filter((c) => c.type === 'monster').sort(byCost);
  const others = mine.filter((c) => c.type !== 'monster');
  const neutralOthers = neutral.filter((c) => c.type !== 'monster');

  mons.forEach((c) => add(c, c.rarity === 'E' || c.rarity === 'L' ? 1 : 2));
  others.forEach((c) => add(c, 2));
  neutralOthers.forEach((c) => add(c, c.rarity === 'C' ? 2 : 1));
  // isi sisanya dengan salinan tambahan
  for (let pass = 0; pass < 3 && total < size; pass++) {
    [...mons, ...others, ...neutralOthers].forEach((c) => add(c, 1));
  }
  return expandCounts(counts);
}

function pickRarity(weights) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (const [k, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return k;
  }
  return 'C';
}

// Buka 1 pack = 5 kartu. element -> pack elemen (kartu elemen itu + netral)
export function rollPack(element = null) {
  const pool = ALL_CARDS.filter((c) => !element || c.element === element || c.element === 'netral');
  const base = Object.fromEntries(Object.values(RARITY).map((r) => [r.id, r.weight]));
  const pickOf = (rarity) => {
    let list = pool.filter((c) => c.rarity === rarity);
    if (!list.length) list = pool;
    return list[Math.floor(Math.random() * list.length)].id;
  };
  const out = [];
  for (let i = 0; i < 4; i++) out.push(pickOf(pickRarity(base)));
  out.push(pickOf(pickRarity({ R: 70, E: 24, L: 6 })));
  return out;
}
