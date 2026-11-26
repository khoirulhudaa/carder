import clsx from 'clsx';
import { CARDS } from '../data/cards.js';
import { ELEMENTS } from '../data/elements.js';
import { RARITY, TYPE_NAMES } from '../engine/constants.js';
import { describeCard } from '../data/describe.js';
import './card-foil.css';
import './card-trainer.css';
import CardArt from './CardArt.jsx';

// Seluruh ukuran kartu memakai satuan "em" -> cukup ganti font-size untuk skala.
export const SIZE = {
  xs: 'text-[9px]',
  sm: 'text-[12px]',
  md: 'text-[16px]',
  lg: 'text-[21px]',
  xl: 'text-[27px]',
  hand: 'u-size',
  grid: 'text-[13px] sm:text-[15px] md:text-[16px]',
};

const STARS = { C: 1, R: 2, E: 3, L: 4 };
const FONT = { fontFamily: 'var(--font-ui, Inter, system-ui, -apple-system, "Segoe UI", sans-serif)', fontFeatureSettings: '"tnum"' };

const TAG_GRADIENT = {
  rainbow: 'linear-gradient(90deg,#ff5f6d,#ffc371,#f9f871,#6dffb3,#5fd3ff,#b57bff,#ff5f6d)',
  holo: 'linear-gradient(90deg,#c9d6ff,#f6d5ff,#ffe9c9,#c9fff1,#c9d6ff)',
  gold: 'linear-gradient(90deg,#b07a00,#ffe27a,#fff8c9,#e0a200,#b07a00)',
  aurora: 'linear-gradient(90deg,#00ffa3,#03e1ff,#8a5cff,#ff5cf0,#00ffa3)',
  cosmic: 'linear-gradient(90deg,#8a5cff,#ff4fd8,#2cd8ff,#8a5cff)',
  ember: 'linear-gradient(90deg,#ff3d00,#ffb300,#fff1a8,#ff3d00)',
  frost: 'linear-gradient(90deg,#6fe3ff,#ffffff,#6fe3ff)',
  emerald: 'linear-gradient(90deg,#25e07a,#e6ffb0,#25e07a)',
  trainer: 'linear-gradient(90deg,#ffffff,#fde68a,#ffffff)',
};

// ikon tiap elemen & kategori kartu
const EL_ICON = { api: '🔥', air: '💧', tanah: '🪨', angin: '🌪️', petir: '⚡', alam: '🌿', cahaya: '✨', gelap: '🌑', netral: '☯️' };
const TYPE_ICON = { monster: '🐾', spell: '📜', relic: '💍', trap: '🪤', field: '🏞️', trainer: '🎓' };

