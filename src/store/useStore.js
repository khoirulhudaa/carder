import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { autoDeck, countIds, copyLimit, rollPack } from '../engine/deck.js';
import { CARDS } from '../data/cards.js';
import { PACK_PRICE, ELEMENT_PACK_PRICE } from '../engine/constants.js';
import { DIFFICULTIES } from '../data/opponents.js';
import { setMuted } from '../lib/sfx.js';

export const SELL_VALUE = { C: 10, R: 30, E: 80, L: 250 };

const initial = {
  started: false,
  gold: 0,
  collection: {},
  decks: [],
  activeDeck: null,
  stats: { wins: 0, losses: 0, streak: 0, best: 0 },
  muted: false,
  packsOpened: 0,
};

// nilai jual kelebihan salinan (di atas batas deck)
export function duplicateInfo(collection) {
  let count = 0;
  let value = 0;
  for (const [id, n] of Object.entries(collection)) {
    const c = CARDS[id];
    if (!c) continue;
    const extra = n - copyLimit(c);
    if (extra > 0) {
      count += extra;
      value += extra * SELL_VALUE[c.rarity];
    }
  }
  return { count, value };
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...initial,

      startWith: (el) => {
        const ids = autoDeck([el]);
        set({
          started: true,
          gold: 400,
          collection: countIds(ids),
          decks: [{ id: 'd' + Date.now(), name: 'Deck Awal', cards: ids }],
          activeDeck: null,
        });
        set((s) => ({ activeDeck: s.decks[0].id }));
      },

      addCards: (ids) =>
        set((s) => {
          const c = { ...s.collection };
          ids.forEach((i) => { c[i] = (c[i] || 0) + 1; });
          return { collection: c };
        }),

      buyPack: (element = null) => {
        const s = get();
        const price = element ? ELEMENT_PACK_PRICE : PACK_PRICE;
        if (s.gold < price) return null;
        const ids = rollPack(element);
        const seen = { ...s.collection };
        const isNew = ids.map((id) => {
          const fresh = !(seen[id] > 0);
          seen[id] = (seen[id] || 0) + 1;
          return fresh;
        });
        set({ gold: s.gold - price, collection: seen, packsOpened: s.packsOpened + 1 });
        return { ids, isNew };
      },

      sellDuplicates: () => {
        const s = get();
        const col = { ...s.collection };
        let gain = 0;
        for (const [id, n] of Object.entries(col)) {
          const c = CARDS[id];
          if (!c) continue;
          const lim = copyLimit(c);
          if (n > lim) {
            gain += (n - lim) * SELL_VALUE[c.rarity];
            col[id] = lim;
          }
        }
        set({ collection: col, gold: s.gold + gain });
        return gain;
      },

      saveDeck: (deck) =>
        set((s) => {
          const exists = s.decks.some((d) => d.id === deck.id);
          const decks = exists ? s.decks.map((d) => (d.id === deck.id ? deck : d)) : [...s.decks, deck];
          return { decks, activeDeck: s.activeDeck || deck.id };
        }),

      deleteDeck: (id) =>
        set((s) => {
          const decks = s.decks.filter((d) => d.id !== id);
          return { decks, activeDeck: s.activeDeck === id ? decks[0]?.id ?? null : s.activeDeck };
        }),

      setActiveDeck: (id) => set({ activeDeck: id }),

      finishDuel: (won, difficulty) => {
        const reward = won ? DIFFICULTIES[difficulty]?.reward ?? 100 : 30;
        set((s) => {
          const streak = won ? s.stats.streak + 1 : 0;
          return {
            gold: s.gold + reward,
            stats: {
              wins: s.stats.wins + (won ? 1 : 0),
              losses: s.stats.losses + (won ? 0 : 1),
              streak,
              best: Math.max(s.stats.best || 0, streak),
            },
          };
        });
        return reward;
      },

      toggleMute: () => {
        const m = !get().muted;
        setMuted(m);
        set({ muted: m });
      },

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'elementra-save-v1',
      onRehydrateStorage: () => (state) => { if (state) setMuted(state.muted); },
    },
  ),
);

export { PACK_PRICE, ELEMENT_PACK_PRICE };
