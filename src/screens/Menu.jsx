import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, ChevronRight, Coins, Combine, Flame, Layers, Library,
  RotateCcw, ShoppingBag, Sparkles, Swords, Trophy, Volume2, VolumeX,
} from 'lucide-react';
import Card, { CardBack } from '../components/Card.jsx';
import { useStore } from '../store/useStore.js';
import { ALL_CARDS } from '../data/cards.js';
import { ELEMENT_LIST } from '../data/elements.js';
import { sfx } from '../lib/sfx.js';

/* ------------------------------------------------------------------ */
/*  Data tampilan                                                     */
/* ------------------------------------------------------------------ */
// 5 kartu kipas di hero (di layar kecil hanya 3 di tengah yang tampil)
const FAN = [
  { id: 'api_phoenix',   rotate: -14, y: 16, glow: '#f97316', hideSm: true },
  { id: 'api_naga',      rotate: -7,  y: 4,  glow: '#fb923c' },
  { id: 'chy_serafim',   rotate: 0,   y: -10, glow: '#a78bfa' },
  { id: 'glp_raja',      rotate: 7,   y: 4,  glow: '#7c3aed' },
  { id: 'air_leviathan', rotate: 14,  y: 16, glow: '#38bdf8', hideSm: true },
];

const BG_CARDS = [
  { x: '2%',  y: '12%', rot: -16, scale: 0.44, delay: 0,   dur: 11 },
  { x: '90%', y: '16%', rot: 13,  scale: 0.42, delay: 1.2, dur: 13 },
  { x: '1%',  y: '58%', rot: 7,   scale: 0.4,  delay: 2.4, dur: 12 },
  { x: '92%', y: '60%', rot: -10, scale: 0.44, delay: 0.6, dur: 14 },
];

const TIPS = [
  'Hancurkan monster lawan untuk mengambil kartu hadiah, monster GX/EX memberi 2.',
  'Kumpulkan 3 kartu yang sama untuk membuka Fusi Skill.',
  'Gacha: Legenda dijamin muncul paling lambat di tarikan ke-40.',
  'Pack Premium menjamin rarity tinggi di setiap bungkus.',
  'Giliran pertama belum boleh menyerang, siapkan pertahananmu.',
  'Cocokkan elemen monster dengan kelemahan lawan untuk damage lebih besar.',
];

const PRIMARY = { id: 'setup', label: 'Mulai Duel', sub: 'Lawan 8 juara elemen', icon: Swords };

/* ------------------------------------------------------------------ */
/*  Komponen kecil                                                    */
/* ------------------------------------------------------------------ */
function Tile({ icon: Icon, color, label, value, children }) {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035] p-2.5 sm:p-3">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="flex min-w-0 items-center gap-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:gap-1.5 sm:text-[10px] sm:tracking-wider">
        {Icon && <Icon size={12} className="shrink-0" style={{ color }} />}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 text-xl font-bold leading-none tabular-nums text-white">{value}</div>
      {children}
    </div>
  );
}

