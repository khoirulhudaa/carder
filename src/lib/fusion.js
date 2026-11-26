import { CARDS, ALL_CARDS } from '../data/cards.js';
import { useStore } from '../store/useStore.js';
import { rankOf } from './pulls.js';
import { copyLimit } from '../engine/deck.js';

/* ------------------------------------------------------------------ */
/*  Fusi skill                                                        */
/*  - Butuh FUSE_COPIES salinan kartu dasar (semuanya terpakai).       */
/*  - Donor: kartu monster Biasa/Langka yang dimiliki (tidak terpakai). */
/*  - Hasil: kartu baru = stat kartu dasar + skill/efek kartu donor.   */
/* ------------------------------------------------------------------ */
export const FUSE_COPIES = 3;
export const DONOR_MAX_RANK = 1; // 0 = Biasa, 1 = Langka

const STORE_KEY = 'elementra_fusions';

// Properti identitas & stat: SELALU tetap milik kartu dasar.
const KEEP_BASE = new Set([
  'id', 'name', 'atk', 'def', 'hp', 'maxHp', 'cost', 'rarity', 'element', 'type',
  'icon', 'art', 'img', 'image', 'flavor', 'tag', 'token', 'fused', 'fusion', 'kw',
]);

// Properti donor yang dianggap skill/efek: yang bentuknya objek/array/fungsi (bukan teks/angka biasa).
const isEffectValue = (v) => v != null && (typeof v === 'object' || typeof v === 'function')
  && !(Array.isArray(v) && v.length === 0);

export function effectKeys(card) {
  return Object.keys(card).filter((k) => !KEEP_BASE.has(k) && isEffectValue(card[k]));
}

/** Kartu ini boleh jadi donor? (monster, Biasa/Langka, punya skill/efek, bukan hasil fusi) */
export function canDonate(card) {
  if (!card || card.fused || card.token || card.type !== 'monster') return false;
  if (rankOf(card) > DONOR_MAX_RANK) return false;
  return effectKeys(card).length > 0 || (card.kw?.length ?? 0) > 0;
}

export const fusedId = (baseId, donorId) => `${baseId}__${donorId}`;

/** Bangun definisi kartu fusi (belum didaftarkan). */
export function buildFused(baseId, donorId) {
  const base = CARDS[baseId];
  const donor = CARDS[donorId];
  if (!base || !donor) return null;
  const card = { ...base };
  effectKeys(donor).forEach((k) => { card[k] = donor[k]; }); // skill/efek donor menggantikan milik dasar
  if (base.kw || donor.kw) card.kw = [...new Set([...(base.kw || []), ...(donor.kw || [])])];
  card.id = fusedId(baseId, donorId);
  card.name = `${base.name} ✦`;
  card.fused = true;
  card.fusion = { base: baseId, donor: donorId };
  return card;
}

function register(card, listed) {
  try {
    CARDS[card.id] = card;
    if (listed && Array.isArray(ALL_CARDS) && !ALL_CARDS.some((c) => c.id === card.id)) ALL_CARDS.push(card);
    return true;
  } catch (e) {
    return false; // CARDS dibekukan (frozen)
  }
}

/** Untuk pratinjau: daftar ke CARDS saja supaya <Card id=...> bisa dirender. */
export function previewFused(baseId, donorId) {
  const card = buildFused(baseId, donorId);
  if (card) register(card, false);
  return card;
}

/* ---------- penyimpanan (localStorage terpisah dari store) ---------- */
let defs = {};
function loadDefs() {
  try { defs = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { defs = {}; }
}
function saveDefs() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(defs)); } catch (e) { /* abaikan */ }
}

/** Daftarkan ulang semua kartu fusi yang pernah dibuat (dipanggil sekali saat aplikasi dimuat). */
export function loadFusions() {
  loadDefs();
  Object.values(defs).forEach(({ base, donor }) => {
    const card = buildFused(base, donor);
    if (card) register(card, true);
  });
}

