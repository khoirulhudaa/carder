import { ALL_CARDS } from '../data/cards.js';
import { RARITY } from '../engine/constants.js';
import { useStore } from '../store/useStore.js';

/* MODE TES: koin tak terbatas (dipakai Toko & Gacha). Ubah ke false sebelum rilis. */
export const TEST_UNLIMITED_COINS = true;
export const TEST_COINS = 999999999;

// Urutan rarity dari paling umum ke paling langka (mengikuti urutan key RARITY).
const RKEYS = Object.keys(RARITY);
export const rankOf = (c) => Math.max(0, RKEYS.indexOf(c.rarity));
export const MAX_RANK = Math.max(0, RKEYS.length - 1);

export const RANK_COLORS = ['#94a3b8', '#38bdf8', '#a855f7', '#fbbf24'];
export const rankColor = (r) => RANK_COLORS[Math.min(r, RANK_COLORS.length - 1)];

// Peluang dasar per rarity (bukan per kartu): Biasa 60%, Langka 28%, Epik 9%, Legenda 3%.
export const BASE_WEIGHT = [60, 28, 9, 3];

/**
 * Tarik 1 kartu dengan rarity minimal `min`.
 * Rarity dipilih dulu berdasarkan bobot, baru kartunya dipilih acak di rarity itu,
 * jadi jumlah kartu per rarity tidak memengaruhi peluang.
 * `boost` mengalikan bobot Epik ke atas. Kartu fusi & token tidak ikut.
 */
export function drawCard(min = 0, boost = 1) {
  const lo = Math.min(min, MAX_RANK);
  const byRank = {};
  ALL_CARDS.forEach((c) => {
    if (c.fused || c.token) return;
    const r = rankOf(c);
    if (r >= lo) (byRank[r] ||= []).push(c);
  });
  const ranks = Object.keys(byRank).map(Number);
  if (ranks.length === 0) return ALL_CARDS[0];
  const w = ranks.map((r) => (BASE_WEIGHT[r] ?? 1) * (r >= 2 ? boost : 1));
  let x = Math.random() * w.reduce((a, b) => a + b, 0);
  let pick = ranks[ranks.length - 1];
  for (let i = 0; i < ranks.length; i += 1) {
    x -= w[i];
    if (x <= 0) { pick = ranks[i]; break; }
  }
  const list = byRank[pick];
  return list[Math.floor(Math.random() * list.length)];
}

/** Masukkan kartu ke koleksi & kurangi koin. Mengembalikan array isNew (true kalau kartu baru). */
export function addCards(ids, price = 0) {
  const st = useStore.getState();
  const have = { ...st.collection };
  const isNew = ids.map((id) => {
    const fresh = !have[id];
    have[id] = (have[id] || 0) + 1;
    return fresh;
  });
  useStore.setState({ gold: st.gold - price, collection: have });
  return isNew;
}