function Ticker({ tips, reverse = false, className = '' }) {
  return (
    <div className={`relative w-full max-w-xl overflow-hidden rounded-full border border-white/[0.07] bg-black/35 py-1.5 backdrop-blur ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#070910] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#070910] to-transparent" />
      <div
        className="cd-anim flex w-max whitespace-nowrap"
        style={{ animation: `cd-marquee 45s linear infinite ${reverse ? 'reverse' : 'normal'}` }}
      >
        {[...tips, ...tips].map((t, i) => (
          <span key={i} className="mx-6 inline-flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles size={11} className="text-indigo-300" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function MenuButton({ item, index, onGo }) {
  const Icon = item.icon;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onGo}
      className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035] p-3.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.07]"
    >
      <span className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }} />
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: item.color }}
      />
      {item.badge && (
        <span className="absolute right-2.5 top-2.5 rounded-full px-1.5 py-[1px] text-[9px] font-extrabold tracking-wider text-slate-950" style={{ background: item.color }}>
          {item.badge}
        </span>
      )}
      <span
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/35"
        style={{ color: item.color, boxShadow: `0 0 14px ${item.color}30` }}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight text-slate-100">{item.label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{item.sub}</span>
      </span>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Halaman menu                                                      */
/* ------------------------------------------------------------------ */
export default function Menu({ go }) {
  const { gold, stats, muted, toggleMute, resetAll, collection } = useStore();

  const totalCards = useMemo(() => ALL_CARDS.filter((c) => !c.fused && !c.token).length, []);
  const owned = Object.keys(collection).filter((id) => collection[id] > 0).length;
  const ownedPct = totalCards ? Math.min(100, Math.round((owned / totalCards) * 100)) : 0;
  const games = stats.wins + stats.losses;
  const winRate = games ? Math.round((stats.wins / games) * 100) : 0;

  const secondary = [
    { id: 'deck',       label: 'Deck',      sub: 'Susun strategimu',      icon: Layers,      color: '#38bdf8' },
    { id: 'collection', label: 'Koleksi',   sub: `${owned} kartu unik`,   icon: Library,     color: '#c084fc' },
    { id: 'shop',       label: 'Toko Pack', sub: 'Pack biasa & premium',  icon: ShoppingBag, color: '#fbbf24' },
    { id: 'gacha',      label: 'Gacha',     sub: 'Tarik kartu acak',      icon: Sparkles,    color: '#f472b6', badge: 'BARU' },
    { id: 'fusion',     label: 'Fusi Skill', sub: 'Gabung skill kartu',   icon: Combine,     color: '#34d399', badge: 'BARU' },
    { id: 'rules',      label: 'Cara Main', sub: 'Aturan & elemen',       icon: BookOpen,    color: '#94a3b8' },
  ];

  // partikel cahaya (posisi deterministik, tanpa random saat render)
  const particles = useMemo(
    () => Array.from({ length: 22 }).map((_, i) => ({
      left: `${(i * 47) % 100}%`,
      size: 2 + (i % 3),
      dur: 9 + ((i * 7) % 9),
      delay: -((i * 3) % 12),
      color: ELEMENT_LIST[i % ELEMENT_LIST.length].color,
    })),
    [],
  );

  const go2 = (id) => { sfx.click(); go(id); };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden text-slate-100">
      <style>{`
        @keyframes cd-aurora { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(4%,-3%,0) scale(1.15); } }
        @keyframes cd-rise { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .75; } 100% { transform: translateY(-115vh); opacity: 0; } }
        @keyframes cd-marquee { to { transform: translateX(-50%); } }
        @keyframes cd-shine { 0% { transform: translateX(-130%) skewX(-18deg); } 55%,100% { transform: translateX(330%) skewX(-18deg); } }
        @keyframes cd-grad { to { background-position: 200% 50%; } }
        @media (prefers-reduced-motion: reduce) { .cd-anim { animation: none !important; } }
      `}</style>

      {/* ===== LATAR ===== */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[#05070c]" />
      <div
        className="cd-anim pointer-events-none absolute -left-[10%] -top-[18%] -z-20 h-[60vh] w-[60vw] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,.45), transparent 65%)', animation: 'cd-aurora 16s ease-in-out infinite' }}
      />
      <div
        className="cd-anim pointer-events-none absolute -bottom-[20%] -right-[10%] -z-20 h-[55vh] w-[55vw] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(217,70,239,.38), transparent 65%)', animation: 'cd-aurora 19s ease-in-out infinite reverse' }}
      />
      <div
        className="cd-anim pointer-events-none absolute -bottom-[10%] left-[5%] -z-20 h-[40vh] w-[40vw] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,.3), transparent 65%)', animation: 'cd-aurora 22s ease-in-out infinite' }}
      />
      {/* grid halus */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.5]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, #000 20%, transparent 78%)',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, #000 20%, transparent 78%)',
        }}
      />
      {/* partikel */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {particles.map((p, i) => (
          <span
            key={i}
            className="cd-anim absolute rounded-full"
            style={{
              left: p.left, bottom: -12, width: p.size, height: p.size, background: p.color,
              boxShadow: `0 0 8px ${p.color}`, animation: `cd-rise ${p.dur}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
        {/* kartu latar */}
        {BG_CARDS.map((c, i) => (
          <motion.div
            key={i}
            className="absolute hidden will-change-transform md:block"
            style={{ left: c.x, top: c.y, scale: c.scale, rotate: c.rot, opacity: 0.18 }}
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
          >
            <CardBack size="sm" />
          </motion.div>
        ))}
      </div>

      {/* ===== ISI ===== */}
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1400px] flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">

        {/* konten utama */}
        <main className="flex flex-1 flex-col gap-6 py-5 lg:grid lg:grid-cols-[1.05fr_1fr] lg:grid-rows-[auto_auto] lg:content-center lg:items-center lg:gap-x-12 lg:gap-y-0 lg:py-6">

          {/* ---------- HERO ---------- */}
          <section className="flex flex-col items-center text-center lg:col-start-1 lg:row-start-1">
            {/* ticker atas */}
            <Ticker tips={TIPS.slice(0, 3)} reverse className="mb-5" />

            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 backdrop-blur"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              Duel kartu elemental
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 110, damping: 16 }}
              className="cd-anim mt-4 text-4xl font-black tracking-[0.12em] min-[400px]:text-5xl min-[400px]:tracking-[0.14em] sm:text-6xl xl:text-7xl"
              style={{
                backgroundImage: 'linear-gradient(100deg, #f0f4ff, #a5b4fc, #e879f9, #fb923c, #f0f4ff)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 22px rgba(167,139,250,.4))',
                animation: 'cd-grad 8s linear infinite',
              }}
            >
              CARDERAD
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400"
            >
              Delapan elemen, ratusan kartu, satu medan perang. Susun deck terbaikmu dan kalahkan para juara.
            </motion.p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {[
                { v: ELEMENT_LIST.length, l: 'Elemen' },
                { v: totalCards, l: 'Kartu' },
                { v: 8, l: 'Juara' },
              ].map((s) => (
                <span key={s.l} className="inline-flex items-baseline gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-1.5">
                  <b className="text-sm tabular-nums text-white">{s.v}</b>
                  <span className="text-[11px] text-slate-500">{s.l}</span>
                </span>
              ))}
            </div>

          </section>

          {/* ---------- PANEL MENU ---------- */}
          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="mx-auto w-full max-w-[560px] space-y-3 rounded-2xl border border-white/10 bg-black/40 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-4 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            {/* koin & suara */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3">
                <Coins size={15} className="text-amber-400" />
                <b className="text-base tabular-nums text-amber-100">{gold.toLocaleString()}</b>
                <span className="text-[11px] text-amber-200/60">koin</span>
              </span>
              <button
                onClick={toggleMute}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-white/25 hover:text-white"
                aria-label="Suara"
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            {/* statistik */}
            <div className="grid grid-cols-3 gap-2">
              <Tile icon={Trophy} color="#fbbf24" label="Menang" value={`${winRate}%`}>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${winRate}%` }} />
                </div>
                <div className="mt-1 text-[10px] tabular-nums text-slate-500">{stats.wins}M · {stats.losses}K</div>
              </Tile>
              <Tile icon={Flame} color="#fb923c" label="Beruntun" value={stats.streak || 0}>
                <div className="mt-2 flex gap-[3px]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full ${i < (stats.streak || 0) ? 'bg-orange-400' : 'bg-white/10'}`} />
                  ))}
                </div>
                <div className="mt-1 text-[10px] text-slate-500">kemenangan</div>
              </Tile>
              <Tile icon={Library} color="#c084fc" label="Koleksi" value={`${ownedPct}%`}>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" style={{ width: `${ownedPct}%` }} />
                </div>
                <div className="mt-1 text-[10px] tabular-nums text-slate-500">{owned}/{totalCards}<span className="hidden sm:inline"> kartu</span></div>
              </Tile>
            </div>

            {/* tombol utama */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => go2(PRIMARY.id)}
              className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-4 text-left shadow-lg shadow-indigo-500/30"
            >
              <span
                className="cd-anim pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                style={{ animation: 'cd-shine 3.6s ease-in-out infinite' }}
              />
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/25 ring-1 ring-white/25">
                <Swords size={22} className="text-white" />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="block text-lg font-extrabold leading-tight tracking-tight text-white">{PRIMARY.label}</span>
                <span className="mt-0.5 block text-xs text-white/75">{PRIMARY.sub}</span>
              </span>
              <ChevronRight size={20} className="relative shrink-0 text-white/80 transition group-hover:translate-x-1" />
            </motion.button>

            {/* menu lain */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {secondary.map((it, i) => (
                <MenuButton key={it.id} item={it} index={i} onGo={() => go2(it.id)} />
              ))}
            </div>

            {/* reset progres */}
            <button
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-2.5 text-xs font-semibold text-rose-300/80 transition hover:border-rose-400/50 hover:bg-rose-500/15 hover:text-rose-200 active:scale-[0.99]"
              onClick={() => {
                if (window.confirm('Hapus semua progres (koleksi, deck, koin) dan mulai dari awal?')) resetAll();
              }}
            >
              <RotateCcw size={14} className="transition-transform duration-500 group-hover:-rotate-180" />
              Reset Progres
            </button>
          </motion.section>

          {/* ---------- KIPAS KARTU ---------- */}
          <section className="flex flex-col items-center lg:col-start-1 lg:row-start-2">
            {/* kipas kartu */}
            <div className="relative mt-1 flex items-end justify-center pb-4 lg:mt-8">
              <div className="pointer-events-none absolute -bottom-2 left-1/2 h-14 w-[78%] -translate-x-1/2 rounded-[50%] bg-indigo-500/25 blur-2xl" />
              {FAN.map((item, i) => (
                <motion.div
                  key={item.id}
                  className={`relative ${item.hideSm ? 'hidden sm:block' : ''} ${i === 1 ? 'sm:-ml-[30px]' : i > 1 ? '-ml-[30px]' : ''}`}
                  style={{ zIndex: 10 - Math.abs(i - 2) * 2 }}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: item.y, rotate: item.rotate }}
                  transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 95, damping: 14 }}
                  whileHover={{ y: item.y - 16, scale: 1.06, zIndex: 30 }}
                >
                  <div className="absolute -inset-3 rounded-2xl opacity-40 blur-xl" style={{ background: item.glow }} />
                  <Card id={item.id} size="md" className="sm:!text-[13px] xl:!text-[14px]" />
                </motion.div>
              ))}
            </div>

            {/* ticker bawah */}
            <Ticker tips={TIPS.slice(3)} className="mt-4" />
          </section>
        </main>

      </div>
    </div>
  );
}