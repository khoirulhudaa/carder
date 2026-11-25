import { CARDS } from '../data/cards.js';
import { statsOf } from '../engine/engine.js';

/**
 * Menjelaskan APA yang terjadi setelah satu aksi dan KENAPA.
 * Dibangun dari: aksi (a), keadaan sebelum (prev), keadaan sesudah (next),
 * dan daftar efek (next.fx) yang dihasilkan engine. Tidak mengubah engine.
 * Mengembalikan: [{ kind, side, text, cause?, turn }]
 *   kind: 'aksi' | 'giliran' | 'lp' | 'hp' | 'energi' | 'status' | 'kartu'
 */

const who = (s) => (s === 'player' ? 'kamu' : 'lawan');
const Who = (s) => (s === 'player' ? 'Kamu' : 'Lawan');
const other = (s) => (s === 'player' ? 'enemy' : 'player');
const sgn = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
const monAt = (g, side, slot) => g?.players?.[side]?.monsters?.[slot] || null;
const cname = (id) => CARDS[id]?.name || String(id);
const multText = (m) => {
  if (m == null || m === 1) return '';
  const v = +Number(m).toFixed(2);
  return m > 1 ? ` · elemen unggul ×${v}` : m > 0 ? ` · elemen lemah ×${v}` : '';
};

export function startEntries(g) {
  const me = g.players.player;
  return [
    {
      id: 0,
      kind: 'giliran',
      side: g.active,
      turn: g.turn,
      text: `Duel dimulai · ${g.active === 'player' ? 'kamu' : g.names?.enemy || 'lawan'} jalan duluan · LP ${me.lp} · energi ${me.mana}/${me.maxMana}`,
    },
  ];
}

