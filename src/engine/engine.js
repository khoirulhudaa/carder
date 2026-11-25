// Engine duel Elementra — murni (tanpa React), state berupa objek biasa.
import { CARDS } from '../data/cards.js';
import { elementMultiplier } from '../data/elements.js';
import { START_LP, MAX_MANA, HAND_LIMIT, SLOTS, START_HAND } from './constants.js';

export const opp = (side) => (side === 'player' ? 'enemy' : 'player');
const round10 = (n) => Math.round(n / 10) * 10;
const nid = (s) => ++s.seq;
const rand = (n) => Math.floor(Math.random() * n);

function emit(s, e) {
  s.fx.push({ id: ++s.fxSeq, ...e });
}
function log(s, text, side) {
  s.log.push({ id: ++s.logSeq, text, side });
  if (s.log.length > 150) s.log.shift();
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const freeSlot = (arr) => arr.findIndex((x) => !x);

// ---------------------------------------------------------------------
//  Pembuatan permainan
// ---------------------------------------------------------------------
export function createGame({
  playerDeck, enemyDeck, playerName = 'Kamu', enemyName = 'Lawan',
  playerAvatar = '🧙', enemyAvatar = '👹', first, enemyBonusCards = 0,
}) {
  const s = {
    seq: 0, fxSeq: 0, logSeq: 0, turn: 0, active: null, winner: null, reason: null,
    fx: [], log: [], simNoTraps: false,
    names: { player: playerName, enemy: enemyName },
    avatars: { player: playerAvatar, enemy: enemyAvatar },
    players: {},
  };
  const mk = (ids) => ({
    lp: START_LP, mana: 0, maxMana: 0,
    deck: shuffle(ids.map((id) => ({ uid: nid(s), id }))),
    hand: [], grave: [],
    monsters: Array(SLOTS).fill(null),
    traps: Array(SLOTS).fill(null),
    field: null,
  });
  s.players.player = mk(playerDeck);
  s.players.enemy = mk(enemyDeck);

  const starter = first || (Math.random() < 0.5 ? 'player' : 'enemy');
  s.first = starter;
  const second = opp(starter);
  drawCards(s, starter, START_HAND);
  drawCards(s, second, START_HAND + 1 + enemyBonusCards * (second === 'enemy' ? 1 : 0));
  if (enemyBonusCards && starter === 'enemy') drawCards(s, 'enemy', enemyBonusCards);
  log(s, `Undian: ${s.names[starter]} mendapat giliran pertama.`, starter);
  startTurn(s, starter);
  s.fx = [];
  return s;
}

// ---------------------------------------------------------------------
//  Statistik efektif
// ---------------------------------------------------------------------
export function statsOf(s, side, slot) {
  const p = s.players[side];
  const m = p.monsters[slot];
  const d = CARDS[m.id];
  let atk = d.atk + m.bAtk + m.tAtk;
  let def = d.def + m.bDef;
  const kw = new Set(d.kw);
  for (const rid of m.equips) {
    const r = CARDS[rid];
    atk += r.atk || 0;
    def += r.def || 0;
    (r.kw || []).forEach((k) => kw.add(k));
  }
  if (p.field) {
    const a = CARDS[p.field.id].aura;
    if (a && a.el === d.element) {
      atk += a.atk || 0;
      def += a.def || 0;
    }
  }
  return { atk: Math.max(0, atk), def: Math.max(0, def), kw: [...kw], element: d.element };
}

// ---------------------------------------------------------------------
//  Dasar-dasar
// ---------------------------------------------------------------------
function setWinner(s, w, reason) {
  if (s.winner) return;
  s.winner = w;
  s.reason = reason;
  log(s, `${s.names[w]} memenangkan duel! (${reason})`, w);
}

function drawCards(s, side, n) {
  const p = s.players[side];
  for (let i = 0; i < n; i++) {
    if (p.deck.length === 0) {
      setWinner(s, opp(side), 'Deck lawan habis');
      return;
    }
    const c = p.deck.pop();
    if (p.hand.length < HAND_LIMIT) {
      p.hand.push(c);
      emit(s, { type: 'draw', side });
    } else {
      p.grave.push(c);
      log(s, `Tangan penuh — ${CARDS[c.id].name} terbuang.`, side);
    }
  }
}

function damagePlayer(s, side, n) {
  if (n <= 0 || s.winner) return;
  const p = s.players[side];
  p.lp = Math.max(0, p.lp - n);
  emit(s, { type: 'lpdmg', side, value: n });
  if (p.lp <= 0) setWinner(s, opp(side), 'LP habis');
}

function healPlayer(s, side, n) {
  if (n <= 0) return;
  s.players[side].lp += n;
  emit(s, { type: 'lpheal', side, value: n });
}

function makeInst(s, id, pos = 'atk') {
  const d = CARDS[id];
  return {
    uid: nid(s), id, pos, hp: d.hp, maxHp: d.hp,
    bAtk: 0, bDef: 0, tAtk: 0, equips: [],
    shield: d.kw.includes('shield'),
    stun: 0, frozen: false, burn: 0, burnDmg: 0,
    sick: !d.kw.includes('haste'), acted: false,
  };
}

function destroyMonster(s, side, slot) {
  const p = s.players[side];
  const m = p.monsters[slot];
  if (!m) return;
  const d = CARDS[m.id];
  p.monsters[slot] = null;
  if (!d.token) p.grave.push({ uid: m.uid, id: m.id });
  m.equips.forEach((r) => p.grave.push({ uid: nid(s), id: r }));
  emit(s, { type: 'destroy', side, slot, icon: d.icon });
  log(s, `${d.name} hancur.`, side);
  if (d.onDeath) runFx(s, { side, src: null, element: d.element }, d.onDeath);
}

function damageMonster(s, side, slot, amount, o = {}) {
  const p = s.players[side];
  const m = p.monsters[slot];
  const res = { dealt: 0, killed: false, overflow: 0 };
  if (!m || amount <= 0) return res;
  const d = CARDS[m.id];
  if (m.shield) {
    m.shield = false;
    emit(s, { type: 'shield', side, slot });
    log(s, `Perisai ${d.name} menahan serangan!`, side);
    return res;
  }
  let dmg = amount;
  let mult = 1;
  if (o.element) {
    mult = elementMultiplier(o.element, d.element);
    dmg = round10(dmg * mult);
  }
  const before = m.hp;
  m.hp -= dmg;
  emit(s, { type: 'dmg', side, slot, value: dmg, mult });
  res.dealt = Math.min(dmg, before);
  res.overflow = Math.max(0, dmg - before);
  if (m.hp <= 0) {
    res.killed = true;
    destroyMonster(s, side, slot);
  }
  return res;
}

// ---------------------------------------------------------------------
//  Penyelesaian efek
// ---------------------------------------------------------------------
function resolveTargets(s, ctx, to) {
  const me = ctx.side;
  const foe = opp(me);
  const all = (side) => s.players[side].monsters.map((m, slot) => (m ? { side, slot } : null)).filter(Boolean);
  switch (to) {
    case 'T': return ctx.T ? [ctx.T] : [];
    case 'src': return ctx.src != null && s.players[me].monsters[ctx.src] ? [{ side: me, slot: ctx.src }] : [];
    case 'trig': return ctx.trig ? [ctx.trig] : [];
    case 'allEnemy': return all(foe);
    case 'allAlly': return all(me);
    case 'randEnemy': {
      const a = all(foe);
      return a.length ? [a[rand(a.length)]] : [];
    }
    case 'foe': return [{ side: foe, player: true }];
    case 'me': return [{ side: me, player: true }];
    default: return [];
  }
}

function runFx(s, ctx, list) {
  for (const e of list) {
    if (s.winner) return;
    applyOne(s, ctx, e);
  }
}

function applyOne(s, ctx, e) {
  const targets = e.to ? resolveTargets(s, ctx, e.to) : [];
  switch (e.op) {
    case 'dmg':
      for (const t of targets) {
        if (t.player) damagePlayer(s, t.side, e.n);
        else damageMonster(s, t.side, t.slot, e.n, { element: ctx.element });
      }
      break;
    case 'heal':
      for (const t of targets) {
        if (t.player) healPlayer(s, t.side, e.n);
        else {
          const m = s.players[t.side].monsters[t.slot];
          if (!m) continue;
          const add = Math.min(e.n, m.maxHp - m.hp);
          if (add > 0) {
            m.hp += add;
            emit(s, { type: 'heal', side: t.side, slot: t.slot, value: add });
          }
        }
      }
      break;
    case 'buff':
      for (const t of targets) {
        const m = s.players[t.side].monsters[t.slot];
        if (!m) continue;
        m.bAtk += e.atk || 0;
        m.bDef += e.def || 0;
        if (e.hp) { m.maxHp += e.hp; m.hp += e.hp; }
        emit(s, { type: 'buff', side: t.side, slot: t.slot, value: e.atk || e.def || e.hp });
      }
      break;
    case 'tbuff':
      for (const t of targets) {
        const m = s.players[t.side].monsters[t.slot];
        if (m) { m.tAtk += e.atk; emit(s, { type: 'buff', side: t.side, slot: t.slot, value: e.atk }); }
      }
      break;
    case 'draw':
      drawCards(s, ctx.side, e.n);
      break;
    case 'mana':
      s.players[ctx.side].mana += e.n;
      emit(s, { type: 'mana', side: ctx.side, value: e.n });
      break;
    case 'destroy':
      for (const t of targets) destroyMonster(s, t.side, t.slot);
      break;
    case 'stun':
      for (const t of targets) {
        const m = s.players[t.side].monsters[t.slot];
        if (m) { m.stun = Math.max(m.stun, 1); emit(s, { type: 'stun', side: t.side, slot: t.slot }); }
      }
      break;
    case 'burn':
      for (const t of targets) {
        const m = s.players[t.side].monsters[t.slot];
        if (m) { m.burn = 3; m.burnDmg = e.n; emit(s, { type: 'burn', side: t.side, slot: t.slot }); }
      }
      break;
    case 'shield':
      for (const t of targets) {
        const m = s.players[t.side].monsters[t.slot];
        if (m) { m.shield = true; emit(s, { type: 'shieldup', side: t.side, slot: t.slot }); }
      }
      break;
    case 'token': {
      const p = s.players[ctx.side];
      const slot = freeSlot(p.monsters);
      if (slot < 0) break;
      p.monsters[slot] = makeInst(s, e.id, 'atk');
      emit(s, { type: 'summon', side: ctx.side, slot });
      log(s, `${CARDS[e.id].name} muncul.`, ctx.side);
      break;
    }
    case 'revive': {
      const p = s.players[ctx.side];
      const slot = freeSlot(p.monsters);
      if (slot < 0) break;
      const opts = p.grave.map((c, i) => ({ c, i })).filter(({ c }) => CARDS[c.id].type === 'monster' && CARDS[c.id].cost <= e.max);
      if (!opts.length) break;
      const pick = opts[rand(opts.length)];
      p.grave.splice(pick.i, 1);
      const d = CARDS[pick.c.id];
      p.monsters[slot] = makeInst(s, pick.c.id, 'atk');
      emit(s, { type: 'summon', side: ctx.side, slot });
      log(s, `${d.name} bangkit dari kuburan!`, ctx.side);
      if (d.onSummon) runFx(s, { side: ctx.side, src: slot, element: d.element }, d.onSummon);
      break;
    }
    case 'negate':
      ctx.negated = true;
      break;
    case 'bounce':
      for (const t of targets) {
        const p = s.players[t.side];
        const m = p.monsters[t.slot];
        if (!m) continue;
        const d = CARDS[m.id];
        p.monsters[t.slot] = null;
        m.equips.forEach((r) => p.grave.push({ uid: nid(s), id: r }));
        if (!d.token && p.hand.length < HAND_LIMIT) p.hand.push({ uid: nid(s), id: m.id });
        else if (!d.token) p.grave.push({ uid: nid(s), id: m.id });
        emit(s, { type: 'bounce', side: t.side, slot: t.slot, icon: d.icon });
        log(s, `${d.name} dikembalikan ke tangan.`, t.side);
      }
      break;
    case 'discard': {
      const p = s.players[opp(ctx.side)];
      for (let i = 0; i < e.n && p.hand.length; i++) {
        const [c] = p.hand.splice(rand(p.hand.length), 1);
        p.grave.push(c);
        log(s, `${CARDS[c.id].name} dibuang dari tangan.`, opp(ctx.side));
      }
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------
//  Jebakan
// ---------------------------------------------------------------------
function fireTrap(s, owner, event, extra) {
  if (s.simNoTraps) return { fired: false, negated: false };
  const p = s.players[owner];
  const i = p.traps.findIndex((t) => t && CARDS[t.id].trigger === event);
  if (i < 0) return { fired: false, negated: false };
  const t = p.traps[i];
  p.traps[i] = null;
  p.grave.push(t);
  const d = CARDS[t.id];
  emit(s, { type: 'trap', side: owner, slot: i, id: d.id });
  emit(s, { type: 'cast', side: owner, id: d.id });
  log(s, `Jebakan ${d.name} aktif!`, owner);
  const ctx = { side: owner, src: null, T: null, element: d.element, negated: false, ...extra };
  runFx(s, ctx, d.fx);
  return { fired: true, negated: ctx.negated };
}

// ---------------------------------------------------------------------
//  Giliran
// ---------------------------------------------------------------------
function startTurn(s, side) {
  s.turn += 1;
  s.active = side;
  const p = s.players[side];
  p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
  p.mana = p.maxMana;
  log(s, `— Giliran ${s.turn}: ${s.names[side]} —`, side);
  emit(s, { type: 'turn', side });
  if (s.turn > 1) drawCards(s, side, 1);
  if (s.winner) return;

  p.monsters.forEach((m) => {
    if (!m) return;
    m.sick = false;
    m.acted = false;
    m.tAtk = 0;
    m.frozen = m.stun > 0;
    if (m.stun > 0) m.stun -= 1;
  });
  for (let slot = 0; slot < SLOTS; slot++) {
    const m = p.monsters[slot];
    if (m && m.burn > 0) {
      m.burn -= 1;
      damageMonster(s, side, slot, m.burnDmg, {});
    }
  }
  if (s.winner) return;
  if (p.field) {
    const f = CARDS[p.field.id];
    if (f.onStart) runFx(s, { side, src: null, element: f.element }, f.onStart);
  }
  for (let slot = 0; slot < SLOTS; slot++) {
    const m = p.monsters[slot];
    if (!m) continue;
    const d = CARDS[m.id];
    if (d.onStart) runFx(s, { side, src: slot, element: d.element }, d.onStart);
  }
}

function endTurn(s, side) {
  s.players[side].monsters.forEach((m) => { if (m) m.tAtk = 0; });
  startTurn(s, opp(side));
}

// ---------------------------------------------------------------------
//  Validasi
// ---------------------------------------------------------------------
export function canPlayCard(s, side, uid) {
  if (s.winner) return { ok: false, reason: 'Duel selesai' };
  if (s.active !== side) return { ok: false, reason: 'Bukan giliranmu' };
  const p = s.players[side];
  const e = s.players[opp(side)];
  const c = p.hand.find((x) => x.uid === uid);
  if (!c) return { ok: false, reason: 'Kartu tidak ada di tangan' };
  const d = CARDS[c.id];
  if (d.cost > p.mana) return { ok: false, reason: 'Energi tidak cukup' };
  if (d.type === 'monster' && freeSlot(p.monsters) < 0) return { ok: false, reason: 'Zona monster penuh' };
  if (d.type === 'trap' && freeSlot(p.traps) < 0) return { ok: false, reason: 'Zona jebakan penuh' };
  const need = d.type === 'relic' ? 'allyMonster' : d.type === 'spell' ? d.target : null;
  if (need === 'enemyMonster' && !e.monsters.some(Boolean)) return { ok: false, reason: 'Lawan tak punya monster' };
  if (need === 'allyMonster' && !p.monsters.some(Boolean)) return { ok: false, reason: 'Kamu tak punya monster' };
  return { ok: true, need };
}

function actorReady(s, side, slot) {
  if (s.winner || s.active !== side) return false;
  const m = s.players[side].monsters[slot];
  return !!m && !m.acted && !m.sick && !m.frozen;
}

export function whyCannotAct(s, side, slot) {
  const m = s.players[side].monsters[slot];
  if (!m) return 'Tidak ada monster';
  if (m.frozen) return 'Monster sedang membeku';
  if (m.sick) return 'Baru dipanggil (belum bisa beraksi)';
  if (m.acted) return 'Sudah beraksi giliran ini';
  return null;
}

export function canAttack(s, side, slot) {
  if (s.turn <= 1) return false;
  if (!actorReady(s, side, slot)) return false;
  return s.players[side].monsters[slot].pos === 'atk';
}

export function attackTargets(s, side, slot) {
  const eSide = opp(side);
  const mons = s.players[eSide].monsters.map((m, i) => (m ? i : -1)).filter((i) => i >= 0);
  if (!mons.length) return ['direct'];
  const taunts = mons.filter((i) => statsOf(s, eSide, i).kw.includes('taunt'));
  return taunts.length ? taunts : mons;
}

export function canSkill(s, side, slot) {
  if (!actorReady(s, side, slot)) return { ok: false, reason: whyCannotAct(s, side, slot) || 'Tidak bisa' };
  const m = s.players[side].monsters[slot];
  const sk = CARDS[m.id].skill;
  if (!sk) return { ok: false, reason: 'Tidak punya skill' };
  if (sk.cost > s.players[side].mana) return { ok: false, reason: 'Energi tidak cukup' };
  if (sk.t === 'enemyMonster' && !s.players[opp(side)].monsters.some(Boolean)) return { ok: false, reason: 'Tidak ada target' };
  if (sk.t === 'allyMonster' && !s.players[side].monsters.some(Boolean)) return { ok: false, reason: 'Tidak ada target' };
  return { ok: true, need: sk.t };
}

// ---------------------------------------------------------------------
//  Aksi
// ---------------------------------------------------------------------
function doPlay(s, side, a) {
  const chk = canPlayCard(s, side, a.uid);
  if (!chk.ok) return;
  const p = s.players[side];
  const eSide = opp(side);
  const idx = p.hand.findIndex((c) => c.uid === a.uid);
  const [card] = p.hand.splice(idx, 1);
  const d = CARDS[card.id];
  p.mana -= d.cost;
  emit(s, { type: 'cast', side, id: d.id, hidden: d.type === 'trap' });

  const targetOk = (tside, slot) => slot != null && !!s.players[tside].monsters[slot];

  if (d.type === 'monster') {
    const slot = a.slot != null && !p.monsters[a.slot] ? a.slot : freeSlot(p.monsters);
    const m = makeInst(s, d.id, a.pos === 'def' ? 'def' : 'atk');
    m.uid = card.uid;
    p.monsters[slot] = m;
    emit(s, { type: 'summon', side, slot });
    log(s, `${s.names[side]} memanggil ${d.name} (${m.pos === 'atk' ? 'Serang' : 'Bertahan'}).`, side);
    fireTrap(s, eSide, 'summon', { trig: { side, slot } });
    if (s.winner) return;
    if (p.monsters[slot] && p.monsters[slot].uid === card.uid && d.onSummon) {
      runFx(s, { side, src: slot, element: d.element }, d.onSummon);
    }
  } else if (d.type === 'spell') {
    const tside = d.target === 'allyMonster' ? side : eSide;
    let T = null;
    if (d.target) {
      if (!targetOk(tside, a.target)) { p.hand.splice(idx, 0, card); p.mana += d.cost; return; }
      T = { side: tside, slot: a.target };
    }
    log(s, `${s.names[side]} memainkan ${d.name}.`, side);
    const r = fireTrap(s, eSide, 'spell', {});
    if (r.negated) log(s, `${d.name} dibatalkan!`, side);
    else if (!s.winner) runFx(s, { side, src: null, T, element: d.element }, d.fx);
    p.grave.push(card);
  } else if (d.type === 'relic') {
    if (!targetOk(side, a.target)) { p.hand.splice(idx, 0, card); p.mana += d.cost; return; }
    const m = p.monsters[a.target];
    m.equips.push(d.id);
    if (d.hp) { m.maxHp += d.hp; m.hp += d.hp; }
    if (d.kw.includes('haste')) m.sick = false;
    if (d.kw.includes('shield')) m.shield = true;
    emit(s, { type: 'buff', side, slot: a.target, value: d.atk || d.def || d.hp });
    log(s, `${CARDS[m.id].name} memakai ${d.name}.`, side);
  } else if (d.type === 'trap') {
    const slot = freeSlot(p.traps);
    p.traps[slot] = card;
    emit(s, { type: 'trapset', side, slot });
    log(s, `${s.names[side]} memasang 1 jebakan.`, side);
  } else if (d.type === 'field') {
    if (p.field) p.grave.push(p.field);
    p.field = card;
    log(s, `${s.names[side]} mengaktifkan medan ${d.name}.`, side);
  }
}

function doAttack(s, side, slot, target) {
  if (!canAttack(s, side, slot)) return;
  if (!attackTargets(s, side, slot).includes(target)) return;
  const me = s.players[side];
  const eSide = opp(side);
  const foe = s.players[eSide];
  const m = me.monsters[slot];
  const d = CARDS[m.id];
  m.acted = true;

  emit(s, { type: 'attack', side, slot, target });
  log(s, `${d.name} menyerang${target === 'direct' ? ' langsung' : ` ${CARDS[foe.monsters[target].id].name}`}!`, side);

  const tr = fireTrap(s, eSide, 'attack', { trig: { side, slot } });
  if (s.winner) return;
  if (tr.negated) { log(s, 'Serangan dibatalkan!', side); return; }
  if (!me.monsters[slot] || me.monsters[slot].uid !== m.uid) return;

  if (d.onAttack) {
    runFx(s, { side, src: slot, element: d.element }, d.onAttack);
    if (s.winner || !me.monsters[slot]) return;
  }

  const A = statsOf(s, side, slot);
  if (target === 'direct') {
    damagePlayer(s, eSide, A.atk);
    if (A.kw.includes('lifesteal')) healPlayer(s, side, A.atk);
    return;
  }
  const t = foe.monsters[target];
  if (!t) return;
  const T = statsOf(s, eSide, target);
  const pierce = A.kw.includes('pierce');
  const raw = round10(A.atk * elementMultiplier(A.element, T.element));
  const toTarget = t.pos === 'def' && !pierce ? Math.max(0, raw - T.def) : raw;
  const counter = t.pos === 'atk' ? round10(T.atk * elementMultiplier(T.element, A.element)) : 0;

  if (toTarget === 0) {
    emit(s, { type: 'dmg', side: eSide, slot: target, value: 0, mult: 1 });
    log(s, `${CARDS[t.id].name} menahan serangan sepenuhnya.`, eSide);
  }
  const r = damageMonster(s, eSide, target, toTarget, {});
  if (A.kw.includes('lifesteal')) healPlayer(s, side, r.dealt);
  // kelebihan damage saat menghancurkan monster mengenai LP lawan (Tembus: penuh, lainnya: 50%)
  if (r.killed && r.overflow > 0 && t.pos === 'atk') damagePlayer(s, eSide, round10(r.overflow * (pierce ? 1 : 0.5)));
  else if (pierce && r.killed && r.overflow > 0) damagePlayer(s, eSide, r.overflow);
  if (counter > 0 && me.monsters[slot] && me.monsters[slot].uid === m.uid) {
    damageMonster(s, side, slot, counter, {});
  }
}

function doSkill(s, side, a) {
  const chk = canSkill(s, side, a.slot);
  if (!chk.ok) return;
  const p = s.players[side];
  const m = p.monsters[a.slot];
  const d = CARDS[m.id];
  const sk = d.skill;
  let T = null;
  if (sk.t) {
    const tside = sk.t === 'allyMonster' ? side : opp(side);
    if (a.target == null || !s.players[tside].monsters[a.target]) return;
    T = { side: tside, slot: a.target };
  }
  p.mana -= sk.cost;
  m.acted = true;
  emit(s, { type: 'skill', side, slot: a.slot, name: sk.name });
  log(s, `${d.name} memakai skill ${sk.name}!`, side);
  runFx(s, { side, src: a.slot, T, element: d.element }, sk.fx);
}

export function reduce(state, a, opts = {}) {
  const s = structuredClone(state);
  s.fx = [];
  if (s.winner) return s;
  s.simNoTraps = !!opts.sim;
  const side = a.side;
  switch (a.type) {
    case 'PLAY':
      doPlay(s, side, a);
      break;
    case 'ATTACK':
      doAttack(s, side, a.slot, a.target);
      break;
    case 'SKILL':
      doSkill(s, side, a);
      break;
    case 'TOGGLE': {
      if (s.active !== side) break;
      const m = s.players[side].monsters[a.slot];
      if (!m || m.acted) break;
      m.pos = m.pos === 'atk' ? 'def' : 'atk';
      m.acted = true;
      emit(s, { type: 'toggle', side, slot: a.slot });
      log(s, `${CARDS[m.id].name} berpindah ke posisi ${m.pos === 'atk' ? 'Serang' : 'Bertahan'}.`, side);
      break;
    }
    case 'END_TURN':
      if (s.active === side) endTurn(s, side);
      break;
    case 'CONCEDE':
      setWinner(s, opp(side), 'Menyerah');
      break;
    default:
      break;
  }
  s.simNoTraps = false;
  return s;
}

// Semua aksi legal untuk sebuah sisi (dipakai AI)
export function legalActions(s, side) {
  const acts = [];
  if (s.winner || s.active !== side) return acts;
  const p = s.players[side];
  const e = s.players[opp(side)];
  for (const c of p.hand) {
    const d = CARDS[c.id];
    const chk = canPlayCard(s, side, c.uid);
    if (!chk.ok) continue;
    if (d.type === 'monster') {
      acts.push({ type: 'PLAY', side, uid: c.uid, pos: 'atk' });
      acts.push({ type: 'PLAY', side, uid: c.uid, pos: 'def' });
    } else if (chk.need) {
      const pool = chk.need === 'allyMonster' ? p : e;
      pool.monsters.forEach((m, i) => m && acts.push({ type: 'PLAY', side, uid: c.uid, target: i }));
    } else acts.push({ type: 'PLAY', side, uid: c.uid });
  }
  p.monsters.forEach((m, slot) => {
    if (!m) return;
    const sc = canSkill(s, side, slot);
    if (sc.ok) {
      if (sc.need) {
        const pool = sc.need === 'allyMonster' ? p : e;
        pool.monsters.forEach((t, i) => t && acts.push({ type: 'SKILL', side, slot, target: i }));
      } else acts.push({ type: 'SKILL', side, slot });
    }
    if (canAttack(s, side, slot)) {
      for (const t of attackTargets(s, side, slot)) acts.push({ type: 'ATTACK', side, slot, target: t });
    }
  });
  acts.push({ type: 'END_TURN', side });
  return acts;
}
