import { CARDS } from './cards.js';
import { KEYWORDS } from './effects.js';

const TO = {
  T: 'target',
  src: 'dirinya',
  trig: 'monster pemicu',
  allEnemy: 'semua monster lawan',
  allAlly: 'semua monster sekutu',
  randEnemy: '1 monster lawan acak',
};

function one(e) {
  const to = e.to;
  switch (e.op) {
    case 'dmg':
      if (to === 'foe') return `Beri ${e.n} damage ke LP lawan`;
      if (to === 'me') return `Kamu menerima ${e.n} damage`;
      return `Beri ${e.n} damage elemen ke ${TO[to]}`;
    case 'heal':
      if (to === 'me') return `Pulihkan ${e.n} LP-mu`;
      if (to === 'foe') return `Lawan pulih ${e.n} LP`;
      return `Pulihkan ${e.n} HP ${TO[to]}`;
    case 'buff': {
      const parts = [];
      if (e.atk) parts.push(`+${e.atk} ATK`);
      if (e.def) parts.push(`+${e.def} DEF`);
      if (e.hp) parts.push(`+${e.hp} HP`);
      return `${TO[to]} mendapat ${parts.join(' ')}`;
    }
    case 'tbuff':
      return `${TO[to]} +${e.atk} ATK sampai akhir giliran`;
    case 'draw':
      return `Ambil ${e.n} kartu`;
    case 'mana':
      return `Dapat +${e.n} energi giliran ini`;
    case 'destroy':
      return `Hancurkan ${TO[to]}`;
    case 'stun':
      return `${TO[to]} membeku (tak bisa beraksi 1 giliran)`;
    case 'burn':
      return `Bakar ${TO[to]} (${e.n} damage/giliran, 3 giliran)`;
    case 'shield':
      return `Beri Perisai ke ${TO[to]}`;
    case 'token':
      return `Panggil ${CARDS[e.id].name}`;
    case 'revive':
      return `Bangkitkan 1 monster biaya ≤${e.max} dari kuburan`;
    case 'negate':
      return 'Batalkan aksi lawan';
    case 'bounce':
      return `Kembalikan ${TO[to]} ke tangan pemiliknya`;
    case 'discard':
      return `Lawan membuang ${e.n} kartu acak`;
    default:
      return '';
  }
}

export const describeFx = (list) => (list || []).map(one).filter(Boolean).join('. ') + '.';

const TRIGGER = {
  attack: 'Saat lawan menyerang',
  summon: 'Saat lawan memanggil monster',
  spell: 'Saat lawan memainkan sihir',
};

// Mengembalikan baris deskripsi [{k, text}] untuk ditampilkan di kartu
export function describeCard(c) {
  const out = [];
  if (c.type === 'monster') {
    if (c.kw.length) out.push({ k: 'Sifat', text: c.kw.map((k) => `${KEYWORDS[k].icon} ${KEYWORDS[k].name}`).join(' · ') });
    if (c.onSummon) out.push({ k: 'Seruan', text: describeFx(c.onSummon) });
    if (c.onStart) out.push({ k: 'Awal giliran', text: describeFx(c.onStart) });
    if (c.onAttack) out.push({ k: 'Saat menyerang', text: describeFx(c.onAttack) });
    if (c.onDeath) out.push({ k: 'Wasiat', text: describeFx(c.onDeath) });
    if (c.skill) out.push({ k: `Skill · ${c.skill.name} (${c.skill.cost}⚡)`, text: describeFx(c.skill.fx), skill: true });
  } else if (c.type === 'spell') {
    out.push({ k: 'Efek', text: describeFx(c.fx) });
  } else if (c.type === 'relic') {
    const p = [];
    if (c.atk) p.push(`+${c.atk} ATK`);
    if (c.def) p.push(`+${c.def} DEF`);
    if (c.hp) p.push(`+${c.hp} HP`);
    out.push({ k: 'Pasang ke monster', text: p.join(' ') + (c.kw.length ? ' · ' + c.kw.map((k) => KEYWORDS[k].name).join(', ') : '') });
  } else if (c.type === 'trap') {
    out.push({ k: TRIGGER[c.trigger], text: describeFx(c.fx) });
  } else if (c.type === 'field') {
    const a = c.aura;
    const p = [];
    if (a.atk) p.push(`+${a.atk} ATK`);
    if (a.def) p.push(`+${a.def} DEF`);
    out.push({ k: 'Aura', text: `Monster elemenmu ${p.join(' ')}` });
    if (c.onStart) out.push({ k: 'Awal giliran', text: describeFx(c.onStart) });
  }
  return out;
}
