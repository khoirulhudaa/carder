import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen, Coins, Combine, Crown, Flame, Gift, Layers, Library, Plus,
  RotateCcw, ShoppingBag, Sparkles, Swords, Target, Trophy, Volume2, VolumeX,
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store/useStore.js';
import { ALL_CARDS } from '../data/cards.js';
import { PACK_PRICE } from '../engine/constants.js';
import { sfx } from '../lib/sfx.js';

/* ------------------------------------------------------------------ */
/*  Data tampilan                                                     */
/* ------------------------------------------------------------------ */
const TIPS = [
  'Hancurkan monster lawan untuk mengambil kartu hadiah, monster GX/EX memberi 2.',
  'Kumpulkan 3 kartu yang sama untuk membuka Fusi Skill.',
  'Gacha: Legenda dijamin muncul paling lambat di tarikan ke-40.',
  'Pack Premium menjamin rarity tinggi di setiap bungkus.',
  'Giliran pertama belum boleh menyerang, siapkan pertahananmu.',
  'Cocokkan elemen monster dengan kelemahan lawan untuk damage lebih besar.',
];

const BANNERS = [
  { id: 'gacha',  title: 'Gacha Legenda',  sub: 'Dijamin muncul paling lambat di tarikan ke-40', icon: Sparkles, tone: 'linear-gradient(120deg,#7a2fd0,#3b2aa8)', cta: 'Tarik' },
  { id: 'fusion', title: 'Fusi Skill',     sub: 'Gabungkan 3 kartu sama jadi kartu baru',        icon: Combine,  tone: 'linear-gradient(120deg,#e0702a,#b43c18)', cta: 'Coba' },
  { id: 'shop',   title: 'Pack Premium',   sub: 'Rarity tinggi di setiap bungkus',               icon: Gift,     tone: 'linear-gradient(120deg,#1f9a5a,#0f6a8f)', cta: 'Beli' },
];

/* ------------------------------------------------------------------ */
/*  Bahan gaya emas bersama (tanpa skew, rounded biasa)               */
/* ------------------------------------------------------------------ */
const GOLD_BG = 'linear-gradient(180deg, rgba(40,52,130,.85) 0%, rgba(10,18,64,.95) 100%)';
const GOLD_SHADOW =
  'inset 0 1px 0 rgba(255,236,150,.55), inset 0 -2px 0 rgba(224,160,40,.65), 0 2px 8px rgba(0,0,0,.45)';
const GOLD_BTN = 'linear-gradient(180deg,#fff3b0 0%,#ffc933 50%,#e08a12 100%)';

/* panel emas: border + highlight + bayangan seragam */
function GoldPanel({ as: Tag = 'div', bg, className, style, ...props }) {
  return (
    <Tag
      className={clsx('relative border border-yellow-200/60', className)}
      style={{ background: bg || GOLD_BG, boxShadow: GOLD_SHADOW, ...style }}
      {...props}
    />
  );
}

/* lingkaran ikon emas */
function GoldIcon({ className, children }) {
  return (
    <span
      className={clsx('relative flex shrink-0 items-center justify-center rounded-full border-2 border-yellow-200 text-slate-900 shadow-md', className)}
      style={{ background: GOLD_BTN }}
    >
      {children}
    </span>
  );
}

/* label kecil emas (Lv, CTA, badge) */
const GOLD_TAG = 'rounded-md bg-gradient-to-b from-yellow-200 to-amber-400 font-black text-slate-900';

/* garis emas bercahaya di tepi bar */
function GoldLine({ edge = 'top' }) {
  return (
    <span
      aria-hidden
      className={clsx('lb-anim pointer-events-none absolute inset-x-0 h-[2px]', edge === 'top' ? 'top-0' : 'bottom-0')}
      style={{
        background: 'linear-gradient(90deg, transparent, #b8741a 12%, #ffe27a 35%, #fff6c8 50%, #ffe27a 65%, #b8741a 88%, transparent)',
        boxShadow: '0 0 10px rgba(255,200,60,.8)',
        animation: 'lb-gold-line 2.6s ease-in-out infinite',
      }}
    />
  );
}

