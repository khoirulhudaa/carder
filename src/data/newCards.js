// Kartu baru. Sesuaikan RAR/EL dengan id di constants.js dan elements.js milikmu.
// Field baru yang dikenali modul engine baru: kw (keyword), ult, evolvesFrom, stage, effect (sihir).
const RAR = { common: 'common', rare: 'rare', epic: 'epic', legend: 'legend' };
const EL = {
  api: 'api', air: 'air', listrik: 'listrik', tanah: 'tanah',
  es: 'es', angin: 'angin', gelap: 'gelap', cahaya: 'cahaya',
};

export const NEW_MONSTERS = [
  { id: 'embun_penjaga', name: 'Penjaga Embun', type: 'monster', element: EL.air, rarity: RAR.common, cost: 2, atk: 1, def: 4, hp: 6, icon: '🛡️', kw: ['pancing'],
    flavor: 'Ia berdiri di depan agar yang lain tidak perlu.' },
  { id: 'bara_kecil', name: 'Bara Kecil', type: 'monster', element: EL.api, rarity: RAR.common, cost: 1, atk: 2, def: 1, hp: 3, icon: '🔥', kw: ['sergap'],
    flavor: 'Kecil, cepat, dan tidak sabar.' },
  { id: 'bara_besar', name: 'Singa Bara', type: 'monster', element: EL.api, rarity: RAR.rare, cost: 3, atk: 4, def: 2, hp: 7, icon: '🦁', evolvesFrom: 'bara_kecil', stage: 1, kw: ['sergap', 'sedot'],
    flavor: 'Setiap luka yang dibuatnya menghangatkan dirinya.' },
  { id: 'ratu_magma', name: 'Ratu Magma', type: 'monster', element: EL.api, rarity: RAR.legend, cost: 6, atk: 6, def: 3, hp: 11, icon: '🌋', evolvesFrom: 'bara_besar', stage: 2, kw: ['tembus'], tag: 'EX',
    ult: { name: 'Letusan Magma', kind: 'react', element: EL.tanah },
    flavor: 'Gunung pun tunduk saat ia bangkit.' },
  { id: 'duri_batu', name: 'Golem Duri', type: 'monster', element: EL.tanah, rarity: RAR.rare, cost: 3, atk: 2, def: 5, hp: 9, icon: '🪨', kw: ['duri', 'dinding'] },
  { id: 'ular_bisa', name: 'Ular Bisa', type: 'monster', element: EL.gelap, rarity: RAR.rare, cost: 2, atk: 2, def: 1, hp: 4, icon: '🐍', kw: ['racun'] },
  { id: 'bayang_pencuri', name: 'Pencuri Bayang', type: 'monster', element: EL.gelap, rarity: RAR.epic, cost: 3, atk: 3, def: 1, hp: 4, icon: '🥷', kw: ['sergap', 'bungkam'],
    skill: { name: 'Curi Pandang', cost: 2, effect: 'peekDiscard' } },
  { id: 'phoenix_abu', name: 'Burung Abu', type: 'monster', element: EL.api, rarity: RAR.epic, cost: 4, atk: 3, def: 2, hp: 6, icon: '🐦‍🔥', kw: ['bangkit'] },
  { id: 'naga_kilat_kecil', name: 'Anak Naga Kilat', type: 'monster', element: EL.listrik, rarity: RAR.rare, cost: 3, atk: 3, def: 2, hp: 5, icon: '🐉' },
  { id: 'naga_sambar', name: 'Naga Sambar', type: 'monster', element: EL.listrik, rarity: RAR.legend, cost: 6, atk: 5, def: 3, hp: 10, icon: '⚡', evolvesFrom: 'naga_kilat_kecil', stage: 1, tag: 'GX',
    ult: { name: 'Sambaran Berantai', kind: 'aoe', value: 3 } },
  { id: 'pendeta_cahaya', name: 'Pendeta Cahaya', type: 'monster', element: EL.cahaya, rarity: RAR.epic, cost: 4, atk: 1, def: 3, hp: 7, icon: '✨',
    ult: { name: 'Berkah Fajar', kind: 'heal', value: 3 } },
  { id: 'penyihir_es', name: 'Penyihir Es', type: 'monster', element: EL.es, rarity: RAR.epic, cost: 4, atk: 2, def: 2, hp: 5, icon: '🧊',
    ult: { name: 'Badai Salju', kind: 'silenceAll', value: 1 } },
];

// Sihir baru. `effect.op` diselesaikan oleh src/engine/spells.js
export const NEW_SPELLS = [
  { id: 'percikan_api', name: 'Percikan Api', type: 'spell', element: EL.api, rarity: RAR.common, cost: 1, icon: '💥', need: 'enemyMonster',
    effect: { op: 'elementHit', element: EL.api, damage: 1 } },
  { id: 'siram_air', name: 'Siraman Air', type: 'spell', element: EL.air, rarity: RAR.common, cost: 1, icon: '💧', need: 'enemyMonster',
    effect: { op: 'elementHit', element: EL.air, damage: 1 } },
  { id: 'penawar', name: 'Penawar Murni', type: 'spell', element: EL.cahaya, rarity: RAR.rare, cost: 1, icon: '🧪', need: 'allyMonster',
    effect: { op: 'cleanse' } },
  { id: 'segel_kuno', name: 'Segel Kuno', type: 'spell', element: EL.gelap, rarity: RAR.epic, cost: 2, icon: '🔒', need: 'enemyMonster',
    effect: { op: 'seal' } },
];

export const NEW_CARDS = [...NEW_MONSTERS, ...NEW_SPELLS];