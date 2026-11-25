export const ELEMENTS = {
  api: { id: 'api', name: 'Api', icon: '🔥', color: '#fb923c', from: '#7c2d12', to: '#f97316', desc: 'Agresif, membakar lawan' },
  air: { id: 'air', name: 'Air', icon: '💧', color: '#38bdf8', from: '#0c4a6e', to: '#0ea5e9', desc: 'Penyembuh & pengendali' },
  tanah: { id: 'tanah', name: 'Tanah', icon: '🪨', color: '#d6a461', from: '#422006', to: '#a16207', desc: 'Pertahanan kokoh' },
  angin: { id: 'angin', name: 'Angin', icon: '🌪️', color: '#5eead4', from: '#134e4a', to: '#14b8a6', desc: 'Cepat, lincah, banyak kartu' },
  petir: { id: 'petir', name: 'Petir', icon: '⚡', color: '#fde047', from: '#713f12', to: '#eab308', desc: 'Damage ledakan' },
  alam: { id: 'alam', name: 'Alam', icon: '🌿', color: '#4ade80', from: '#14532d', to: '#22c55e', desc: 'Regenerasi & sulur' },
  cahaya: { id: 'cahaya', name: 'Cahaya', icon: '✨', color: '#fef08a', from: '#78350f', to: '#fbbf24', desc: 'Perisai & pemurnian' },
  gelap: { id: 'gelap', name: 'Gelap', icon: '🌑', color: '#c084fc', from: '#2e1065', to: '#7e22ce', desc: 'Hisap nyawa & teror' },
  netral: { id: 'netral', name: 'Netral', icon: '⚪', color: '#cbd5e1', from: '#1e293b', to: '#64748b', desc: 'Bisa dipakai siapa saja' },
};

export const ELEMENT_LIST = Object.values(ELEMENTS).filter((e) => e.id !== 'netral');

// Lingkaran elemen: tiap elemen kuat melawan elemen setelahnya.
// Cahaya & Gelap saling kuat satu sama lain.
export const RING = ['api', 'alam', 'tanah', 'petir', 'angin', 'air'];

export function elementMultiplier(att, def) {
  if ((att === 'cahaya' && def === 'gelap') || (att === 'gelap' && def === 'cahaya')) return 1.5;
  const i = RING.indexOf(att);
  const j = RING.indexOf(def);
  if (i < 0 || j < 0) return 1;
  if ((i + 1) % RING.length === j) return 1.5;
  if ((j + 1) % RING.length === i) return 0.75;
  return 1;
}

export function relations(id) {
  if (id === 'cahaya') return { strong: ['gelap'], weak: [] };
  if (id === 'gelap') return { strong: ['cahaya'], weak: [] };
  const i = RING.indexOf(id);
  if (i < 0) return { strong: [], weak: [] };
  return {
    strong: [RING[(i + 1) % RING.length]],
    weak: [RING[(i + RING.length - 1) % RING.length]],
  };
}
