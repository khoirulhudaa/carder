// Pembuat efek deklaratif. "to" = siapa sasarannya:
//  T = target pilihan pemain, src = monster sumber, trig = monster pemicu jebakan,
//  allEnemy / allAlly / randEnemy = monster, foe / me = pemain (LP)
export const fx = {
  dmg: (to, n) => ({ op: 'dmg', to, n }),
  heal: (to, n) => ({ op: 'heal', to, n }),
  buff: (to, s) => ({ op: 'buff', to, ...s }),
  tbuff: (to, atk) => ({ op: 'tbuff', to, atk }),
  draw: (n) => ({ op: 'draw', n }),
  mana: (n) => ({ op: 'mana', n }),
  destroy: (to) => ({ op: 'destroy', to }),
  stun: (to) => ({ op: 'stun', to }),
  burn: (to, n) => ({ op: 'burn', to, n }),
  shield: (to) => ({ op: 'shield', to }),
  token: (id) => ({ op: 'token', id }),
  revive: (max) => ({ op: 'revive', max }),
  negate: () => ({ op: 'negate' }),
  bounce: (to) => ({ op: 'bounce', to }),
  discard: (n) => ({ op: 'discard', n }),
};

export const KEYWORDS = {
  haste: { name: 'Cepat', icon: '💨', desc: 'Bisa beraksi di giliran ia dipanggil.' },
  pierce: { name: 'Tembus', icon: '🗡️', desc: 'Mengabaikan DEF dan kelebihan damage mengenai LP lawan.' },
  taunt: { name: 'Penjaga', icon: '🛡️', desc: 'Lawan wajib menyerang monster Penjaga lebih dulu.' },
  lifesteal: { name: 'Hisap', icon: '🩸', desc: 'Damage yang diberikan memulihkan LP-mu.' },
  shield: { name: 'Perisai', icon: '🔰', desc: 'Menolak damage pertama yang diterima.' },
};
