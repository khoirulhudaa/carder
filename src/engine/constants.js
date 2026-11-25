export const START_LP = 6000;
export const MAX_MANA = 10;
export const HAND_LIMIT = 8;
export const SLOTS = 3;
export const START_HAND = 5;
export const DECK_MIN = 30;
export const DECK_MAX = 40;

// batas salinan per kartu dalam satu deck, berdasarkan kelangkaan
export const COPY_LIMIT = { C: 3, R: 3, E: 2, L: 1 };

export const RARITY = {
  C: { id: 'C', name: 'Biasa', color: '#94a3b8', weight: 70 },
  R: { id: 'R', name: 'Langka', color: '#38bdf8', weight: 22 },
  E: { id: 'E', name: 'Epik', color: '#c084fc', weight: 7 },
  L: { id: 'L', name: 'Legenda', color: '#fbbf24', weight: 1 },
};

export const TYPE_NAMES = {
  monster: 'Monster',
  spell: 'Sihir',
  relic: 'Relik',
  trap: 'Jebakan',
  field: 'Medan',
};

export const PACK_PRICE = 120;
export const ELEMENT_PACK_PRICE = 200;
