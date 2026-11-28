import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Flag, Hand, Layers, PanelRightClose,
  PanelRightOpen, ScrollText, Shield, Sparkles, Sword, Swords, X, Zap,
} from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  canUltimateNow,
  createGame, reduce,
  statsOf, whyCannotAct,
} from '../engine/engine.js';
import { canEvolve } from '../engine/evolution.js';
import { canSwap } from '../engine/lanes.js';
import { explainAction, startEntries } from '../lib/explain.js';
import { sfx } from '../lib/sfx.js';
import { sfxx } from '../lib/sfxfx.js';
import { makeFxRunner } from '../lib/vfx.js';
import { useStore } from '../store/useStore.js';

/* ------------------------------------------------------------------ */
/*  Komponen kecil                                                    */
/* ------------------------------------------------------------------ */

// Label pemain bergaya TCG Live: bilah hexagon (biru = kamu, merah = lawan) + LP + energi
function PlayerBar({ g, side, floats, flash, active }) {
  const p = g.players[side];
  const pct = Math.max(0, Math.min(100, (p.lp / START_LP) * 100));
  const me = side === 'player';
  return (
    <div data-fx={`${side}:lp`} className={clsx('relative flex items-center gap-2 rounded-md', flash && `fx-${flash}`)}>
      <div className={clsx('tcg-hex-tag min-w-0 flex-1 flex-col !items-stretch !gap-0.5 !py-1', me ? 'is-me' : 'is-foe', active && 'brightness-125')}>
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-xs font-extrabold sm:text-sm">{g.names[side]}</span>
          <span className="ml-auto text-sm font-black tabular-nums sm:text-base">
            {p.lp} <span className="text-[10px] font-bold opacity-80">LP</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
          <motion.div className="h-full bg-gradient-to-r from-yellow-200 to-yellow-400" animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/30 bg-black/50 px-2.5 py-1 text-[10px] text-white sm:text-xs">
        <span className="flex items-center gap-[2px]" title="Energi">
          {Array.from({ length: MAX_MANA }).map((_, i) => (
            <span
              key={i}
              className={clsx(
                'h-2 w-2 rounded-full border sm:h-2.5 sm:w-2.5',
                i < p.mana ? 'border-yellow-100 bg-yellow-300' : i < p.maxMana ? 'border-yellow-300/70 bg-transparent' : 'border-white/20 bg-white/10',
              )}
            />
          ))}
          <b className="ml-1 tabular-nums">{p.mana}/{p.maxMana}</b>
        </span>
        <span className="flex items-center gap-1" title="Deck"><Layers size={11} /> {p.deck.length}</span>
        <span className="flex items-center gap-1" title="Tangan"><Hand size={11} /> {p.hand.length}</span>
      </div>
      <Floats items={floats} />
    </div>
  );
}

