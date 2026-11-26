import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flag, Hand, Layers, ScrollText, Swords, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Card from '../components/Card.jsx';
import CutIns from '../components/CutIn.jsx';
import DuelLog from '../components/duelLog.jsx';
import MonsterTile, { Floats, TILE_SIZE } from '../components/MonsterTile.jsx';
import { CARDS } from '../data/cards.js';
import { describeCard } from '../data/describe.js';
import { KEYWORDS } from '../data/effects.js';
import { ELEMENTS } from '../data/elements.js';
import { chooseAction } from '../engine/ai.js';
import { MAX_MANA, RARITY, START_LP, TYPE_NAMES } from '../engine/constants.js';
import {
  attackTargets,
  canAttack,
  canPlayCard,
  canSkill,
  createGame, reduce,
  statsOf, whyCannotAct,
} from '../engine/engine.js';
import { explainAction, startEntries } from '../lib/explain.js';
import { sfx } from '../lib/sfx.js';
import { sfxx } from '../lib/sfxfx.js';
import { makeFxRunner } from '../lib/vfx.js';
import { useStore } from '../store/useStore.js';

/* ------------------------------------------------------------------ */
/*  Komponen kecil                                                    */
/* ------------------------------------------------------------------ */
function PlayerBar({ g, side, floats, flash, active }) {
  const p = g.players[side];
  const pct = Math.max(0, (p.lp / START_LP) * 100);
  return (
    <div
      data-fx={`${side}:lp`}
      className={clsx(
        'relative flex items-center gap-2.5 rounded-xl border bg-[#0f1218]/90 px-2.5 py-1.5 transition',
        active ? 'border-indigo-300/45' : 'border-white/[0.08]',
        flash && `fx-${flash}`,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="min-w-0 truncate text-xs font-semibold sm:text-sm">{g.names[side]}</span>
          <div className="ml-auto flex items-center gap-2.5 text-[10px] text-slate-300 sm:text-xs">
            <span className="flex items-center gap-[2px]" title="Energi">
              {Array.from({ length: MAX_MANA }).map((_, i) => (
                <span
                  key={i}
                  className={clsx(
                    'h-2 w-2 rounded-full border sm:h-2.5 sm:w-2.5',
                    i < p.mana ? 'border-indigo-300 bg-indigo-400' : i < p.maxMana ? 'border-indigo-400/60 bg-transparent' : 'border-white/10 bg-white/5',
                  )}
                />
              ))}
              <b className="ml-1 tabular-nums">{p.mana}/{p.maxMana}</b>
            </span>
            <span className="flex items-center gap-1" title="Deck">
              <Layers size={11} /> {p.deck.length}
            </span>
            <span className="flex items-center gap-1" title="Tangan">
              <Hand size={11} /> {p.hand.length}
            </span>
          </div>
          <span className="font-display text-sm font-extrabold tabular-nums sm:text-base">
            {p.lp} <span className="text-[10px] font-normal text-slate-400">LP</span>
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-rose-400/90" animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>
      <Floats items={floats} />
    </div>
  );
}

function Strip({ g, side, onInspect }) {
  const p = g.players[side];
  const fieldCard = p.field ? CARDS[p.field.id] : null;
  return (
    <div className="flex items-center justify-between gap-2 px-1 text-[10px] lg:text-xs">
      <button
        className={clsx('chip !px-2 !py-0.5', !fieldCard && 'opacity-30')}
        onClick={() => fieldCard && onInspect({ cardId: fieldCard.id })}
        onMouseEnter={() => fieldCard && onInspect({ cardId: fieldCard.id }, true)}
      >
        {fieldCard ? fieldCard.name : 'Medan —'}
      </button>
      <div className="flex items-center gap-1">
        <span className="text-slate-500">Jebakan</span>
        {p.traps.map((t, i) => (
          <button
            key={i}
            disabled={!t || side === 'enemy'}
            onClick={() => t && side === 'player' && onInspect({ cardId: t.id })}
            className={clsx(
              'flex h-6 w-5 items-center justify-center rounded border text-[11px] lg:h-7 lg:w-6',
              t ? 'border-indigo-300/50 bg-indigo-400/15' : 'border-white/10 bg-white/5 opacity-40',
            )}
            title={t ? (side === 'player' ? CARDS[t.id].name : 'Jebakan tertutup') : 'Kosong'}
          >
            {t ? (side === 'player' ? CARDS[t.id].icon : '?') : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slot({ g, side, slot, sel, mode, floats, flash, attacking, onClick, onHover }) {
  const m = g.players[side].monsters[slot];
  const key = `${side}:${slot}`;
  const targetable = !!mode?.valid.some((v) => v.side === side && v.slot === slot);
  return (
    <div data-fx={key} className={clsx('relative', TILE_SIZE)} style={{ width: '9em', height: '10.5em' }}>
      {m ? (
        <MonsterTile
          inst={m}
          stats={statsOf(g, side, slot)}
          side={side}
          selected={sel?.kind === 'mon' && sel.side === side && sel.slot === slot}
          targetable={targetable}
          flash={flash[key]}
          attack={attacking?.key === key ? attacking : null}
          onClick={() => onClick(side, slot)}
          onHover={(v) => onHover(v ? { ...v, slot } : null)}
        />
      ) : (
        <div className="absolute inset-0 rounded-[0.7em] border border-dashed border-white/10 bg-white/[0.02]" />
      )}
      <Floats items={floats.filter((f) => f.key === key)} />
    </div>
  );
}

function InstanceInfo({ g, side, slot }) {
  const m = g.players[side]?.monsters[slot];
  if (!m) return null;
  const st = statsOf(g, side, slot);
  const d = CARDS[m.id];
  const flags = [];
  if (m.pos === 'def') flags.push('Bertahan');
  if (m.shield) flags.push('Perisai');
  if (m.frozen) flags.push('Membeku');
  else if (m.stun > 0) flags.push('Akan membeku');
  if (m.burn > 0) flags.push(`Terbakar ${m.burnDmg}×${m.burn}`);
  if (m.sick) flags.push('Baru dipanggil');
  if (m.acted) flags.push('Sudah beraksi');
  m.equips.forEach((r) => flags.push(`Relik: ${CARDS[r].name}`));
  return (
    <div className="space-y-1 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2 text-xs">
      <div className="flex justify-between font-bold">
        <span className={st.atk > d.atk ? 'text-emerald-300' : 'text-white'}>ATK {st.atk}</span>
        <span className={st.def > d.def ? 'text-emerald-300' : 'text-white'}>DEF {st.def}</span>
        <span className="text-white">HP {m.hp}/{m.maxHp}</span>
      </div>
      {flags.length > 0 && <p className="text-slate-300">{flags.join(' · ')}</p>}
    </div>
  );
}

function Btn({ children, onClick, primary, danger, disabled, className }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={clsx('btn w-full !px-2 text-center text-[13px] leading-tight', primary && 'btn-primary', danger && 'btn-danger', className)}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Kartu Hadiah (ala Pokémon TCG)                                    */
/*  Sebelum duel, tiap pemain menyisihkan PRIZE_COUNT kartu dari deck. */
/*  Monster lawan hancur -> ambil 1 hadiah (monster GX/EX = 2).        */
/* ------------------------------------------------------------------ */
const PRIZE_COUNT = 3;
const PRIZE_TAGS = ['GX', 'EX'];

function setupPrizes(g0) {
  const prizes = { player: [], enemy: [] };
  const players = { ...g0.players };
  ['player', 'enemy'].forEach((side) => {
    const p = g0.players[side];
    const n = Math.min(PRIZE_COUNT, Math.max(0, p.deck.length - 5));
    prizes[side] = p.deck.slice(0, n);
    players[side] = { ...p, deck: p.deck.slice(n) };
  });
  return { g: { ...g0, players }, prizes };
}

function giveToHand(g, side, cards) {
  const p = g.players[side];
  return { ...g, players: { ...g.players, [side]: { ...p, hand: [...p.hand, ...cards] } } };
}

// Bandingkan state sebelum & sesudah aksi: monster yang lenyap (bukan kembali ke tangan) = hancur.
function countKills(prev, next) {
  const out = { player: { n: 0, names: [] }, enemy: { n: 0, names: [] } };
  ['player', 'enemy'].forEach((owner) => {
    const taker = owner === 'player' ? 'enemy' : 'player';
    const pm = prev.players[owner].monsters;
    const nm = next.players[owner].monsters;
    const countIn = (hand, id) => hand.filter((x) => x.id === id).length;
    pm.forEach((m, slot) => {
      if (!m) return;
      const n = nm[slot];
      if (n && n.id === m.id && (n.uid == null || n.uid === m.uid)) return;
      if (countIn(next.players[owner].hand, m.id) > countIn(prev.players[owner].hand, m.id)) return; // bounce
      const d = CARDS[m.id];
      if (!d || d.token) return;
      out[taker].n += PRIZE_TAGS.includes(d.tag) ? 2 : 1;
      out[taker].names.push(d.name);
    });
  });
  return out;
}

function PrizePile({ cards, pending, mine, onTake }) {
  const canTake = mine && pending > 0;
  return (
    <div className="flex shrink-0 flex-col items-center gap-1" title="Kartu Hadiah">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Hadiah</span>
      <div className="flex flex-col gap-1">
        {Array.from({ length: PRIZE_COUNT }).map((_, i) => {
          const c = cards[i];
          return c ? (
            <button
              key={c.uid ?? i}
              disabled={!canTake}
              onClick={() => onTake(i)}
              aria-label="Ambil kartu hadiah"
              className={clsx(
                'relative h-8 w-6 rounded-[4px] border bg-gradient-to-br from-indigo-400/50 to-indigo-900/70 transition sm:h-9 sm:w-[26px]',
                canTake ? 'animate-pulse cursor-pointer border-amber-300 shadow-[0_0_8px_rgba(252,211,77,.7)] hover:-translate-y-0.5' : 'border-white/15',
              )}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/70">★</span>
            </button>
          ) : (
            <div key={`e${i}`} className="h-8 w-6 rounded-[4px] border border-dashed border-white/10 sm:h-9 sm:w-[26px]" />
          );
        })}
      </div>
      {canTake && <span className="text-[10px] font-bold text-amber-300">Ambil {pending}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Layar duel                                                        */
/* ------------------------------------------------------------------ */
// Skala tile mengikuti tinggi layar supaya 2 baris monster + bar + tangan selalu muat
// tanpa scroll. Kalau --u sudah kamu atur di CSS, hapus properti style pada <main>.
const BOARD_UNIT = 'clamp(5px, calc((100dvh - 300px) / 23), min(11px, 1.6vw))';

export default function Duel({ config, onExit, onRematch }) {
  const [init] = useState(() =>
    setupPrizes(
      createGame({
        playerDeck: config.deck,
        enemyDeck: config.enemyDeck,
        playerName: config.playerName,
        enemyName: config.enemy.name.split(',')[0],
        enemyAvatar: config.enemy.avatar,
      }),
    ),
  );
  const [g, setG] = useState(init.g);
  const gRef = useRef(init.g);
  const [prizes, setPrizes] = useState(init.prizes);
  const [pending, setPending] = useState({ player: 0, enemy: 0 });
  const prizesRef = useRef(init.prizes);
  const pendingRef = useRef({ player: 0, enemy: 0 });
  const [detail, setDetail] = useState(() => startEntries(init.g));
  const detailId = useRef(0);
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState(null);
  const [hover, setHover] = useState(null);
  const [floats, setFloats] = useState([]);
  const [flash, setFlash] = useState({});
  const [attacking, setAttacking] = useState(null);
  const [banner, setBanner] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [reward, setReward] = useState(null);
  const doneRef = useRef(false);
  const logRef = useRef(null);
  const idRef = useRef(0);
  const [cutIns, setCutIns] = useState([]);
  const cutRef = useRef(0);

  /* ---------- efek visual ---------- */
  // karakter kartu muncul dari pinggir layar (maks. 2 sekaligus)
  const pushCut = useCallback((item) => {
    if (!item.cardId) return;
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = ++cutRef.current;
    setCutIns((l) => [...l.slice(-1), { ...item, id }]);
    setTimeout(() => setCutIns((l) => l.filter((x) => x.id !== id)), item.kind === 'big' ? 1300 : 850);
  }, []);
  const addFloat = useCallback((key, text, color) => {
    const id = ++idRef.current;
    setFloats((f) => [...f, { id, key, text, color }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1250);
  }, []);
  const setFlashFor = useCallback((key, kind) => {
    setFlash((f) => ({ ...f, [key]: kind }));
    setTimeout(() => setFlash((f) => { const n = { ...f }; if (n[key] === kind) delete n[key]; return n; }), 500);
  }, []);

  const processFx = useCallback(
    (list, prevState) => {
      const runFx = makeFxRunner(() => gRef.current, prevState);
      const monId = (side, slot) => gRef.current.players[side].monsters[slot]?.id ?? prevState?.players[side].monsters[slot]?.id;
      list.forEach((e, i) => {
        setTimeout(() => {
          try { runFx(e, i, list); } catch (err) { /* animasi tidak boleh mengganggu duel */ }
          const key = e.slot != null ? `${e.side}:${e.slot}` : `${e.side}:lp`;
          switch (e.type) {
            case 'dmg':
              addFloat(key, e.value > 0 ? `-${e.value}${e.mult > 1 ? ' ▲' : e.mult < 1 ? ' ▼' : ''}` : 'Blok', e.mult > 1 ? '#fb923c' : '#f87171');
              setFlashFor(key, 'dmg'); if (e.value > 0) sfx.hit(); else sfxx.defend(); break;
            case 'heal': addFloat(key, `+${e.value}`, '#4ade80'); setFlashFor(key, 'heal'); sfx.heal(); break;
            case 'lpdmg': addFloat(`${e.side}:lp`, `-${e.value}`, '#f87171'); setFlashFor(`${e.side}:lp`, 'dmg'); sfx.hit(); break;
            case 'lpheal': addFloat(`${e.side}:lp`, `+${e.value}`, '#4ade80'); setFlashFor(`${e.side}:lp`, 'heal'); sfx.heal(); break;
            case 'buff': addFloat(key, e.value ? `+${e.value}` : '▲', '#fde047'); setFlashFor(key, 'buff'); sfx.buff(); break;
            case 'shield': addFloat(key, 'Tertahan', '#93c5fd'); sfxx.defend(); break;
            case 'shieldup': addFloat(key, 'Perisai', '#93c5fd'); sfxx.defend(); break;
            case 'stun': addFloat(key, 'Beku', '#7dd3fc'); break;
            case 'burn': addFloat(key, 'Terbakar', '#fb923c'); break;
            case 'summon': setFlashFor(key, 'summon'); sfxx.summon(CARDS[monId(e.side, e.slot)]?.element, CARDS[monId(e.side, e.slot)]?.rarity); pushCut({ kind: 'big', side: e.side, cardId: monId(e.side, e.slot), label: 'Panggil!' }); break;
            case 'destroy': addFloat(key, 'Hancur', '#f87171'); sfx.destroy(); break;
            case 'bounce': addFloat(key, 'Kembali ke tangan', '#a5f3fc'); break;
            case 'attack': setAttacking({ key: `${e.side}:${e.slot}`, id: Math.random() }); sfxx.attack(CARDS[monId(e.side, e.slot)]?.element); setTimeout(() => setAttacking(null), 500); pushCut({ kind: 'peek', side: e.side, cardId: monId(e.side, e.slot) }); break;
            case 'skill': addFloat(key, e.name, '#c4b5fd'); sfxx.skill(CARDS[monId(e.side, e.slot)]?.element); pushCut({ kind: 'big', side: e.side, cardId: monId(e.side, e.slot), label: e.name }); break;
            case 'cast': if (!e.hidden) { setBanner({ id: Math.random(), cardId: e.id, side: e.side }); sfxx.cast(CARDS[e.id]?.element, CARDS[e.id]?.rarity); pushCut({ kind: 'peek', side: e.side, cardId: e.id }); } break;
            case 'trap': setBanner({ id: Math.random(), cardId: e.id, side: e.side, trap: true }); break;
            case 'draw': if (e.side === 'player') sfx.draw(); break;
            case 'turn': setBanner({ id: Math.random(), text: e.side === 'player' ? 'Giliranmu' : 'Giliran Lawan' }); sfx.turn(); break;
            default: break;
          }
        }, i * 150);
      });
    },
    [addFloat, setFlashFor, pushCut],
  );

  useEffect(() => {
    if (!banner) return undefined;
    const t = setTimeout(() => setBanner(null), banner.cardId ? 1400 : 1000);
    return () => clearTimeout(t);
  }, [banner]);

  useEffect(() => {
    const first = gRef.current.active;
    setBanner({ id: 1, text: first === 'player' ? 'Kamu jalan duluan!' : `${gRef.current.names.enemy} jalan duluan` });
  }, []);

  /* ---------- aksi ---------- */
  const act = useCallback(
    (a) => {
      const prev = gRef.current;
      let next = reduce(prev, a);
      if (a.type === 'TOGGLE') sfxx.toggle(next.players[a.side]?.monsters[a.slot]?.pos);

      // hadiah: monster lawan hancur -> pelaku mengambil hadiah (AI otomatis, pemain memilih sendiri)
      const earned = next.winner ? { player: { n: 0, names: [] }, enemy: { n: 0, names: [] } } : countKills(prev, next);
      const prizeLog = [];
      ['player', 'enemy'].forEach((side) => {
        const room = prizesRef.current[side].length - (side === 'player' ? pendingRef.current.player : 0);
        const n = Math.min(earned[side].n, Math.max(0, room));
        if (n <= 0) return;
        if (side === 'enemy') {
          const list = [...prizesRef.current.enemy];
          const got = [];
          for (let i = 0; i < n; i += 1) got.push(list.splice(Math.floor(Math.random() * list.length), 1)[0]);
          prizesRef.current = { ...prizesRef.current, enemy: list };
          next = giveToHand(next, 'enemy', got);
          sfxx.prize(CARDS[got[0]?.id]?.rarity);
        } else {
          pendingRef.current = { ...pendingRef.current, player: pendingRef.current.player + n };
        }
        prizeLog.push({
          id: ++detailId.current,
          kind: 'kartu',
          side,
          text: `${side === 'player' ? 'Kamu' : prev.names.enemy} mendapat ${n} kartu hadiah`,
          cause: `${earned[side].names.join(', ')} hancur${side === 'player' ? ' — pilih kartu hadiah di samping papan' : ''}`,
        });
        addFloat(`${side}:lp`, `+${n} Hadiah`, '#fde047');
      });
      if (prizeLog.length) {
        setPrizes(prizesRef.current);
        setPending(pendingRef.current);
        setDetail((d) => [...d, ...prizeLog].slice(-300));
        sfx.draw();
      }

      gRef.current = next;
      setG(next);
      try {
        const items = explainAction(prev, next, a).map((it) => ({ ...it, id: ++detailId.current }));
        if (items.length) setDetail((d) => [...d, ...items].slice(-300));
      } catch (err) {
        /* penjelasan tidak boleh mengganggu jalannya duel */
      }
      if (a.side === 'player') { setSel(null); setMode(null); }
      processFx(next.fx, prev);
    },
    [processFx, addFloat],
  );

  // pemain memilih kartu hadiah (tertutup) untuk diambil ke tangan
  const takePrize = (idx) => {
    if (pendingRef.current.player <= 0) return;
    const list = prizesRef.current.player;
    const card = list[idx];
    if (!card) return;
    prizesRef.current = { ...prizesRef.current, player: list.filter((_, i) => i !== idx) };
    pendingRef.current = { ...pendingRef.current, player: pendingRef.current.player - 1 };
    setPrizes(prizesRef.current);
    setPending(pendingRef.current);
    const next = giveToHand(gRef.current, 'player', [card]);
    gRef.current = next;
    setG(next);
    setDetail((d) => [...d, { id: ++detailId.current, kind: 'kartu', side: 'player', text: `Kamu mengambil hadiah: ${CARDS[card.id]?.name ?? 'kartu'}` }].slice(-300));
    addFloat('player:lp', `+${CARDS[card.id]?.name ?? 'Kartu'}`, '#fde047');
    sfxx.prize(CARDS[card.id]?.rarity);
  };

  // AI lawan
  useEffect(() => {
    if (g.winner || g.active !== 'enemy') return undefined;
    const t = setTimeout(() => {
      const a = chooseAction(gRef.current, 'enemy', config.difficulty);
      act(a);
    }, 900);
    return () => clearTimeout(t);
  }, [g, act, config.difficulty]);

  // hasil akhir
  useEffect(() => {
    if (g.winner && !doneRef.current) {
      doneRef.current = true;
      const won = g.winner === 'player';
      setReward(useStore.getState().finishDuel(won, config.difficulty));
      setTimeout(() => (won ? sfx.win() : sfx.lose()), 400);
    }
  }, [g.winner, config.difficulty]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [g.log.length, showLog]);

  // sidebar kanan tanpa scroll: bagian paling atas terpotong, entri terbaru selalu terlihat
  const rightRef = useRef(null);
  const stickLog = useCallback(() => {
    const r = rightRef.current;
    if (!r) return;
    r.querySelectorAll('*').forEach((el) => {
      if (el.scrollHeight > el.clientHeight + 1) el.scrollTop = el.scrollHeight;
    });
  }, []);
  useEffect(() => {
    stickLog();
    const t = setTimeout(stickLog, 60);
    return () => clearTimeout(t);
  }, [detail.length, g.log.length, stickLog]);

  /* ---------- turunan ---------- */
  const me = g.players.player;
  const myTurn = g.active === 'player' && !g.winner;

  /* ---------- tangan: paginasi panah (tanpa scroll) ---------- */
  const handBox = useRef(null);
  const stepRef = useRef(0);
  const [perPage, setPerPage] = useState(7);
  const [handPage, setHandPage] = useState(0);

  useLayoutEffect(() => {
    const box = handBox.current;
    if (!box) return undefined;
    const calc = () => {
      const row = box.querySelector('[data-hand-row]');
      const items = row?.children;
      if (!items || items.length === 0) return;
      const w = items[0].offsetWidth;
      if (items.length >= 2) stepRef.current = items[1].offsetLeft - items[0].offsetLeft;
      else if (!stepRef.current) stepRef.current = w;
      const step = stepRef.current || w || 80;
      const avail = box.clientWidth - 2 * 40 - 24; // dua tombol panah + padding
      setPerPage(Math.max(1, Math.floor((avail - w) / step) + 1));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(box);
    return () => ro.disconnect();
  }, [me.hand.length]);

  const handPages = Math.max(1, Math.ceil(me.hand.length / perPage));
  const page = Math.min(handPage, handPages - 1);
  const visibleHand = me.hand.slice(page * perPage, page * perPage + perPage);

  const selInfo = useMemo(() => {
    if (!sel) return null;
    if (sel.kind === 'hand') {
      const c = me.hand.find((x) => x.uid === sel.uid);
      return c ? { kind: 'hand', card: c, cardId: c.id } : null;
    }
    if (sel.kind === 'mon') {
      const m = g.players[sel.side].monsters[sel.slot];
      return m ? { kind: 'mon', side: sel.side, slot: sel.slot, inst: m, cardId: m.id } : null;
    }
    return { kind: 'card', cardId: sel.cardId };
  }, [sel, g, me.hand]);

  const shown = hover || selInfo;
  const shownId = shown?.cardId ?? null;

  const startTarget = (kind, need, extra) => {
    sfx.click();
    const valid = [];
    if (kind === 'attack') {
      attackTargets(g, 'player', extra.slot).forEach((t) => t !== 'direct' && valid.push({ side: 'enemy', slot: t }));
    } else {
      const side = need === 'allyMonster' ? 'player' : 'enemy';
      g.players[side].monsters.forEach((m, slot) => m && valid.push({ side, slot }));
    }
    setMode({ kind, need, valid, ...extra });
  };

  const onTile = (side, slot) => {
    if (mode && mode.valid.some((v) => v.side === side && v.slot === slot)) {
      if (mode.kind === 'play') act({ type: 'PLAY', side: 'player', uid: mode.uid, target: slot });
      else if (mode.kind === 'skill') act({ type: 'SKILL', side: 'player', slot: mode.slot, target: slot });
      else if (mode.kind === 'attack') act({ type: 'ATTACK', side: 'player', slot: mode.slot, target: slot });
      return;
    }
    sfx.click();
    setMode(null);
    setSel({ kind: 'mon', side, slot });
  };

  const inspect = (v, isHover) => {
    if (isHover) return;
    setSel({ kind: 'card', cardId: v.cardId });
    setMode(null);
  };

  const cancel = () => { setMode(null); };
  const clearSel = () => { setSel(null); setMode(null); };

  function attackReason(slot) {
    if (g.turn <= 1) return 'Giliran pertama belum boleh menyerang';
    const m = me.monsters[slot];
    if (m.pos === 'def') return 'Posisi bertahan tidak bisa menyerang';
    return whyCannotAct(g, 'player', slot) || '';
  }

  /* ---------- tombol aksi (dipakai desktop & mobile) ---------- */
  function renderActions() {
    if (!selInfo) return null;
    if (!myTurn) return <p className="text-xs text-slate-400">Menunggu giliranmu…</p>;
    if (mode) {
      return (
        <div className="space-y-2">
          <p className="rounded-lg bg-rose-500/15 p-2 text-center text-xs font-semibold text-rose-200">
            {mode.valid.length ? 'Ketuk target yang menyala merah' : 'Tidak ada target'}
          </p>
          <Btn onClick={cancel}><X size={14} /> Batal</Btn>
        </div>
      );
    }
    if (selInfo.kind === 'hand') {
      const d = CARDS[selInfo.cardId];
      const chk = canPlayCard(g, 'player', selInfo.card.uid);
      if (!chk.ok) return <p className="text-xs font-semibold text-rose-300">{chk.reason}</p>;
      if (d.type === 'monster') {
        return (
          <div className="grid grid-cols-2 gap-2">
            <Btn primary onClick={() => act({ type: 'PLAY', side: 'player', uid: selInfo.card.uid, pos: 'atk' })}>Serang</Btn>
            <Btn onClick={() => act({ type: 'PLAY', side: 'player', uid: selInfo.card.uid, pos: 'def' })}>Bertahan</Btn>
          </div>
        );
      }
      if (chk.need) return <Btn primary onClick={() => startTarget('play', chk.need, { uid: selInfo.card.uid })}>Pilih target</Btn>;
      const label = d.type === 'trap' ? 'Pasang jebakan' : d.type === 'field' ? 'Aktifkan medan' : 'Mainkan';
      return <Btn primary onClick={() => act({ type: 'PLAY', side: 'player', uid: selInfo.card.uid })}>{label}</Btn>;
    }
    if (selInfo.kind === 'mon' && selInfo.side === 'player') {
      const { slot, inst } = selInfo;
      const d = CARDS[inst.id];
      const atkOk = canAttack(g, 'player', slot);
      const sc = d.skill ? canSkill(g, 'player', slot) : null;
      const targets = atkOk ? attackTargets(g, 'player', slot) : [];
      return (
        <div className="grid grid-cols-2 gap-2">
          {atkOk ? (
            <Btn
              primary
              onClick={() => {
                if (targets[0] === 'direct') act({ type: 'ATTACK', side: 'player', slot, target: 'direct' });
                else if (targets.length === 1) act({ type: 'ATTACK', side: 'player', slot, target: targets[0] });
                else startTarget('attack', 'enemyMonster', { slot });
              }}
            >
              <Swords size={15} /> {targets[0] === 'direct' ? 'Serang Langsung!' : 'Serang'}
            </Btn>
          ) : (
            <p className="col-span-2 text-xs text-slate-400">{attackReason(slot)}</p>
          )}
          {d.skill && (
            <Btn
              disabled={!sc.ok}
              onClick={() => (sc.need ? startTarget('skill', sc.need, { slot }) : act({ type: 'SKILL', side: 'player', slot }))}
            >
              {d.skill.name} · {d.skill.cost} energi
            </Btn>
          )}
          {d.skill && !sc.ok && <p className="col-span-2 text-[11px] text-slate-400">Skill: {sc.reason}</p>}
          <Btn className={atkOk === !!d.skill ? 'col-span-2' : ''} disabled={inst.acted} onClick={() => act({ type: 'TOGGLE', side: 'player', slot })}>
            {inst.pos === 'atk' ? 'Ganti ke bertahan' : 'Ganti ke serang'}
          </Btn>
        </div>
      );
    }
    return null;
  }

  const lines = shownId ? describeCard(CARDS[shownId]) : [];

  /* ---------- tampilan ---------- */
  return (
    <div className="no-select flex h-[100dvh] w-full overflow-hidden overscroll-none">
      {/* panel kiri (desktop): detail kartu & aksi */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#0a0c11]/80 lg:flex xl:w-72">
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
          {shownId ? (
            <>
              {/* kartu selebar panel (1em kartu = 1/10 lebar panel) */}
              <div className="flex justify-center">
                <Card id={shownId} size="lg" className="!text-[23px] xl:!text-[26px]" />
              </div>

              {/* ringkasan */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {[
                  `Biaya ${CARDS[shownId].cost}`,
                  ELEMENTS[CARDS[shownId].element]?.name,
                  RARITY[CARDS[shownId].rarity]?.name,
                ].filter(Boolean).map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-slate-300">{t}</span>
                ))}
              </div>

              {shown?.side != null && shown.slot != null && <InstanceInfo g={g} side={shown.side} slot={shown.slot} />}

              {lines.length > 0 && (
                <div className="space-y-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5 text-xs leading-snug">
                  {lines.map((l, i) => (
                    <p key={i}><b className={l.skill ? 'text-violet-300' : 'text-amber-200'}>{l.k}:</b> <span className="text-slate-300">{l.text}</span></p>
                  ))}
                </div>
              )}
              {CARDS[shownId].kw?.length > 0 && (
                <ul className="space-y-1 text-[11px] leading-snug text-slate-400">
                  {CARDS[shownId].kw.map((k) => <li key={k}><b className="text-slate-300">{KEYWORDS[k].name}</b>: {KEYWORDS[k].desc}</li>)}
                </ul>
              )}
              {CARDS[shownId].flavor && <p className="text-[11px] italic leading-snug text-slate-500">“{CARDS[shownId].flavor}”</p>}
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
              Arahkan kursor atau ketuk kartu untuk melihat detail dan aksi.
            </p>
          )}

          {/* info singkat milik pemain */}
          <div className="mt-auto flex shrink-0 items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-2 text-[11px] tabular-nums text-slate-300">
            <span>LP <b className="text-white">{me.lp}</b></span>
            <span>Energi <b className="text-white">{me.mana}/{me.maxMana}</b></span>
            <span>Hadiah <b className="text-white">{prizes.player.length}</b></span>
          </div>

          {/* tombol aksi menempel di dasar panel */}
          {shownId && selInfo && <div className="shrink-0 pt-1">{renderActions()}</div>}
        </div>
      </aside>

      {/* papan */}
      <main
        className="duel-main flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-hidden px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-4 sm:pt-2"
        style={{ '--u': BOARD_UNIT }}
      >
        <PlayerBar g={g} side="enemy" floats={floats.filter((f) => f.key === 'enemy:lp')} flash={flash['enemy:lp']} active={g.active === 'enemy' && !g.winner} />
        <Strip g={g} side="enemy" onInspect={inspect} />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-evenly gap-1">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <PrizePile cards={prizes.enemy} pending={0} mine={false} onTake={takePrize} />
            {[0, 1, 2].map((s) => (
              <Slot key={s} g={g} side="enemy" slot={s} sel={sel} mode={mode} floats={floats} flash={flash} attacking={attacking} onClick={onTile} onHover={(v) => setHover(v ? { ...v, cardId: g.players.enemy.monsters[s]?.id, side: 'enemy', slot: s } : null)} />
            ))}
            <div className="w-6 shrink-0" aria-hidden />
          </div>

          <div className="flex w-full max-w-xl items-center gap-2 py-1">
            <span className={clsx('chip !px-2', myTurn ? 'chip-on' : '')}>Giliran {g.turn} · {g.active === 'player' ? 'Kamu' : 'Lawan'}</span>
            <div
              className={clsx('min-w-0 flex-1 truncate text-center text-[11px] sm:text-xs', mode ? 'font-semibold text-rose-200' : 'text-slate-400')}
              title={detail.length ? detail[detail.length - 1].text : ''}
            >
              {mode ? 'Pilih target…' : (() => { const l = [...detail].reverse().find((x) => x.kind !== 'giliran'); return l ? l.text : ''; })()}
            </div>
            <button className="btn btn-sm !px-2 lg:hidden" onClick={() => setShowLog(true)} aria-label="Catatan"><ScrollText size={14} /></button>
            <button className="btn btn-sm !px-2" onClick={() => setConfirmQuit(true)} aria-label="Menyerah"><Flag size={14} /></button>
            <button
              className={clsx('btn btn-sm', myTurn && !mode && 'btn-primary')}
              disabled={!myTurn}
              onClick={() => { sfx.click(); act({ type: 'END_TURN', side: 'player' }); }}
            >
              Akhiri Giliran
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <PrizePile cards={prizes.player} pending={pending.player} mine onTake={takePrize} />
            {[0, 1, 2].map((s) => (
              <Slot key={s} g={g} side="player" slot={s} sel={sel} mode={mode} floats={floats} flash={flash} attacking={attacking} onClick={onTile} onHover={(v) => setHover(v ? { ...v, cardId: g.players.player.monsters[s]?.id, side: 'player', slot: s } : null)} />
            ))}
            <div className="w-6 shrink-0" aria-hidden />
          </div>
        </div>

        <Strip g={g} side="player" onInspect={inspect} />
        <PlayerBar g={g} side="player" floats={floats.filter((f) => f.key === 'player:lp')} flash={flash['player:lp']} active={myTurn} />

        {/* tangan: tombol panah kiri/kanan, tanpa scroll */}
        <div ref={handBox} className="flex shrink-0 items-center justify-center gap-1 pb-1 pt-3">
          <button
            className="btn btn-sm !h-9 !w-9 shrink-0 !p-0 disabled:opacity-20"
            disabled={page <= 0}
            onClick={() => setHandPage(page - 1)}
            aria-label="Kartu sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex min-w-0 flex-col items-center">
            <div data-hand-row className="flex w-max gap-2 px-3 sm:gap-3">
              {visibleHand.map((c) => {
                const ok = myTurn && canPlayCard(g, 'player', c.uid).ok;
                const on = sel?.kind === 'hand' && sel.uid === c.uid;
                return (
                  <div
                    key={c.uid}
                    className={clsx('transition-[filter,transform] duration-150', on ? '-translate-y-3 z-10' : 'hover:z-10 hover:brightness-125')}
                    onMouseEnter={() => setHover({ cardId: c.id })}
                    onMouseLeave={() => setHover(null)}
                  >
                    <Card
                      id={c.id}
                      size="hand"
                      selected={on}
                      dim={!ok}
                      onClick={() => { sfx.click(); setMode(null); setSel(on ? null : { kind: 'hand', uid: c.uid }); }}
                    />
                  </div>
                );
              })}
              {me.hand.length === 0 && <p className="px-6 py-8 text-sm text-slate-500">Tanganmu kosong</p>}
            </div>
          </div>

          <button
            className="btn btn-sm !h-9 !w-9 shrink-0 !p-0 disabled:opacity-20"
            disabled={page >= handPages - 1}
            onClick={() => setHandPage(page + 1)}
            aria-label="Kartu berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </main>

      {/* panel kanan (desktop): rincian & catatan duel */}
      <aside ref={rightRef} onClickCapture={() => requestAnimationFrame(stickLog)} className="hidden w-64 shrink-0 flex-col overflow-hidden border-l border-white/[0.07] bg-[#0a0c11]/80 p-3 lg:flex xl:w-72 [&_*]:!overflow-y-hidden [&_*]:![scrollbar-width:none] [&_*::-webkit-scrollbar]:hidden">
        <DuelLog g={g} detail={detail} className="flex-1" />
      </aside>

      {/* sheet mobile */}
      <AnimatePresence>
        {selInfo && !mode && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0a0c11]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur lg:hidden"
          >
            <button className="btn btn-sm absolute right-2 top-2 !p-1.5" onClick={clearSel} aria-label="Tutup"><X size={14} /></button>
            <div className="flex gap-3">
              <div className="shrink-0"><Card id={selInfo.cardId} size="md" /></div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="pr-8 text-sm font-semibold leading-tight tracking-tight">{CARDS[selInfo.cardId].name}</p>
                  <p className="text-[11px] text-slate-400">{TYPE_NAMES[CARDS[selInfo.cardId].type]} · {ELEMENTS[CARDS[selInfo.cardId].element].name}</p>
                </div>
                {selInfo.kind === 'mon' && <InstanceInfo g={g} side={selInfo.side} slot={selInfo.slot} />}
                <div className="max-h-24 space-y-0.5 overflow-y-auto text-[11px] leading-snug">
                  {describeCard(CARDS[selInfo.cardId]).map((l, i) => (
                    <p key={i}><b className={l.skill ? 'text-violet-300' : 'text-amber-200'}>{l.k}:</b> {l.text}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3">{renderActions()}</div>
          </motion.div>
        )}
        {mode && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-rose-400/40 bg-slate-950/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          >
            <p className="flex-1 text-sm font-semibold text-rose-200">Ketuk target yang menyala merah</p>
            <button className="btn btn-sm" onClick={cancel}>Batal</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* log mobile */}
      <AnimatePresence>
        {showLog && (
          <motion.div className="fixed inset-0 z-40 flex items-end bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLog(false)}>
            <div className="panel flex h-[62dvh] w-full flex-col rounded-b-none p-3 text-xs" onClick={(e) => e.stopPropagation()}>
              <div className="mb-2 flex shrink-0 items-center justify-between font-semibold"><span>Riwayat duel</span><button onClick={() => setShowLog(false)} aria-label="Tutup"><X size={16} /></button></div>
              <DuelLog g={g} detail={detail} className="flex-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* karakter muncul dari pinggir layar */}
      <CutIns items={cutIns} />

      {/* banner */}
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.id}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.25 }}
          >
            {banner.cardId ? (
              <div className="flex flex-col items-center gap-2">
                <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold">
                  {banner.trap ? 'Jebakan aktif · ' : banner.side === 'player' ? 'Kamu memainkan' : `${g.names.enemy} memainkan`}
                </span>
                <Card id={banner.cardId} size="lg" glow />
              </div>
            ) : (
              <div className="rounded-xl border border-white/15 bg-[#0a0c11]/90 px-8 py-4 text-2xl font-semibold tracking-tight text-white shadow-2xl backdrop-blur sm:text-3xl">{banner.text}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* konfirmasi menyerah */}
      <AnimatePresence>
        {confirmQuit && !g.winner && (
          <motion.div className="fixed inset-0 z-[55] flex items-center justify-center bg-[#05060a]/80 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="panel w-full max-w-sm space-y-3 p-5 text-center">
              <p className="text-lg font-semibold tracking-tight">Menyerah?</p>
              <p className="text-sm text-slate-300">Kamu akan dianggap kalah.</p>
              <div className="flex gap-2">
                <button className="btn flex-1" onClick={() => setConfirmQuit(false)}>Lanjut main</button>
                <button className="btn btn-danger flex-1" onClick={() => { setConfirmQuit(false); act({ type: 'CONCEDE', side: 'player' }); }}>Menyerah</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* hasil */}
      <AnimatePresence>
        {g.winner && (
          <motion.div className="fixed inset-0 z-[56] flex items-center justify-center bg-[#05060a]/85 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring' }} className="panel w-full max-w-sm space-y-4 p-6 text-center">
              <h2 className={clsx('text-3xl font-semibold tracking-tight', g.winner === 'player' ? 'text-emerald-300' : 'text-rose-300')}>
                {g.winner === 'player' ? 'Menang' : 'Kalah'}
              </h2>
              <p className="text-sm text-slate-300">{g.reason} · {g.turn} giliran</p>
              {reward != null && <p className="text-lg font-semibold text-white">+{reward} koin</p>}
              <div className="grid gap-2">
                <button className="btn btn-primary" onClick={onRematch}>Duel Lagi</button>
                <button className="btn" onClick={onExit}>Kembali ke Menu</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}