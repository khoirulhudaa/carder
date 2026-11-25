import { autoDeck } from '../engine/deck.js';
import { ELEMENT_LIST } from './elements.js';

export const OPPONENTS = [
  { id: 'api', name: 'Ignar, Penjaga Kawah', avatar: '🦊', element: 'api', desc: 'Menyerang cepat dan membakar semua yang menghalangi.' },
  { id: 'air', name: 'Maris, Ratu Samudra', avatar: '🧜', element: 'air', desc: 'Sabar, menyembuhkan, lalu membekukan serangan.' },
  { id: 'tanah', name: 'Golgoth, Raja Gua', avatar: '🧌', element: 'tanah', desc: 'Dinding monster yang sulit ditembus.' },
  { id: 'angin', name: 'Zephyra, Penguasa Langit', avatar: '🦅', element: 'angin', desc: 'Lincah, banyak menarik kartu.' },
  { id: 'petir', name: 'Voltan, Dukun Guntur', avatar: '🧙‍♂️', element: 'petir', desc: 'Damage ledakan langsung ke LP-mu.' },
  { id: 'alam', name: 'Sylva, Penjaga Rimba', avatar: '🧝', element: 'alam', desc: 'Regenerasi tanpa henti dan sulur penjaga.' },
  { id: 'cahaya', name: 'Lumina, Cahaya Terakhir', avatar: '👸', element: 'cahaya', desc: 'Perisai suci dan penghakiman mutlak.' },
  { id: 'gelap', name: 'Noctis, Raja Bayangan', avatar: '🧛', element: 'gelap', desc: 'Menghisap nyawa dan membangkitkan mayat.' },
  { id: 'acak', name: 'Petualang Misterius', avatar: '🎭', element: null, desc: 'Elemen acak — siapa tahu apa yang ia bawa.' },
];

export const DIFFICULTIES = {
  mudah: { id: 'mudah', name: 'Mudah', reward: 80, desc: 'AI sering salah langkah.' },
  normal: { id: 'normal', name: 'Normal', reward: 140, desc: 'Lawan yang seimbang.' },
  sulit: { id: 'sulit', name: 'Sulit', reward: 220, desc: 'AI cermat dan memakai 2 elemen.' },
};

const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function buildEnemyDeck(opp, difficulty) {
  let els;
  if (!opp.element) {
    els = [pick(ELEMENT_LIST).id, pick(ELEMENT_LIST).id];
  } else if (difficulty === 'sulit') {
    els = [opp.element, pick(ELEMENT_LIST.filter((e) => e.id !== opp.element)).id];
  } else {
    els = [opp.element];
  }
  return autoDeck([...new Set(els)]);
}