function Strip({ g, side, onInspect }) {
  const p = g.players[side];
  const fieldCard = p.field ? CARDS[p.field.id] : null;
  return (
    <div className="flex items-center justify-between gap-2 px-1 text-[10px] text-white lg:text-xs">
      <button
        className={clsx('chip !px-3 !py-0.5', !fieldCard && 'opacity-40')}
        onClick={() => fieldCard && onInspect({ cardId: fieldCard.id })}
        onMouseEnter={() => fieldCard && onInspect({ cardId: fieldCard.id }, true)}
      >
        {fieldCard ? fieldCard.name : 'Medan —'}
      </button>
      <div className="flex items-center gap-1">
        <span className="font-bold text-white/80">Jebakan</span>
        {p.traps.map((t, i) => (
          <button
            key={i}
            disabled={!t || side === 'enemy'}
            onClick={() => t && side === 'player' && onInspect({ cardId: t.id })}
            className={clsx(
              'flex h-6 w-5 items-center justify-center rounded border text-[11px] lg:h-7 lg:w-6',
              t ? 'border-yellow-300 bg-yellow-300/25' : 'border-white/30 bg-black/30 opacity-60',
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
        <div className="absolute inset-0 rounded-[0.7em] border border-dashed border-white/25 bg-black/20" />
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
  flags.push(`Charge ${m.charge || 0}/3`);
  if (m.venom > 0) flags.push(`Racun ${m.venom}`);
  if (m.silence > 0) flags.push('Dibungkam');
  (m.marks || []).filter((k) => k.turn === g.turn).forEach((k) => flags.push(`Tanda ${k.el}`));
  m.equips.forEach((r) => flags.push(`Relik: ${CARDS[r].name}`));
  return (
    <div className="space-y-1 rounded-md border border-white/25 bg-black/35 p-2 text-xs">
      <div className="flex justify-between font-bold">
        <span className={st.atk > d.atk ? 'text-green-300' : 'text-white'}>ATK {st.atk}</span>
        <span className={st.def > d.def ? 'text-green-300' : 'text-white'}>DEF {st.def}</span>
        <span className="text-white">HP {m.hp}/{m.maxHp}</span>
      </div>
      {flags.length > 0 && <p className="text-white/80">{flags.join(' · ')}</p>}
    </div>
  );
}

function Btn({ children, onClick, primary, danger, disabled, className, title }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={clsx('btn w-full !px-2 text-center text-[13px] leading-tight', primary && 'btn-primary', danger && 'btn-danger', className)}
    >
      {children}
    </button>
  );
}

// Skalakan isi agar lebarnya persis selebar wadah
function FitWidth({ children }) {
  const boxRef = useRef(null);
  const innerRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, height: undefined });
  useLayoutEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    const calc = () => {
      if (!box.clientWidth || !inner.offsetWidth) return;
      const scale = box.clientWidth / inner.offsetWidth;
      setFit({ scale, height: inner.offsetHeight * scale });
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(box);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={boxRef} className="w-full shrink-0 overflow-hidden" style={{ height: fit.height }}>
      <div ref={innerRef} className="w-max origin-top-left" style={{ transform: `scale(${fit.scale})` }}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kartu Hadiah (ala Pokémon TCG)                                    */
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
      if (m.uid != null && nm.some((x) => x?.uid === m.uid)) return; // pindah posisi
      if (next.fx?.some((e) => e.type === 'evolve' && e.side === owner && e.slot === slot)) return;
      if (countIn(next.players[owner].hand, m.id) > countIn(prev.players[owner].hand, m.id)) return;
      const d = CARDS[m.id];
      if (!d || d.token) return;
      out[taker].n += PRIZE_TAGS.includes(d.tag) ? 2 : 1;
      out[taker].names.push(d.name);
    });
  });
  return out;
}