/* judul kecil panel */
function PanelTitle({ icon: Icon, iconClass, children, right }) {
  return (
    <div className="flex items-center justify-between px-1 pb-1.5 text-[11px] font-black uppercase tracking-wider">
      <span className="flex items-center gap-1.5 bg-gradient-to-b from-yellow-100 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
        {Icon && <Icon size={13} className={iconClass} />}
        {children}
      </span>
      {right !== undefined && <span className="tabular-nums text-white/80">{right}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Latar                                                             */
/* ------------------------------------------------------------------ */
function Backdrop() {
  return (
    <>
      <video src="/bg3.mp4" autoPlay muted loop className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,12,40,.65) 0%, rgba(6,12,40,0) 22%, rgba(6,12,40,0) 55%, rgba(6,12,40,.88) 100%),' +
            'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 40%, rgba(4,8,30,.55) 100%)',
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Komponen UI                                                       */
/* ------------------------------------------------------------------ */
function IconCircle({ onClick, label, children, className }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={clsx(
        'flex h-9 w-9 items-center justify-center rounded-full border border-yellow-200/50 bg-white/10 text-white transition hover:bg-white/20 active:scale-90',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* banner samping kiri */
function PromoCard({ icon: Icon, title, sub, badge, tone, onClick }) {
  return (
    <GoldPanel
      as="button"
      onClick={onClick}
      bg={tone}
      className="group flex items-center gap-2.5 overflow-hidden rounded-xl p-2 pr-4 text-left text-white transition hover:translate-x-1 active:scale-95"
      style={{ minWidth: 'clamp(54px, 14vw, 160px)' }}
    >
      <GoldIcon className="h-8 w-8 sm:h-9 sm:w-9">
        <Icon size={20} className="transition group-hover:scale-110" />
      </GoldIcon>
      <span className="hidden min-w-0 flex-col sm:flex">
        <span className="truncate text-sm font-black leading-tight">{title}</span>
        <span className="truncate text-[10px] font-semibold text-white/80">{sub}</span>
      </span>
      {badge && (
        <span className={clsx(GOLD_TAG, 'absolute -left-1 -top-1 rounded-br-lg rounded-tl-xl px-1.5 py-0.5 text-[8px]')}>
          {badge}
        </span>
      )}
    </GoldPanel>
  );
}

/* baris rekor di panel kanan */
function StatRow({ icon: Icon, tint, label, value, sub, bar, barClass }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-yellow-200/25 bg-black/25 p-2">
      <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-yellow-200/60 bg-gradient-to-b from-white/20 to-white/5', tint)}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[11px] font-extrabold uppercase tracking-wide text-white/85">{label}</span>
          <span className="text-sm font-black tabular-nums text-white">{value}</span>
        </div>
        {bar !== undefined && (
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
            <div className={clsx('h-full rounded-full', barClass)} style={{ width: `${bar}%` }} />
          </div>
        )}
        {sub && <div className="mt-0.5 text-[10px] tabular-nums text-white/60">{sub}</div>}
      </div>
    </div>
  );
}

/* tombol navigasi bawah */
function NavItem({ icon: Icon, label, dot, onClick }) {
  return (
    <GoldPanel
      as="button"
      onClick={onClick}
      className="group flex min-w-0 flex-1 gap-x-3 items-center justify-center gap-0.5 rounded-2xl py-3 transition hover:brightness-125 active:scale-95"
    >
      <GoldIcon className="h-8 w-8 transition group-hover:scale-110 sm:h-9 sm:w-9">
        <Icon size={18} strokeWidth={2.4} />
        {dot && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0a1240] bg-red-500" />}
      </GoldIcon>
      <span className="bg-gradient-to-b from-yellow-100 via-yellow-300 to-amber-500 bg-clip-text text-[10px] font-black tracking-wide text-transparent sm:text-xs">
        {label}
      </span>
    </GoldPanel>
  );
}

/* ------------------------------------------------------------------ */
/*  Halaman lobi                                                      */
/* ------------------------------------------------------------------ */
export default function Menu({ go }) {
  const { gold, stats, muted, toggleMute, resetAll, collection, decks, activeDeck } = useStore();
  const [tipIdx, setTipIdx] = useState(0);
  const [bannerIdx, setBannerIdx] = useState(0);

  const totalCards = useMemo(() => ALL_CARDS.filter((c) => !c.fused && !c.token).length, []);
  const owned = Object.keys(collection).filter((id) => collection[id] > 0).length;
  const ownedPct = totalCards ? Math.min(100, Math.round((owned / totalCards) * 100)) : 0;
  const games = stats.wins + stats.losses;
  const winRate = games ? Math.round((stats.wins / games) * 100) : 0;

  const xp = stats.wins * 30 + stats.losses * 10 + owned * 5;
  const level = 1 + Math.floor(xp / 400);
  const xpNow = xp % 400;

  const deck = decks.find((d) => d.id === activeDeck) || decks[0];

  const go2 = (id) => { sfx.click(); go(id); };

  const missions = [
    { label: 'Menang 3 duel',      cur: stats.wins, max: 3 },
    { label: 'Mainkan 5 duel',     cur: games,      max: 5 },
    { label: 'Kumpulkan 20 kartu', cur: owned,      max: 20 },
  ].map((m) => ({ ...m, cur: Math.min(m.cur, m.max) }));
  const champDone = Math.min(8, stats.wins);
  const banner = BANNERS[bannerIdx];

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 7000);
    return () => clearInterval(t);
  }, []);

  // pintasan: Spasi = mulai duel
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return;
      if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      e.preventDefault();
      sfx.click();
      go('setup');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const nav = [
    { id: 'deck',       label: 'Decks',     icon: Layers },
    { id: 'collection', label: 'Koleksi',   icon: Library },
    { id: 'shop',       label: 'Toko',      icon: ShoppingBag, dot: gold >= PACK_PRICE },
    { id: 'gacha',      label: 'Gacha',     icon: Sparkles },
    { id: 'rules',      label: 'Cara Main', icon: BookOpen },
  ];

  return (
    <div className="no-select relative h-[100dvh] w-full overflow-hidden text-white">
      <style>{`
        @keyframes lb-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes lb-shine { 0% { transform: translateX(-140%) skewX(-20deg); } 60%,100% { transform: translateX(420%) skewX(-20deg); } }
        @keyframes lb-glow { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .95; transform: scale(1.06); } }
        @keyframes lb-gold-line { 0%,100% { opacity: .75; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .lb-anim { animation: none !important; } }
      `}</style>

      <Backdrop />

      {/* ===== BAR ATAS ===== */}
      <header
        className="absolute inset-x-0 top-0 z-30 flex items-center gap-3 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md sm:gap-4 sm:px-3"
        style={{ background: 'linear-gradient(180deg, rgba(6,10,40,.95), rgba(10,20,70,.75))' }}
      >
        <GoldLine edge="bottom" />

        {/* profil */}
        <GoldPanel className="flex h-[52px] min-w-0 flex-1 items-center gap-3 rounded-2xl px-2.5">
          <button
            onClick={() => go2('collection')}
            aria-label="Profil"
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-yellow-200 text-xl shadow transition hover:scale-105 active:scale-95"
            style={{ background: GOLD_BTN }}
          >
            🧑
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0a1240] bg-red-500" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
            <span className="shrink-0 text-sm font-black">Pemain</span>

            <div className="h-2.5 min-w-[40px] flex-1 overflow-hidden rounded-full border border-yellow-200/40 bg-black/50">
              <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-200" style={{ width: `${(xpNow / 400) * 100}%` }} />
            </div>

            <span className="shrink-0 text-[10px] font-bold tabular-nums text-white/70">{xpNow}/400</span>
            <span className={clsx(GOLD_TAG, 'shrink-0 px-1.5 py-0.5 text-[10px]')}>Lv {level}</span>
          </div>
        </GoldPanel>

        {/* banner event */}
        <GoldPanel
          as="button"
          onClick={() => go2(banner.id)}
          bg={banner.tone}
          className="hidden h-[52px] w-[300px] shrink-0 items-center gap-3 overflow-hidden rounded-2xl px-3 text-left transition hover:brightness-110 active:scale-[0.98] lg:flex xl:w-[360px]"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={banner.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <GoldIcon className="h-9 w-9">
                <banner.icon size={18} />
              </GoldIcon>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black leading-tight">{banner.title}</span>
                <span className="block truncate text-[11px] font-semibold text-white/85">{banner.sub}</span>
              </span>
            </motion.span>
          </AnimatePresence>
          <span className={clsx(GOLD_TAG, 'shrink-0 px-3 py-1 text-xs')}>{banner.cta}</span>
          <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
            {BANNERS.map((b, i) => (
              <span key={b.id} className={clsx('h-1 rounded-full transition-all', i === bannerIdx ? 'w-4 bg-yellow-200' : 'w-1.5 bg-white/45')} />
            ))}
          </span>
        </GoldPanel>

        {/* resource */}
        <GoldPanel className="flex h-[52px] shrink-0 items-center gap-1 rounded-2xl px-2">
          <span className="flex h-10 items-center gap-1.5 pl-2 pr-1 text-sm font-extrabold">
            <Coins size={16} className="text-yellow-300" />
            <span className="tabular-nums">{gold.toLocaleString()}</span>
            <button
              onClick={() => go2('shop')}
              aria-label="Beli pack"
              className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-yellow-200 text-slate-900 transition hover:scale-110 active:scale-90"
              style={{ background: GOLD_BTN }}
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </span>
          <span className="mx-1 h-5 w-px bg-yellow-200/30" />
          <IconCircle onClick={toggleMute} label="Suara">
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </IconCircle>
          <IconCircle
            label="Reset progres"
            className="!hidden sm:!flex !border-red-300/50 !bg-red-600/70 hover:!bg-red-500"
            onClick={() => { if (window.confirm('Hapus semua progres (koleksi, deck, koin) dan mulai dari awal?')) resetAll(); }}
          >
            <RotateCcw size={15} />
          </IconCircle>
        </GoldPanel>
      </header>

      {/* ===== KIRI ===== */}
      <aside className="absolute bottom-[calc(92px+env(safe-area-inset-bottom))] left-2.5 top-[clamp(80px,16vh,108px)] z-20 flex flex-col justify-between gap-2 sm:left-3 lg:bottom-[calc(160px+env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2">
          <PromoCard
            icon={Sparkles}
            title="Gacha"
            sub="Legenda dijamin ≤ 40 tarikan"
            badge="BARU"
            tone="linear-gradient(135deg,#7a2fd0,#3b2aa8)"
            onClick={() => go2('gacha')}
          />
          <PromoCard
            icon={Combine}
            title="Fusi Skill"
            sub="Gabungkan 3 kartu sama"
            badge="BARU"
            tone="linear-gradient(135deg,#e0702a,#b43c18)"
            onClick={() => go2('fusion')}
          />
        </div>

        {/* jalur juara */}
        <GoldPanel className="hidden w-[216px] rounded-xl p-2 backdrop-blur-md md:block [@media(max-height:520px)]:!hidden">
          <PanelTitle icon={Crown} iconClass="text-yellow-300" right={`${champDone}/8`}>Jalur Juara</PanelTitle>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={clsx(
                  'flex aspect-square items-center justify-center rounded-md border text-[10px] font-black',
                  i < champDone
                    ? 'border-yellow-200 bg-gradient-to-b from-yellow-300 to-orange-500 text-slate-900'
                    : 'border-yellow-200/20 bg-black/35 text-white/45',
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <div className="mt-1.5 px-1 text-[10px] text-white/60">Satu kemenangan membuka satu juara.</div>
        </GoldPanel>

        {/* target pemain */}
        <GoldPanel className="hidden w-[216px] flex-col gap-1.5 rounded-xl p-2 backdrop-blur-md md:flex [@media(max-height:560px)]:hidden">
          <PanelTitle icon={Target} iconClass="text-sky-300">Target Pemain</PanelTitle>
          {missions.map((m) => {
            const done = m.cur >= m.max;
            return (
              <div key={m.label} className="rounded-lg border border-yellow-200/25 bg-black/25 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                  <span className={clsx('truncate', done && 'text-green-300')}>{m.label}</span>
                  <span className="shrink-0 tabular-nums text-white/75">{done ? '✓' : `${m.cur}/${m.max}`}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
                  <div
                    className={clsx('h-full rounded-full', done ? 'bg-green-400' : 'bg-gradient-to-r from-amber-400 to-yellow-200')}
                    style={{ width: `${(m.cur / m.max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </GoldPanel>
      </aside>

      {/* ===== KANAN ===== */}
      <aside className="absolute bottom-[calc(92px+env(safe-area-inset-bottom))] right-3 top-[clamp(80px,14vh,104px)] z-20 hidden w-[216px] flex-col gap-2 overflow-y-auto md:flex lg:w-[240px] [@media(max-height:480px)]:!hidden">
        <GoldPanel className="flex flex-col gap-1.5 rounded-xl p-2 backdrop-blur-md">
          <PanelTitle right={`${games} main`}>Rekor Duel</PanelTitle>
          <StatRow
            icon={Trophy} tint="text-yellow-300" label="Menang" value={`${winRate}%`}
            bar={winRate} barClass="bg-gradient-to-r from-yellow-300 to-orange-400"
            sub={`${stats.wins} menang · ${stats.losses} kalah`}
          />
          <StatRow
            icon={Flame} tint="text-orange-300" label="Beruntun" value={stats.streak || 0}
            bar={Math.min(100, ((stats.streak || 0) / 5) * 100)} barClass="bg-orange-400"
          />
          <StatRow
            icon={Library} tint="text-green-300" label="Koleksi" value={`${ownedPct}%`}
            bar={ownedPct} barClass="bg-gradient-to-r from-sky-300 to-green-300"
            sub={`${owned}/${totalCards} kartu`}
          />
        </GoldPanel>

        <GoldPanel
          as="button"
          onClick={() => go2('deck')}
          className="flex items-center gap-2.5 rounded-xl p-2 text-left backdrop-blur-md transition hover:brightness-125"
        >
          <GoldIcon className="h-10 w-10">
            <Layers size={20} />
          </GoldIcon>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black">{deck ? deck.name : 'Belum ada deck'}</span>
            <span className="block text-[10px] font-semibold tabular-nums text-white/65">
              {deck ? deck.cards.length : 0} kartu · {decks.length} deck
            </span>
          </span>
          <span className={clsx(GOLD_TAG, 'px-2 py-0.5 text-[10px]')}>Edit</span>
        </GoldPanel>

        <GoldPanel
          as="button"
          onClick={() => go2('setup')}
          bg="linear-gradient(120deg,#c8321f,#7a1a3a)"
          className="flex items-center gap-2.5 overflow-hidden rounded-xl p-2 text-left transition hover:brightness-110 active:scale-[0.98]"
        >
          <GoldIcon className="h-10 w-10">
            <Swords size={20} />
          </GoldIcon>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-white/75">Tantangan berikutnya</span>
            <span className="block truncate text-sm font-black">Juara #{Math.min(8, champDone + 1)}</span>
          </span>
          <span className={clsx(GOLD_TAG, 'px-2.5 py-1 text-[11px]')}>Duel</span>
        </GoldPanel>
      </aside>

      {/* ===== TENGAH ===== */}
      <main className="absolute inset-0 z-10 flex flex-col items-center justify-end px-3 pb-[calc(76px+env(safe-area-inset-bottom))] sm:pb-[calc(88px+env(safe-area-inset-bottom))]">
        {/* ringkasan mobile */}
        <div className="mb-2 flex w-[min(92vw,420px)] flex-col gap-1.5 md:hidden [@media(max-height:560px)]:!hidden">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { icon: Trophy,  tint: 'text-yellow-300', label: 'Menang',   value: `${winRate}%` },
              { icon: Flame,   tint: 'text-orange-300', label: 'Beruntun', value: stats.streak || 0 },
              { icon: Library, tint: 'text-green-300',  label: 'Koleksi',  value: `${ownedPct}%` },
            ].map((c) => (
              <GoldPanel key={c.label} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 backdrop-blur">
                <c.icon size={16} className={clsx('shrink-0', c.tint)} />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[9px] font-extrabold uppercase tracking-wide text-white/70">{c.label}</div>
                  <div className="text-sm font-black tabular-nums">{c.value}</div>
                </div>
              </GoldPanel>
            ))}
          </div>
          <GoldPanel className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 backdrop-blur">
            <Crown size={15} className="shrink-0 text-yellow-300" />
            <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-yellow-200">Juara</span>
            <div className="flex flex-1 gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className={clsx('h-2 flex-1 rounded-full', i < champDone ? 'bg-gradient-to-r from-yellow-300 to-orange-400' : 'bg-black/45')} />
              ))}
            </div>
            <span className="shrink-0 text-[11px] font-black tabular-nums">{champDone}/8</span>
          </GoldPanel>
        </div>

        {/* plakat rank */}
        <GoldPanel
          className="lb-anim mb-2 flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5 backdrop-blur [@media(max-height:480px)]:!hidden"
          style={{ animation: 'lb-float 4s ease-in-out infinite' }}
        >
          <GoldIcon className="h-11 w-11 text-base font-black sm:h-12 sm:w-12">{level}</GoldIcon>
          <div className="leading-tight">
            <div className="text-sm font-black sm:text-base">Duel Juara Elemen</div>
            <div className="text-[11px] font-semibold text-white/75">Lawan 8 juara · {xpNow}/400 XP</div>
          </div>
        </GoldPanel>

        {/* tombol utama (TIDAK diubah) */}
        <div className="relative w-[min(88vw,420px)]" style={{ filter: 'drop-shadow(0 6px 0 #6e2c04) drop-shadow(0 14px 16px rgba(0,0,0,.5))' }}>
          <span
            className="lb-anim pointer-events-none absolute -inset-3 rounded-full bg-yellow-300/30 blur-xl"
            style={{ animation: 'lb-glow 2.4s ease-in-out infinite' }}
          />
          <button
            onClick={() => go2('setup')}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden py-4 text-white transition hover:brightness-110 active:translate-y-0.5 sm:py-5"
            style={{
              clipPath: 'polygon(6% 0,94% 0,100% 50%,94% 100%,6% 100%,0 50%)',
              background: 'linear-gradient(180deg,#ffd35a 0%,#f9981a 50%,#e2650c 100%)',
              boxShadow: 'inset 0 0 0 3px #fff2b8',
            }}
          >
            <span className="lb-anim pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/55 to-transparent" style={{ animation: 'lb-shine 3.2s ease-in-out infinite' }} />
            <Swords size={30} className="drop-shadow" />
            <span
              className="text-3xl font-black italic leading-none tracking-tight sm:text-4xl"
              style={{ WebkitTextStroke: '3px #7a3405', paintOrder: 'stroke fill', textShadow: '0 2px 0 #7a3405' }}
            >
              MULAI DUEL
            </span>
            <span className="absolute right-7 top-1.5 hidden rounded bg-black/55 px-1.5 text-[9px] font-bold text-white/90 sm:block">Space</span>
          </button>
        </div>

        {/* deck aktif */}
        <GoldPanel
          as="button"
          onClick={() => go2('deck')}
          className="mt-2.5 flex w-[min(84vw,360px)] items-center justify-between gap-2 rounded-full px-4 py-1.5 text-sm font-bold backdrop-blur transition hover:brightness-125"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Layers size={15} className="shrink-0 text-yellow-300" />
            <span className="truncate">Deck: {deck ? deck.name : 'belum ada'}</span>
          </span>
          <span className="shrink-0 text-xs tabular-nums text-white/70">{deck ? deck.cards.length : 0} kartu</span>
        </GoldPanel>
      </main>

      {/* ===== gelembung tips ===== */}
      <button
        onClick={() => { sfx.click(); setTipIdx((i) => (i + 1) % TIPS.length); }}
        className="absolute bottom-[calc(84px+env(safe-area-inset-bottom))] left-3 z-20 hidden min-h-[52px] w-full max-w-[300px] items-center rounded-2xl border-2 border-yellow-300 bg-[#fff6d6] px-4 py-2 text-left text-[12px] font-semibold leading-snug text-slate-800 shadow-xl transition hover:scale-[1.02] lg:flex"
        aria-label="Tips berikutnya"
      >
        <AnimatePresence mode="wait">
          <motion.span key={tipIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {TIPS[tipIdx]}
          </motion.span>
        </AnimatePresence>
        <span className="absolute -bottom-2 left-8 h-3.5 w-3.5 rotate-45 border-b-2 border-r-2 border-yellow-300 bg-[#fff6d6]" />
      </button>

      {/* ===== BAR BAWAH ===== */}
      <nav
        className="absolute inset-x-0 bottom-0 z-30 flex items-stretch justify-around gap-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md sm:px-3"
        style={{ background: 'linear-gradient(180deg, rgba(10,20,70,.75), rgba(6,10,40,.95))' }}
      >
        <GoldLine edge="top" />
        {nav.map((n) => (
          <NavItem key={n.id} icon={n.icon} label={n.label} dot={n.dot} onClick={() => go2(n.id)} />
        ))}
      </nav>
    </div>
  );
}