/** Lakukan fusi. Mengembalikan { ok, id } atau { ok:false, reason }. */
export function fuse(baseId, donorId) {
  const st = useStore.getState();
  const have = st.collection;
  const base = CARDS[baseId];
  const donor = CARDS[donorId];
  if (!base || !donor) return { ok: false, reason: 'Kartu tidak ditemukan.' };
  if (base.fused || base.type !== 'monster') return { ok: false, reason: 'Kartu dasar harus monster biasa (bukan hasil fusi).' };
  if (baseId === donorId) return { ok: false, reason: 'Donor harus kartu yang berbeda.' };
  if ((have[baseId] || 0) < FUSE_COPIES) return { ok: false, reason: `Butuh ${FUSE_COPIES} salinan kartu dasar.` };
  if ((have[donorId] || 0) < 1) return { ok: false, reason: 'Kartu donor belum kamu miliki.' };
  if (!canDonate(donor)) return { ok: false, reason: 'Donor hanya boleh monster Biasa/Langka yang punya skill atau efek.' };

  const card = buildFused(baseId, donorId);
  if (!card || !register(card, true)) return { ok: false, reason: 'Gagal membuat kartu fusi.' };
  defs[card.id] = { base: baseId, donor: donorId };
  saveDefs();

  const next = { ...have, [baseId]: have[baseId] - FUSE_COPIES, [card.id]: (have[card.id] || 0) + 1 };
  useStore.setState({ collection: next });
  repairDecks(); // deck yang memakai kartu dasar otomatis diganti dengan kartu fusi-nya
  return { ok: true, id: card.id };
}

// Cari pengganti terdekat (tipe, elemen, biaya mirip) dari kartu yang dimiliki dan belum terpakai penuh di deck.
function pickSubstitute(cards, ref, have) {
  const inDeck = {};
  cards.forEach((x) => { inDeck[x] = (inDeck[x] || 0) + 1; });
  let best = null;
  let bestScore = Infinity;
  ALL_CARDS.forEach((c) => {
    if ((have[c.id] || 0) - (inDeck[c.id] || 0) <= 0) return;
    if ((inDeck[c.id] || 0) >= copyLimit(c)) return;
    const score = (c.type === ref.type ? 0 : 100) + (c.element === ref.element ? 0 : 20)
      + Math.abs((c.cost ?? 0) - (ref.cost ?? 0)) + rankOf(c) * 0.1;
    if (score < bestScore) { best = c; bestScore = score; }
  });
  return best ? best.id : null;
}

/**
 * Rapikan semua deck: kalau sebuah deck memuat kartu lebih banyak dari yang dimiliki,
 * kelebihannya diganti dengan versi fusi kartu itu (jika dimiliki), lalu dengan kartu pengganti
 * yang mirip dari koleksi, supaya jumlah kartu deck tetap sama. Dibuang hanya jika tidak ada pengganti.
 */
export function repairDecks() {
  const st = useStore.getState();
  const have = st.collection;
  let changed = false;

  const decks = st.decks.map((d) => {
    const cnt = {};
    d.cards.forEach((id) => { cnt[id] = (cnt[id] || 0) + 1; });
    const bad = Object.keys(cnt).filter((id) => cnt[id] > (have[id] || 0));
    if (bad.length === 0) return d;

    const cards = [...d.cards];
    bad.forEach((id) => {
      let over = cnt[id] - (have[id] || 0);
      const variants = Object.values(CARDS).filter((c) => c.fused && c.fusion?.base === id);
      variants.forEach((v) => {
        if (over <= 0) return;
        const inDeck = cards.filter((x) => x === v.id).length;
        let room = Math.min((have[v.id] || 0) - inDeck, copyLimit(v) - inDeck);
        while (room > 0 && over > 0) {
          cards[cards.lastIndexOf(id)] = v.id;
          room -= 1;
          over -= 1;
        }
      });
      while (over > 0) {
        const i = cards.lastIndexOf(id);
        const sub = pickSubstitute(cards, CARDS[id], have);
        if (sub) cards[i] = sub;
        else cards.splice(i, 1); // tidak ada pengganti sama sekali
        over -= 1;
      }
    });
    changed = true;
    return { ...d, cards };
  });

  if (changed) useStore.setState({ decks });
}

loadFusions();
repairDecks(); // perbaiki deck lama yang sudah terlanjur kekurangan kartu