// Punggung kartu: bola kristal elemen berbingkai emas dengan delapan sinar
function CardBack() {
  const id = useId();
  const url = (name) => `url(#${id}${name})`;
  const elements = ['#ef4444', '#0ea5e9', '#10b981', '#f59e0b'];
  return (
    <svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <radialGradient id={`${id}orb`} cx="50%" cy="62%" r="62%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0b1437" />
        </radialGradient>
        <linearGradient id={`${id}gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7cc" />
          <stop offset="35%" stopColor="#f5b82e" />
          <stop offset="65%" stopColor="#a86a0c" />
          <stop offset="100%" stopColor="#ffe08a" />
        </linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* kilap kartu dan bingkai dalam */}
      <path d="M0 0 H58 L0 80 Z" fill="#ffffff" opacity="0.4" />
      <path d="M100 60 V86 L61 140 H42 Z" fill="#ffffff" opacity="0.3" />
      <rect x="6" y="6" width="88" height="128" rx="7" fill="none" stroke="#64748b" strokeWidth="1" opacity="0.5" />
      {/* bayangan alas */}
      <ellipse cx="50" cy="112" rx="25" ry="3.5" fill="#334155" opacity="0.2" />
      {/* sinar panjang dan pendek */}
      <path d="M50 25 L55 50 L45 50 Z M95 70 L70 75 L70 65 Z M50 115 L45 90 L55 90 Z M5 70 L30 65 L30 75 Z" fill={url('gold')} />
      <g transform="rotate(45 50 70)">
        <path d="M50 35 L54 50 L46 50 Z M85 70 L70 74 L70 66 Z M50 105 L46 90 L54 90 Z M15 70 L30 66 L30 74 Z" fill={url('gold')} />
      </g>
      {/* cincin dan bola */}
      <circle cx="50" cy="70" r="30" fill={url('gold')} />
      <circle cx="50" cy="70" r="26" fill="#0b1437" />
      <circle cx="50" cy="70" r="24.5" fill={url('orb')} />
      {/* empat kristal elemen */}
      {elements.map((color, i) => (
        <g key={color} transform={`rotate(${i * 90} 50 70)`}>
          <path d="M50 50 L56 62 L50 67 Z" fill={color} />
          <path d="M50 50 L44 62 L50 67 Z" fill={color} />
          <path d="M50 50 L44 62 L50 67 Z" fill="#ffffff" opacity="0.4" />
        </g>
      ))}
      <path d="M50 61 L53 67 L59 70 L53 73 L50 79 L47 73 L41 70 L47 67 Z" fill="#ffffff" />
      {/* pantulan kaca */}
      <ellipse cx="50" cy="57" rx="17" ry="10" fill={url('glass')} opacity="0.55" />
      <circle cx="39" cy="58" r="2.2" fill="#ffffff" />
      <path d="M32 80 A21 21 0 0 0 68 80" fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

// Tumpukan hadiah: punggung kartu biru bergaya TCG Live
function PrizePile({ cards, pending, mine, onTake, desktop }) {
  const canTake = mine && pending > 0;
  return (
    <div className="relative flex shrink-0 flex-col items-center gap-1" title="Kartu Hadiah">
      <span className="rounded bg-black/45 px-1.5 text-[9px] font-extrabold uppercase tracking-wider text-white lg:absolute lg:-top-2 lg:z-10">Hadiah</span>
      <div className={clsx('flex flex-col gap-1 lg:flex-row lg:gap-3 lg:p-2', desktop && 'duel-lane')}>
        {Array.from({ length: PRIZE_COUNT }).map((_, i) => {
          const c = cards[i];
          return c ? (
            <button
              key={c.uid ?? i}
              disabled={!canTake}
              onClick={() => onTake(i)}
              aria-label="Ambil kartu hadiah"
              className={clsx(
                TILE_SIZE,
                'relative h-8 w-6 rounded-[4px] border-2 lg:!h-[10.5em] lg:!w-[9em] lg:rounded-[0.7em] overflow-hidden bg-gradient-to-br from-white via-slate-300 to-slate-400 transition sm:h-9 sm:w-[26px]',
                canTake ? 'animate-pulse cursor-pointer border-yellow-300' : 'border-white/70',
              )}
            >
              <CardBack />
            </button>
          ) : (
            <div key={`e${i}`} className={clsx(TILE_SIZE, 'h-8 w-6 rounded-[4px] border border-dashed border-white/30 sm:h-9 sm:w-[26px] lg:!h-[10.5em] lg:!w-[9em] lg:rounded-[0.7em]')} />
          );
        })}
      </div>
      {canTake && <span className="rounded bg-yellow-300 px-1.5 text-[10px] font-black text-slate-900 lg:absolute lg:-bottom-2 lg:z-10">Ambil {pending}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Layar duel                                                        */
/* ------------------------------------------------------------------ */
// 3 hadiah + 3 slot monster sejajar, jadi lebar sidebar ikut dihitung
const boardUnit = (side) => `clamp(5px, calc((100dvh - 300px) / 23), min(11px, calc((100vw - ${side ? 700 : 420}px) / 62)))`;
const BOARD_UNIT_MOBILE = 'clamp(5px, min(calc((100dvh - 250px) / 23), calc((100vw - 120px) / 29)), 12px)';

function useIsMobile() {
  const query = '(max-width: 1023px)';
  const [m, setM] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

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
  const isMobile = useIsMobile();
  const mobileRef = useRef(isMobile);
  mobileRef.current = isMobile;
  const [showHand, setShowHand] = useState(false);
  // sidebar kanan (desktop): pilihan disimpan agar tetap sama di duel berikutnya
  const [showSide, setShowSide] = useState(() => {
    try { return localStorage.getItem('duel:sidePanel') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('duel:sidePanel', showSide ? '1' : '0'); } catch { /* abaikan */ }
  }, [showSide]);

  /* ---------- efek visual ---------- */
  const pushCut = useCallback((item) => {
    if (!item.cardId || mobileRef.current) return;
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
            case 'reaction': addFloat(key, e.name, '#f0abfc'); setFlashFor(key, 'buff'); sfx.buff(); break;
            case 'evolve': addFloat(key, 'Evolusi!', '#fde047'); setFlashFor(key, 'summon'); sfx.buff(); pushCut({ kind: 'big', side: e.side, cardId: e.to, label: 'Evolusi!' }); break;
            case 'swap': addFloat(`${e.side}:${e.a}`, '⇄', '#a5f3fc'); addFloat(`${e.side}:${e.b}`, '⇄', '#a5f3fc'); break;
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
  }, [detail.length, g.log.length, showSide, stickLog]);

  /* ---------- turunan ---------- */
  const me = g.players.player;
  const myTurn = g.active === 'player' && !g.winner;

  /* ---------- tangan: paginasi panah ---------- */
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
      const avail = box.clientWidth - 2 * 40 - 24;
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
    if (kind === 'evolve') {
      [0, 1, 2].forEach((slot) => canEvolve(g, 'player', slot, extra.uid).ok && valid.push({ side: 'player', slot }));
    } else if (kind === 'attack') {
      attackTargets(g, 'player', extra.slot).forEach((t) => t !== 'direct' && valid.push({ side: 'enemy', slot: t }));
    } else {
      const side = need === 'allyMonster' ? 'player' : 'enemy';
      g.players[side].monsters.forEach((m, slot) => m && valid.push({ side, slot }));
    }
    setMode({ kind, need, valid, ...extra });
  };

  const onTile = (side, slot) => {
    if (mode && mode.valid.some((v) => v.side === side && v.slot === slot)) {
      if (mode.kind === 'evolve') act({ type: 'EVOLVE', side: 'player', uid: mode.uid, slot });
      else if (mode.kind === 'play') act({ type: 'PLAY', side: 'player', uid: mode.uid, target: slot });
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

  /* ---------- tombol aksi ---------- */
  function renderActions() {
    if (!selInfo) return null;
    if (!myTurn) return <p className="text-xs text-white/80">Menunggu giliranmu…</p>;
    if (mode) {
      return (
        <div className="space-y-2">
          <p className="rounded-md bg-red-600/40 p-2 text-center text-xs font-bold text-white">
            {mode.valid.length ? 'Ketuk target yang menyala merah' : 'Tidak ada target'}
          </p>
          <Btn onClick={cancel}><X size={14} /> Batal</Btn>
        </div>
      );
    }
    if (selInfo.kind === 'hand') {
      const d = CARDS[selInfo.cardId];
      if (d.evolvesFrom) {
        const checks = [0, 1, 2].map((s) => canEvolve(g, 'player', s, selInfo.card.uid));
        if (checks.some((c) => c.ok)) return <Btn primary onClick={() => startTarget('evolve', null, { uid: selInfo.card.uid })}>Evolusi</Btn>;
        const why = checks.find((c, i) => me.monsters[i]?.id === d.evolvesFrom)?.reason;
        return <p className="text-xs font-bold text-yellow-300">{why || `Butuh ${CARDS[d.evolvesFrom]?.name} di arena`}</p>;
      }
      const chk = canPlayCard(g, 'player', selInfo.card.uid);
      if (!chk.ok) return <p className="text-xs font-bold text-yellow-300">{chk.reason}</p>;
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
      const ult = d.ult ? canUltimateNow(g, 'player', slot) : null;
      const icon = '!flex !min-w-0 flex-1 items-center justify-center !px-0 !py-2';
      const direct = targets[0] === 'direct';
      const toAtk = inst.pos !== 'atk';
      return (
        <div className="space-y-1.5">
          <div className="flex items-stretch gap-1">
            <Btn
              primary={atkOk}
              disabled={!atkOk}
              className={icon}
              title={direct ? 'Serang langsung' : 'Serang'}
              onClick={() => {
                if (direct) act({ type: 'ATTACK', side: 'player', slot, target: 'direct' });
                else if (targets.length === 1) act({ type: 'ATTACK', side: 'player', slot, target: targets[0] });
                else startTarget('attack', 'enemyMonster', { slot });
              }}
            >
              <Swords size={18} />
            </Btn>
            {d.skill && (
              <Btn
                disabled={!sc.ok}
                className={icon}
                title={`Skill: ${d.skill.name} (${d.skill.cost} energi)`}
                onClick={() => (sc.need ? startTarget('skill', sc.need, { slot }) : act({ type: 'SKILL', side: 'player', slot }))}
              >
                <Sparkles size={18} />
              </Btn>
            )}
            {d.ult && (
              <Btn
                primary={ult.ok}
                disabled={!ult.ok}
                className={icon}
                title={`Ultimate: ${d.ult.name}`}
                onClick={() => act({ type: 'ULTIMATE', side: 'player', slot })}
              >
                <Zap size={18} />
              </Btn>
            )}
            <Btn
              disabled={inst.acted}
              className={icon}
              title={toAtk ? 'Ganti ke serang' : 'Ganti ke bertahan'}
              onClick={() => act({ type: 'TOGGLE', side: 'player', slot })}
            >
              {toAtk ? <Sword size={18} /> : <Shield size={18} />}
            </Btn>
            {[0, 1, 2].filter((to) => to !== slot).map((to) => {
              const Arrow = to === 1 ? ArrowUp : to === 0 ? ArrowLeft : ArrowRight;
              return (
                <Btn
                  key={to}
                  disabled={!canSwap(g, 'player', slot, to).ok}
                  className={icon}
                  title={`Tukar ke ${to === 1 ? 'depan' : to === 0 ? 'kiri' : 'kanan'} (1 energi)`}
                  onClick={() => act({ type: 'SWAP', side: 'player', a: slot, b: to })}
                >
                  <Arrow size={18} />
                </Btn>
              );
            })}
          </div>
          {!atkOk && <p className="text-[11px] text-white/80">Serang: {attackReason(slot)}</p>}
          {d.skill && !sc.ok && <p className="text-[11px] text-white/80">Skill: {sc.reason}</p>}
          {d.ult && !ult.ok && <p className="text-[11px] text-white/80">Ultimate: {ult.reason}</p>}
        </div>
      );
    }
    return null;
  }

  const usable = (c) => (CARDS[c.id].evolvesFrom
    ? [0, 1, 2].some((i) => canEvolve(g, 'player', i, c.uid).ok)
    : canPlayCard(g, 'player', c.uid).ok);
  const playable = myTurn ? me.hand.filter(usable).length : 0;
  const lines = shownId ? describeCard(CARDS[shownId]) : [];

  const statusText = mode
    ? 'Pilih target…'
    : (() => { const l = [...detail].reverse().find((x) => x.kind !== 'giliran'); return l ? l.text : ''; })();

  const renderLane = (side) => (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <PrizePile desktop={!isMobile} cards={prizes[side]} pending={side === 'player' ? pending.player : 0} mine={side === 'player'} onTake={takePrize} />
      <div className="duel-lane flex gap-2 p-2 sm:gap-3">
        {[0, 1, 2].map((s) => (
          <Slot
            key={s} g={g} side={side} slot={s} sel={sel} mode={mode} floats={floats} flash={flash} attacking={attacking} onClick={onTile}
            onHover={(v) => setHover(v ? { ...v, cardId: g.players[side].monsters[s]?.id, side, slot: s } : null)}
          />
        ))}
      </div>
      <div className="w-6 shrink-0 lg:hidden" aria-hidden />
    </div>
  );

  /* ---------- tampilan ---------- */
  return (
    <div className="no-select duel-root relative flex h-[100dvh] w-full overflow-hidden overscroll-none">
      {/* panel kiri (desktop): detail kartu & aksi */}
      <aside className="relative z-[2] hidden w-64 shrink-0 flex-col border-r-2 border-cyan-400/50 bg-[#0a1c4a]/90 lg:flex xl:w-72">
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
          {shownId ? (
            <>
              <FitWidth>
                <div className="tcg-cardframe">
                  <Card id={shownId} size="lg" className="!text-[21px] xl:!text-[24px]" />
                </div>
              </FitWidth>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {[
                  `Biaya ${CARDS[shownId].cost}`,
                  ELEMENTS[CARDS[shownId].element]?.name,
                  RARITY[CARDS[shownId].rarity]?.name,
                ].filter(Boolean).map((t) => (
                  <span key={t} className="rounded-full border border-white/30 bg-black/30 px-2 py-0.5 font-bold text-white">{t}</span>
                ))}
              </div>

              {shown?.side != null && shown.slot != null && <InstanceInfo g={g} side={shown.side} slot={shown.slot} />}

              {lines.length > 0 && (
                <div className="space-y-1.5 rounded-md border border-white/25 bg-black/35 p-2.5 text-xs leading-snug">
                  {lines.map((l, i) => (
                    <p key={i}><b className={l.skill ? 'text-violet-300' : 'text-yellow-200'}>{l.k}:</b> <span className="text-white/90">{l.text}</span></p>
                  ))}
                </div>
              )}
              {
                CARDS[shownId].kw?.length > 0 && (
                  <div className="space-y-1.5 rounded-md border border-white/25 bg-black/35 p-2.5 text-xs leading-snug">
                    {CARDS[shownId].kw?.length > 0 && (
                      <ul className="space-y-1 text-[11px] leading-snug text-white/75">
                        {CARDS[shownId].kw.map((k) => <li key={k}><b className="text-white">{KEYWORDS[k]?.name ?? k}</b> <br /> {KEYWORDS[k]?.desc}</li>)}
                      </ul>
                    )}
                  </div>
                )
              }
              {/* {CARDS[shownId].flavor && <p className="text-[11px] italic leading-snug text-white/60">“{CARDS[shownId].flavor}”</p>} */}
            </>
          ) : (
            <p className="rounded-md border border-dashed border-white/30 p-4 text-center text-xs text-white/70">
              Arahkan kursor atau ketuk kartu untuk melihat detail dan aksi.
            </p>
          )}

          <div className="mt-auto flex shrink-0 items-center justify-between gap-2 rounded-md border border-white/25 bg-black/35 px-2.5 py-2 text-[11px] tabular-nums text-white/90">
            <span>LP <b className="text-white">{me.lp}</b></span>
            <span>Energi <b className="text-white">{me.mana}/{me.maxMana}</b></span>
            <span>Hadiah <b className="text-white">{prizes.player.length}</b></span>
          </div>

          {shownId && selInfo && <div className="shrink-0 pt-1">{renderActions()}</div>}
        </div>
      </aside>

      {/* papan */}
      <main
        className="duel-main flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-hidden pb-[max(0.25rem,env(safe-area-inset-bottom))]"
        style={{ '--u': isMobile ? BOARD_UNIT_MOBILE : boardUnit(showSide) }}
      >
        {/* ===== zona lawan (merah) ===== */}
        <div className="duel-zone is-foe !items-stretch !justify-start gap-1 px-2 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
          <PlayerBar g={g} side="enemy" floats={floats.filter((f) => f.key === 'enemy:lp')} flash={flash['enemy:lp']} active={g.active === 'enemy' && !g.winner} />
          <Strip g={g} side="enemy" onInspect={inspect} />
          {renderLane('enemy')}
        </div>

        {/* ===== garis tengah: giliran + End Turn ===== */}
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-2 sm:px-4">
          <div className="flex w-full max-w-3xl items-center gap-2">
            <span className={clsx('tcg-hex-tag shrink-0 text-[11px] sm:text-xs', g.active === 'player' ? 'is-me' : 'is-foe')}>
              Giliran {g.turn} · {g.active === 'player' ? 'Kamu' : 'Lawan'}
            </span>
            <div
              className={clsx('min-w-0 flex-1 truncate rounded bg-black/55 px-2 py-1 text-center text-[11px] sm:text-xs', mode ? 'font-bold text-yellow-200' : 'text-white')}
              title={detail.length ? detail[detail.length - 1].text : ''}
            >
              {statusText}
            </div>
            <button className="btn btn-sm !px-2 lg:hidden" onClick={() => setShowLog(true)} aria-label="Catatan"><ScrollText size={14} /></button>
            <button
              className="btn btn-sm !hidden !px-2 lg:!inline-flex"
              onClick={() => { sfx.click(); setShowSide((v) => !v); }}
              title={showSide ? 'Sembunyikan catatan duel' : 'Tampilkan catatan duel'}
              aria-label={showSide ? 'Sembunyikan catatan duel' : 'Tampilkan catatan duel'}
              aria-pressed={showSide}
            >
              {showSide ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            </button>
            <button className="btn btn-sm btn-danger !px-2" onClick={() => setConfirmQuit(true)} aria-label="Menyerah"><Flag size={14} /></button>
            <button
              className={clsx('tcg-endturn shrink-0', myTurn && !mode && 'is-ready')}
              disabled={!myTurn}
              onClick={() => { sfx.click(); act({ type: 'END_TURN', side: 'player' }); }}
            >
              End<br />Turn
            </button>
          </div>
        </div>

        {/* ===== zona kamu (biru) ===== */}
        <div className="duel-zone is-me !items-stretch !justify-start gap-1 px-2 pt-3 sm:px-4">
          {renderLane('player')}
          <Strip g={g} side="player" onInspect={inspect} />
          <PlayerBar g={g} side="player" floats={floats.filter((f) => f.key === 'player:lp')} flash={flash['player:lp']} active={myTurn} />

          {/* tangan (desktop): panah kiri/kanan */}
          <div ref={handBox} className="hidden shrink-0 items-center justify-center gap-1 pb-1 pt-2 lg:flex">
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
                  const ok = myTurn && usable(c);
                  const on = sel?.kind === 'hand' && sel.uid === c.uid;
                  return (
                    <div
                      key={c.uid}
                      className={clsx(
                        // paksa kartu diam dan tanpa bayangan, termasuk gaya bawaan Card
                        'rounded-lg [&_*]:!shadow-none [&>*]:![transform:none] [&>*]:![translate:none]',
                        on ? 'outline outline-2 outline-yellow-300' : 'hover:brightness-125',
                      )}
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
                {me.hand.length === 0 && <p className="px-6 py-8 text-sm text-white/80">Tanganmu kosong</p>}
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

          {/* tangan (mobile): tombol pembuka bottom sheet */}
          <div className="shrink-0 pb-1 pt-1 lg:hidden">
            <button className="btn w-full !py-3 text-sm" onClick={() => { sfx.click(); setShowHand(true); }}>
              <Hand size={16} /> Lihat kartu
              <span className="rounded-full bg-black/35 px-2 py-0.5 text-xs tabular-nums">{me.hand.length}</span>
              {playable > 0 && (
                <span className="rounded-full bg-green-400/30 px-2 py-0.5 text-[11px] font-bold text-green-100">{playable} bisa dimainkan</span>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* panel kanan (desktop): rincian & catatan duel */}
      <aside ref={rightRef} onClickCapture={() => requestAnimationFrame(stickLog)} className={clsx('relative z-[2] hidden w-64 shrink-0 flex-col overflow-hidden border-l-2 border-cyan-400/50 bg-[#0a1c4a]/90 p-3 xl:w-72 [&_*]:!overflow-y-hidden [&_*]:![scrollbar-width:none] [&_*::-webkit-scrollbar]:hidden', showSide && 'lg:flex')}>
        <DuelLog g={g} detail={detail} className="flex-1" />
      </aside>

      {/* sheet mobile */}
      <AnimatePresence>
        {selInfo && !mode && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="panel fixed inset-x-0 bottom-0 z-30 !rounded-b-none p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          >
            <button className="btn btn-sm absolute right-2 top-2 !p-1.5" onClick={clearSel} aria-label="Tutup"><X size={14} /></button>
            <div className="flex gap-3">
              <div className="shrink-0"><div className="tcg-cardframe"><Card id={selInfo.cardId} size="md" /></div></div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="pr-8 text-sm font-extrabold leading-tight tracking-tight">{CARDS[selInfo.cardId].name}</p>
                  <p className="text-[11px] text-white/75">{TYPE_NAMES[CARDS[selInfo.cardId].type]} · {ELEMENTS[CARDS[selInfo.cardId].element].name}</p>
                </div>
                {selInfo.kind === 'mon' && <InstanceInfo g={g} side={selInfo.side} slot={selInfo.slot} />}
                <div className="max-h-24 space-y-0.5 overflow-y-auto text-[11px] leading-snug">
                  {describeCard(CARDS[selInfo.cardId]).map((l, i) => (
                    <p key={i}><b className={l.skill ? 'text-violet-300' : 'text-yellow-200'}>{l.k}:</b> {l.text}</p>
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
            className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t-2 border-red-300 bg-red-800/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          >
            <p className="flex-1 text-sm font-bold text-white">Ketuk target yang menyala merah</p>
            <button className="btn btn-sm" onClick={cancel}>Batal</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* daftar kartu tangan (mobile) */}
      <AnimatePresence>
        {isMobile && showHand && !g.winner && (
          <motion.div
            key="hand-bg"
            className="fixed inset-0 z-[34] bg-black/60 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHand(false)}
          />
        )}
        {isMobile && showHand && !g.winner && (
          <motion.div
            key="hand-sheet"
            className="panel fixed inset-x-0 bottom-0 z-[35] flex max-h-[78dvh] flex-col !rounded-b-none pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/40" />
            <div className="flex shrink-0 items-center justify-between px-4 py-2">
              <div>
                <p className="text-sm font-extrabold">Tangan <span className="font-normal text-white/70">· {me.hand.length} kartu</span></p>
                <p className="text-[11px] text-white/70">Ketuk kartu untuk melihat aksi</p>
              </div>
              <button className="btn btn-sm !p-1.5" onClick={() => setShowHand(false)} aria-label="Tutup"><X size={14} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
              <div className="grid grid-cols-2 justify-center gap-2.5 pt-1">
                {me.hand.map((c) => {
                  const ok = myTurn && usable(c);
                  const on = sel?.kind === 'hand' && sel.uid === c.uid;
                  return (
                    <Card
                      key={c.uid}
                      id={c.id}
                      size="md"
                      selected={on}
                      dim={!ok}
                      onClick={() => { sfx.click(); setMode(null); setSel({ kind: 'hand', uid: c.uid }); setShowHand(false); }}
                    />
                  );
                })}
                {me.hand.length === 0 && <p className="px-6 py-10 text-sm text-white/80">Tanganmu kosong</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* log mobile */}
      <AnimatePresence>
        {showLog && (
          <motion.div className="fixed inset-0 z-40 flex items-end bg-black/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLog(false)}>
            <div className="panel flex h-[62dvh] w-full flex-col !rounded-b-none p-3 text-xs" onClick={(e) => e.stopPropagation()}>
              <div className="mb-2 flex shrink-0 items-center justify-between font-extrabold"><span>Riwayat duel</span><button onClick={() => setShowLog(false)} aria-label="Tutup"><X size={16} /></button></div>
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
            {banner.cardId && isMobile ? (
              <div className="panel flex max-w-[92vw] items-center gap-2 !rounded-full px-4 py-2 text-xs">
                <span className="shrink-0 text-base leading-none">{CARDS[banner.cardId]?.icon}</span>
                <span className="shrink-0 text-white/85">
                  {banner.trap ? 'Jebakan aktif' : banner.side === 'player' ? 'Kamu memainkan' : `${g.names.enemy} memainkan`}
                </span>
                <b className="truncate text-white">{CARDS[banner.cardId]?.name}</b>
              </div>
            ) : banner.cardId ? (
              <div className="flex flex-col items-center gap-2">
                <span className={clsx('tcg-hex-tag text-xs', banner.side === 'player' ? 'is-me' : 'is-foe')}>
                  {banner.trap ? 'Jebakan aktif · ' : banner.side === 'player' ? 'Kamu memainkan' : `${g.names.enemy} memainkan`}
                </span>
                <Card id={banner.cardId} size="lg" glow />
              </div>
            ) : (
              <div
                className="px-10 py-4 text-3xl font-black uppercase tracking-wider text-white sm:text-5xl"
                style={{ WebkitTextStroke: '4px #0b2160', paintOrder: 'stroke fill', textShadow: '0 5px 0 #0b2160, 0 10px 18px rgba(0,0,0,.6)' }}
              >
                {banner.text}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* konfirmasi menyerah */}
      <AnimatePresence>
        {confirmQuit && !g.winner && (
          <motion.div className="fixed inset-0 z-[55] flex items-center justify-center bg-[#031634]/80 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="panel w-full max-w-sm space-y-3 p-5 text-center">
              <p className="text-lg font-extrabold tracking-tight">Menyerah?</p>
              <p className="text-sm text-white/85">Kamu akan dianggap kalah.</p>
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
          <motion.div className="fixed inset-0 z-[56] flex items-center justify-center bg-[#031634]/85 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring' }} className="panel w-full max-w-sm space-y-4 p-6 text-center">
              <h2
                className={clsx('text-4xl font-black uppercase tracking-wider', g.winner === 'player' ? 'text-yellow-200' : 'text-red-300')}
                style={{ textShadow: '0 3px 0 rgba(0,0,0,.5)' }}
              >
                {g.winner === 'player' ? 'Menang!' : 'Kalah'}
              </h2>
              <p className="text-sm text-white/85">{g.reason} · {g.turn} giliran</p>
              {reward != null && (
                <p className="tcg-currency mx-auto !px-4 !py-1 text-base">+{reward} koin</p>
              )}
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