import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Flame, Gem, ShieldCheck, ShieldHalf, Snowflake, Sparkles, Swords, Moon, Shield } from 'lucide-react';
import { CARDS } from '../data/cards.js';
import { ELEMENTS } from '../data/elements.js';
import { RARITY } from '../engine/constants.js';

export const TILE_SIZE = 'u-size';

export function Floats({ items }) {
  return items.map((f) => (
    <span
      key={f.id}
      className="pointer-events-none absolute top-1/3 z-30 -translate-x-1/2 animate-floatUp whitespace-nowrap text-[1.2em] font-semibold"
      style={{ left: `${38 + (f.id % 4) * 8}%`, color: f.color, textShadow: '0 1px 4px #000, 0 0 6px #000' }}
    >
      {f.text}
    </span>
  ));
}

const Ico = ({ children, title }) => (
  <span title={title} className="flex h-[1.25em] w-[1.25em] items-center justify-center rounded-[0.3em] bg-white/10 text-white/90">
    {children}
  </span>
);

// Ubin monster di papan. Ukuran 100% dari pembungkus (9em x 10.5em).
export default function MonsterTile({ inst, stats, side, selected, targetable, flash, attack, onClick, onHover }) {
  const d = CARDS[inst.id];
  const el = ELEMENTS[d.element];
  const r = RARITY[d.rarity];
  const pct = Math.max(0, Math.min(100, (inst.hp / inst.maxHp) * 100));
  const def = inst.pos === 'def';
  const exhausted = inst.acted || inst.sick || inst.frozen;
  const dir = side === 'player' ? -1 : 1;
  const atkBuff = stats.atk > d.atk;
  const defBuff = stats.def > d.def;
  const hi = d.rarity !== 'C';

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => onHover?.({ cardId: inst.id, side })}
      onMouseLeave={() => onHover?.(null)}
      animate={attack ? { y: [0, dir * 30, 0], scale: [1, 1.05, 1] } : { y: 0, scale: 1 }}
      transition={{ duration: 0.45 }}
      className={clsx(
        'absolute inset-0 flex cursor-pointer select-none flex-col overflow-hidden rounded-[0.6em] border bg-[#0d1017]',
        flash && `fx-${flash}`,
        targetable && 'animate-pulseRing ring-2 ring-rose-400',
        selected && 'ring-2 ring-white',
        side === 'player' && exhausted && !targetable && 'brightness-75',
      )}
      style={{
        borderColor: hi ? `${r.color}aa` : 'rgba(255,255,255,.14)',
        backgroundImage: `radial-gradient(100% 55% at 50% 0%, ${el.color}2e, transparent 100%)`,
      }}
    >
      <i className="absolute inset-x-0 top-0 h-[0.18em]" style={{ background: el.color }} />
      {def && <div className="pointer-events-none absolute inset-0 bg-sky-400/[0.07]" />}

      {/* nama + status */}
      <div className="flex items-start justify-between gap-[0.2em] px-[0.45em] pt-[0.5em]">
        <span className="line-clamp-1 text-[0.66em] font-semibold leading-tight tracking-tight text-white">{d.name}</span>
        <span className="flex shrink-0 gap-[0.15em] text-[0.62em] leading-none">
          {inst.shield && <Ico title="Perisai"><ShieldCheck size="0.9em" /></Ico>}
          {stats.kw.includes('taunt') && <Ico title="Penjaga"><Shield size="0.9em" /></Ico>}
          {inst.frozen && <Ico title="Membeku"><Snowflake size="0.9em" className="text-sky-300" /></Ico>}
          {inst.burn > 0 && <Ico title="Terbakar"><Flame size="0.9em" className="text-orange-300" /></Ico>}
          {inst.sick && !inst.frozen && <Ico title="Baru dipanggil"><Moon size="0.9em" /></Ico>}
        </span>
      </div>

      {/* glyph */}
      <div className="relative flex flex-1 items-center justify-center">
        <span className="relative text-[2.6em] leading-none" style={{ filter: `saturate(.85) drop-shadow(0 0 0.3em ${el.color}88)` }}>{d.icon}</span>
        <span className="absolute left-[0.45em] top-0 text-[0.7em] text-slate-400" title={def ? 'Bertahan' : 'Menyerang'}>
          {def ? <ShieldHalf size="1em" /> : <Swords size="1em" />}
        </span>
        {d.skill && <span className="absolute bottom-0 right-[0.45em] text-[0.7em] text-indigo-300" title="Punya skill"><Sparkles size="1em" /></span>}
        {inst.equips.length > 0 && (
          <span className="absolute bottom-0 left-[0.45em] flex items-center gap-[0.15em] text-[0.7em] text-slate-300">
            <Gem size="1em" /> {inst.equips.length}
          </span>
        )}
      </div>

      {/* statistik */}
      <div className="flex justify-between px-[0.55em] text-[0.8em] font-semibold leading-none">
        <span className={atkBuff ? 'text-emerald-300' : 'text-white'}>
          <i className="mr-[0.25em] text-[0.62em] font-medium not-italic text-slate-500">ATK</i>{stats.atk}
        </span>
        <span className={defBuff ? 'text-emerald-300' : 'text-white'}>
          <i className="mr-[0.25em] text-[0.62em] font-medium not-italic text-slate-500">DEF</i>{stats.def}
        </span>
      </div>

      {/* HP */}
      <div className="mx-[0.55em] mb-[0.5em] mt-[0.4em]">
        <div className="flex justify-between text-[0.62em] leading-none text-slate-500">
          <span>HP</span>
          <b className="font-semibold text-white">{inst.hp}</b>
        </div>
        <div className="mt-[0.25em] h-[0.3em] overflow-hidden rounded-full bg-white/10">
          <div
            className={clsx('h-full transition-all duration-300', pct > 55 ? 'bg-emerald-400' : pct > 25 ? 'bg-yellow-300' : 'bg-rose-400')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}