export function explainAction(prev, next, a) {
  const out = [];
  const push = (kind, side, text, cause) => out.push({ kind, side, text, cause, turn: next.turn });

  const lp = { player: prev.players.player.lp, enemy: prev.players.enemy.lp };
  const hp = {};
  const touched = new Set(); // slot yang dipanggil/hancur/dikembalikan
  const lastCause = {};
  let cause = '';
  let baseCause = '';
  let attackCtx = null;
  let sawBounce = false;

  const mname = (side, slot) => {
    const m = monAt(prev, side, slot) || monAt(next, side, slot);
    return `${m ? cname(m.id) : 'Monster'} (${who(side)})`;
  };
  const hpNow = (side, slot) => {
    const k = `${side}:${slot}`;
    if (k in hp) return hp[k];
    const m = monAt(prev, side, slot) || monAt(next, side, slot);
    return m ? m.hp : 0;
  };
  const maxOf = (side, slot) => {
    const m = monAt(next, side, slot) || monAt(prev, side, slot);
    return m?.maxHp ?? Infinity;
  };

  /* ---------- 1. judul aksi + biaya energi ---------- */
  let cost = 0;
  let costWhat = '';
  const A = a.side;

  if (a.type === 'PLAY') {
    const card = prev.players[A].hand.find((c) => c.uid === a.uid);
    const d = card && CARDS[card.id];
    if (d) {
      cost = d.cost;
      costWhat = `Biaya memainkan ${d.name}`;
      cause = baseCause = `Kartu ${d.name}`;
      if (d.type === 'trap' && A === 'enemy') {
        push('aksi', A, 'Lawan memasang sebuah jebakan (tertutup)');
      } else if (d.type === 'monster') {
        push('aksi', A, `${Who(A)} memanggil ${d.name} (${a.pos === 'def' ? 'posisi bertahan' : 'posisi menyerang'})`);
      } else if (d.type === 'relic') {
        const t = a.target;
        const bonus = [d.atk && `ATK ${sgn(d.atk)}`, d.def && `DEF ${sgn(d.def)}`, d.hp && `HP ${sgn(d.hp)}`, ...(d.kw || [])].filter(Boolean).join(', ');
        push('aksi', A, `${Who(A)} memasang relik ${d.name}${t != null ? ` ke ${mname(A, t)}` : ''}${bonus ? `: ${bonus}` : ''}`);
      } else {
        let tgt = '';
        if (a.target != null && d.target) {
          const ts = d.target === 'allyMonster' ? A : other(A);
          tgt = ` ke ${mname(ts, a.target)}`;
        }
        push('aksi', A, `${Who(A)} memainkan ${d.name}${tgt}${d.type === 'field' && d.flavor ? ` — ${d.flavor}` : ''}`);
      }
    }
  } else if (a.type === 'SKILL') {
    const m = monAt(prev, A, a.slot);
    const d = m && CARDS[m.id];
    if (d?.skill) {
      cost = d.skill.cost;
      costWhat = `Biaya skill ${d.skill.name}`;
      cause = baseCause = `Skill ${d.skill.name} dari ${d.name} (${who(A)})`;
      push('aksi', A, `${d.name} (${who(A)}) memakai skill ${d.skill.name}`);
    }
  } else if (a.type === 'ATTACK') {
    const am = monAt(prev, A, a.slot);
    const ad = am && CARDS[am.id];
    const opp = other(A);
    let ast = null;
    try { ast = statsOf(prev, A, a.slot); } catch { /* abaikan */ }
    if (ad) {
      if (a.target === 'direct') {
        push('aksi', A, `${ad.name} (${who(A)}) menyerang langsung LP ${who(opp)}${ast ? ` dengan ATK ${ast.atk}` : ''}`);
        cause = baseCause = `Serangan langsung dari ${ad.name} (${who(A)})`;
        attackCtx = { slot: a.slot, targetName: 'LP ' + who(opp) };
      } else {
        const tm = monAt(prev, opp, a.target);
        const td = tm && CARDS[tm.id];
        let tst = null;
        try { tst = statsOf(prev, opp, a.target); } catch { /* abaikan */ }
        push(
          'aksi',
          A,
          `${ad.name} (${who(A)}) menyerang ${td ? td.name : 'monster'} (${who(opp)})${ast && tst ? ` · ATK ${ast.atk} vs DEF ${tst.def}` : ''}${tm?.pos === 'def' ? ' · target bertahan' : ''}`,
        );
        cause = baseCause = `Diserang ${ad.name} (${who(A)})`;
        attackCtx = { slot: a.slot, targetName: td ? td.name : 'monster' };
      }
    }
  } else if (a.type === 'TOGGLE') {
    const m = monAt(prev, A, a.slot);
    if (m) push('aksi', A, `${cname(m.id)} (${who(A)}) berganti ke posisi ${m.pos === 'atk' ? 'bertahan' : 'menyerang'}`);
  } else if (a.type === 'END_TURN') {
    cause = baseCause = 'Awal giliran';
  } else if (a.type === 'CONCEDE') {
    push('aksi', A, `${Who(A)} menyerah`);
  }

  // energi untuk PLAY / SKILL (dan perubahan lain di luar END_TURN)
  if (a.type !== 'END_TURN') {
    ['player', 'enemy'].forEach((s) => {
      const p = prev.players[s];
      const n = next.players[s];
      const c = s === A && (a.type === 'PLAY' || a.type === 'SKILL') ? cost : 0;
      const dm = n.mana - p.mana;
      if (c) push('energi', s, `Energi ${who(s)} −${c} (${p.mana}→${p.mana - c}/${p.maxMana})`, costWhat);
      const resid = dm + c;
      if (resid) push('energi', s, `Energi ${who(s)} ${sgn(resid)} (${p.mana - c}→${n.mana}/${n.maxMana})`, cause ? `Efek dari ${cause.toLowerCase()}` : 'Efek kartu');
      if (n.maxMana !== p.maxMana) push('energi', s, `Energi maksimum ${who(s)} ${p.maxMana}→${n.maxMana}`, cause || 'Efek kartu');
    });
  }

  /* ---------- 2. efek berurutan dari engine ---------- */
  for (const e of next.fx || []) {
    const k = `${e.side}:${e.slot}`;
    switch (e.type) {
      case 'turn': {
        push('giliran', e.side, `Giliran ${next.turn} · ${who(e.side)}`);
        cause = baseCause = 'Awal giliran';
        const p = prev.players[e.side];
        const n = next.players[e.side];
        if (a.type === 'END_TURN') {
          push(
            'energi',
            e.side,
            `Energi ${who(e.side)} ${p.mana}→${n.mana}/${n.maxMana}${n.maxMana !== p.maxMana ? ` (maksimum ${p.maxMana}→${n.maxMana})` : ''}`,
            n.mana > p.mana ? 'Awal giliran: energi terisi kembali' : 'Awal giliran',
          );
        }
        break;
      }
      case 'skill':
        cause = `Skill ${e.name}`;
        break;
      case 'cast': {
        if (!e.hidden && CARDS[e.id]) cause = `Kartu ${CARDS[e.id].name}`;
        break;
      }
      case 'trap': {
        const d = CARDS[e.id];
        push('aksi', e.side, `Jebakan ${d ? d.name : ''} milik ${who(e.side)} aktif${d?.flavor ? ` — ${d.flavor}` : ''}`);
        cause = `Jebakan ${d ? d.name : ''} (${who(e.side)})`;
        break;
      }
      case 'summon': {
        touched.add(k);
        const m = monAt(next, e.side, e.slot);
        if (m) {
          hp[k] = m.maxHp ?? m.hp;
          const d = CARDS[m.id];
          if (a.type !== 'PLAY' || d?.type !== 'monster') push('hp', e.side, `${cname(m.id)} (${who(e.side)}) muncul di papan`, cause);
          if (d?.onSummon) cause = `Efek saat dipanggil: ${d.name}`;
        }
        break;
      }
      case 'dmg':
      case 'lpdmg': {
        if (e.type === 'lpdmg' || e.slot == null) {
          const from = lp[e.side];
          const to = from - e.value;
          lp[e.side] = to;
          push('lp', e.side, `LP ${who(e.side)} −${e.value} (${from}→${to})${multText(e.mult)}`, cause);
        } else if (e.value > 0) {
          const from = hpNow(e.side, e.slot);
          const to = Math.max(0, from - e.value);
          hp[k] = to;
          let c = cause;
          const pm = monAt(prev, e.side, e.slot);
          if (a.type === 'END_TURN' && pm?.burn > 0) c = 'Terbakar (damage di awal giliran)';
          else if (attackCtx && e.side === A && e.slot === attackCtx.slot) c = `Serangan balik dari ${attackCtx.targetName}`;
          lastCause[k] = c;
          push('hp', e.side, `${mname(e.side, e.slot)} −${e.value} HP (${from}→${to})${multText(e.mult)}`, c);
        } else {
          push('hp', e.side, `${mname(e.side, e.slot)} tidak terkena damage (serangan diblok)`, cause);
        }
        break;
      }
      case 'heal':
      case 'lpheal': {
        if (e.type === 'lpheal' || e.slot == null) {
          const from = lp[e.side];
          const to = from + e.value;
          lp[e.side] = to;
          push('lp', e.side, `LP ${who(e.side)} +${e.value} (${from}→${to})`, cause);
        } else {
          const from = hpNow(e.side, e.slot);
          const to = Math.min(maxOf(e.side, e.slot), from + e.value);
          hp[k] = to;
          push('hp', e.side, `${mname(e.side, e.slot)} +${e.value} HP (${from}→${to})`, cause);
        }
        break;
      }
      case 'buff':
        push('status', e.side, `${mname(e.side, e.slot)} diperkuat${e.value ? ` (+${e.value})` : ''}`, cause);
        break;
      case 'shield':
        push('status', e.side, `Perisai ${mname(e.side, e.slot)} menahan serangan lalu hilang`, cause);
        break;
      case 'shieldup':
        push('status', e.side, `${mname(e.side, e.slot)} mendapat perisai: menahan 1 serangan berikutnya`, cause);
        break;
      case 'stun':
        push('status', e.side, `${mname(e.side, e.slot)} terkena beku: tidak bisa beraksi sementara`, cause);
        break;
      case 'burn':
        push('status', e.side, `${mname(e.side, e.slot)} terbakar: menerima damage tiap awal giliran`, cause);
        break;
      case 'bounce':
        touched.add(k);
        sawBounce = true;
        push('hp', e.side, `${mname(e.side, e.slot)} dikembalikan ke tangan pemiliknya`, cause);
        break;
      case 'destroy': {
        touched.add(k);
        const m = monAt(prev, e.side, e.slot) || monAt(next, e.side, e.slot);
        push('hp', e.side, `${mname(e.side, e.slot)} hancur`, lastCause[k] || cause);
        if (m && CARDS[m.id]?.onDeath) cause = `Efek saat hancur: ${CARDS[m.id].name}`;
        break;
      }
      default:
        break;
    }
  }

  /* ---------- 3. selisih yang belum dijelaskan ---------- */
  ['player', 'enemy'].forEach((s) => {
    for (let i = 0; i < 3; i += 1) {
      const k = `${s}:${i}`;
      const pm = monAt(prev, s, i);
      const nm = monAt(next, s, i);
      if (touched.has(k)) continue;
      if (pm && !nm) {
        push('hp', s, `${mname(s, i)} hancur: HP habis`, lastCause[k] || baseCause || 'Pertarungan');
      } else if (pm && nm && pm.id === nm.id) {
        const cur = k in hp ? hp[k] : pm.hp;
        if (cur !== nm.hp) push('hp', s, `${mname(s, i)} HP ${sgn(nm.hp - cur)} (${cur}→${nm.hp})`, baseCause || 'Efek lain');
      }
    }
    const diff = next.players[s].lp - lp[s];
    if (diff) push('lp', s, `LP ${who(s)} ${sgn(diff)} (${lp[s]}→${next.players[s].lp})`, baseCause || 'Efek lain');
  });

  /* ---------- 4. perubahan tangan ---------- */
  ['player', 'enemy'].forEach((s) => {
    const ph = prev.players[s].hand;
    const nh = next.players[s].hand;
    const pu = new Set(ph.map((c) => c.uid));
    const nu = new Set(nh.map((c) => c.uid));
    const added = nh.filter((c) => !pu.has(c.uid));
    const removed = ph.filter((c) => !nu.has(c.uid) && !(s === A && a.type === 'PLAY' && c.uid === a.uid));
    const list = (arr) => (s === 'player' ? arr.map((c) => cname(c.id)).join(', ') : `${arr.length} kartu`);
    if (added.length)
      push('kartu', s, s === 'player' ? `Kamu mendapat kartu: ${list(added)}` : `Lawan mendapat ${added.length} kartu`, sawBounce ? 'Monster kembali ke tangan' : a.type === 'END_TURN' ? 'Menarik kartu di awal giliran' : baseCause || 'Efek kartu');
    if (removed.length) push('kartu', s, s === 'player' ? `Kamu kehilangan kartu dari tangan: ${list(removed)}` : `Lawan kehilangan ${removed.length} kartu dari tangan`, baseCause || 'Efek kartu');
  });

  if (next.winner && !prev.winner) {
    push('giliran', next.winner, `Duel selesai: ${next.reason || ''} — ${next.winner === 'player' ? 'kamu menang' : 'kamu kalah'}`);
  }
  return out;
}