export function CardBack({ size = 'md', className }) {
  return (
    <div className={clsx('relative shrink-0 select-none', SIZE[size], className)} style={{ width: '10em', height: '14em' }}>
      <div className="absolute inset-0 rounded-[0.6em] bg-gradient-to-br from-white/25 to-white/5 p-[0.08em]">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[0.54em] bg-[#0d1017]">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 60% at 50% 40%, rgba(129,140,248,.28), transparent 70%)' }} />
          <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" fill="none" stroke="#a5b4fc" aria-hidden>
            <circle cx="50" cy="70" r="12" strokeWidth=".6" opacity=".9" />
            <circle cx="50" cy="70" r="22" strokeWidth=".35" opacity=".5" strokeDasharray="1.5 2.5" />
            <circle cx="50" cy="70" r="34" strokeWidth=".3" opacity=".3" />
            <rect x="8" y="8" width="84" height="124" rx="4" strokeWidth=".3" opacity=".25" />
          </svg>
        </div>
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div className="leading-none">
    <div className="text-[0.34em] text-[#7c8498]">{label}</div>
    <div className="mt-[0.15em] text-[0.74em] font-semibold text-white">{value}</div>
  </div>
);

export default function Card({ id, size = 'md', selected, dim, glow, onClick, count, className, onMouseMove, ...rest }) {
  const c = CARDS[id];
  if (!c) return null;
  const el = ELEMENTS[c.element] || ELEMENTS.netral || { from: '#334155', to: '#64748b', color: '#94a3b8', icon: '✦' };
  const r = RARITY[c.rarity];
  const lines = describeCard(c);
  const mon = c.type === 'monster';
  const foil = c.foil || null;
  const trainer = c.skin === 'trainer';
  const grad = c.grad || ['#0f3d4a', '#1e1b4b'];
  const typeName = trainer ? 'Trainer' : TYPE_NAMES[c.type];
  const typeIcon = TYPE_ICON[trainer ? 'trainer' : c.type] || '';
  const elIcon = EL_ICON[c.element] || el.icon || '✦';
  const stars = STARS[c.rarity] || 1;
  const elName = el.name || c.element;
  const accent = el.color;

  const handleMove = (e) => {
    if (foil || c.rarity === 'L') {
      const b = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width;
      const y = (e.clientY - b.top) / b.height;
      const s = e.currentTarget.style;
      s.setProperty('--mx', `${x * 100}%`);
      s.setProperty('--my', `${y * 100}%`);
      s.setProperty('--rx', `${(0.5 - y) * 8}deg`);
      s.setProperty('--ry', `${(x - 0.5) * 10}deg`);
    }
    onMouseMove?.(e);
  };

  // bingkai hairline: netral untuk Common, bernuansa warna rarity untuk R/E/L
  const frameStyle = foil || trainer
    ? {}
    : {
        background:
          c.rarity === 'C'
            ? 'linear-gradient(160deg, rgba(255,255,255,.2), rgba(255,255,255,.06))'
            : `linear-gradient(160deg, ${r.color}, rgba(255,255,255,.1) 65%)`,
      };

  return (
    <div
      {...rest}
      onClick={onClick}
      onMouseMove={handleMove}
      className={clsx(
        'card3d relative w-full shrink-0 select-none transition-transform duration-150',
        SIZE[size],
        onClick && 'cursor-pointer',
        dim && 'brightness-[.55] saturate-50',
        className,
      )}
      style={{ width: '10em', height: '14em', ...FONT }}
      
      // size card for mobile device
      // style={{ width: '100%', height: '16.5em', ...FONT }}

    >
      <div
        className={clsx('card-inner absolute inset-0 rounded-[0.6em] p-[0.08em]', foil && `frame-anim frame-${foil}`, trainer && 'trainer-frame')}
        style={{
          ...frameStyle,
          boxShadow: selected
            ? `0 0 0 0.12em #fff, 0 0 1.2em ${accent}88`
            : glow
              ? `0 0 0.9em ${accent}88`
              : foil
                ? `0 0.3em 1.2em rgba(0,0,0,.55), 0 0 0.9em ${accent}44`
                : '0 0.3em 0.9em rgba(0,0,0,.45)',
        }}
      >
        <div
          className={clsx('relative flex h-full w-full flex-col overflow-hidden rounded-[0.54em] text-[#e8eaf0]', trainer ? 'trainer-face' : 'bg-[#0d1017]', !foil && !trainer && c.rarity === 'L' && 'holo-soft')}
          style={trainer ? { '--t1': grad[0], '--t2': grad[1] } : { backgroundImage: `radial-gradient(90% 35% at 50% 0%, ${accent}22, transparent 100%)` }}
        >
          {/* ===== kepala ===== */}
          <div className="flex items-start gap-[0.4em] px-[0.5em] pt-[0.45em]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[0.3em]">
                <span className="line-clamp-2 text-[0.6em] font-semibold leading-[1.1] tracking-[-0.01em] text-white">{c.name}</span>
                {c.tag && (
                  <span className="shrink-0 rounded-[0.25em] border border-white/25 px-[0.35em] py-[0.08em] text-[0.4em] font-bold leading-none">
                    <span className="tag-chip" style={{ backgroundImage: TAG_GRADIENT[foil || (trainer ? 'trainer' : '')] || TAG_GRADIENT.rainbow }}>
                      {c.tag}
                    </span>
                  </span>
                )}
              </div>
              <div className="mt-[0.4em] ml-[-2px] text-[0.42em] leading-none text-[#7c8498]">
                {c.token ? 'Token' : `${typeIcon} ${typeName}`}
                {c.race ? ` · ${c.race}` : ''}
              </div>
            </div>
            <span
              className="flex h-[1.5em] w-[1.5em] shrink-0 items-center justify-center rounded-full border text-[0.78em] font-semibold leading-none"
              style={{ borderColor: `${accent}`, color: accent, background: `${accent}14` }}
              title="Biaya"
            >
              {c.cost}
            </span>
          </div>

          {/* ===== gambar ===== */}
          <div className="relative mx-[0.45em] mt-[0.35em] h-[4.3em] shrink-0 overflow-hidden rounded-[0.35em] ring-1 ring-inset ring-white/10">
            <CardArt card={c} el={el} />
          </div>

          {/* elemen + rarity */}
          <div className="mx-[0.55em] mt-[0.35em] flex items-center justify-between text-[0.4em] pt-3 px-1 leading-none text-[#98a0b3]">
            <span className="flex items-center w-max gap-[0em]">
              <span className="text-[1.3em] leading-none" aria-hidden>{elIcon}</span>
              <span className="text-[1em] relative top-[0.8px] font-semibold leading-none" title={elName}>{elName}</span> 
            </span>
            <span className="flex items-center gap-[0.35em]" title={r.name}>
              {Array.from({ length: 4 }, (_, i) => (
                <i key={i} className="inline-block h-[0.7em] w-[0.7em] rotate-45" style={{ background: i < stars ? r.color : 'rgba(255,255,255,.12)' }} />
              ))}
            </span>
          </div>

          {/* ===== efek ===== */}
          <div className={clsx('mx-[0.55em] px-1.5 mt-[0.8em] flex min-h-0 flex-1 flex-col gap-[0.25em] overflow-hidden', trainer ? 'text-[0.4em] leading-[1.25]' : 'text-[0.47em] leading-[1.25]')}>
            {lines.map((l, i) => (
              <div key={i}>
                <div className="flex items-center gap-[0.4em]">
                  {l.skill ? (
                    <span className="flex gap-[0.15em]">
                      {Array.from({ length: Math.min(c.skill?.cost || 0, 5) }, (_, k) => (
                        <i key={k} className="inline-block h-[0.8em] w-[0.8em] rounded-full" style={{ background: accent }} />
                      ))}
                    </span>
                  ) : (
                    <></>
                    // <i className="inline-block h-[0.35em] w-[0.35em] rounded-full" style={{ background: accent }} />
                  )}
                  <b className="font-semibold" style={{ color: l.skill ? '#fff' : accent }}>
                    {l.k}
                  </b>
                </div>
                <p className="text-[#aab1c2]">{l.text}</p>
              </div>
            ))}
            {c.flavor && lines.length <= 1 && !c.token && <p className="mt-auto line-clamp-2 text-[0.92em] italic text-[#6b7387]">{c.flavor}</p>}
          </div>

          {/* ===== statistik ===== */}
          <div className="mx-[0.55em] mb-[0.4em] mt-[0.2em] flex items-end justify-between border-t border-white/10 pt-[0.3em]">
            {mon ? (
              <>
                <Stat label="ATK" value={c.atk} />
                <Stat label="DEF" value={c.def} />
                <Stat label="HP" value={c.hp} />
              </>
            ) : (
              <span className="text-[0.42em] leading-none text-[#7c8498]">
                {typeIcon} {typeName} · {r.name}
              </span>
            )}
          </div>

          {foil && (
            <>
              <div className={`foil-sheen sheen-${foil}`} />
              <div className="foil-glitter" />
            </>
          )}
        </div>
      </div>

      {count != null && (
        <span className="absolute -right-[0.4em] -top-[0.4em] z-10 flex h-[1.8em] min-w-[1.8em] items-center justify-center rounded-full border border-white/20 bg-[#0d1017] px-[0.3em] text-[0.7em] font-semibold text-white">
          ×{count}
        </span>
      )}
    </div>
  );
}