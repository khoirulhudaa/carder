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
/*  Latar = public/bg3.jpg (gambar penuh + vignette agar UI terbaca)   */
/* ------------------------------------------------------------------ */
function Backdrop() {
  return (
    <>
      {/* <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg3.jpg')" }}
      /> */}
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
        'flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-[#0c1a4a]/80 text-white shadow backdrop-blur transition hover:bg-[#1b2f7a] active:scale-90 sm:h-9 sm:w-9',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* banner samping kiri (gaya "Event" di lobi) */
function PromoCard({ icon: Icon, title, sub, badge, tone, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-white/40 p-2 pr-4 text-left text-white shadow-xl transition hover:translate-x-1 active:scale-95"
      style={{ background: tone, minWidth: 'clamp(54px, 14vw, 160px)' }}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/50 bg-black/25 shadow-inner sm:h-11 sm:w-11">
        <Icon size={22} className="transition group-hover:scale-110" />
      </span>
      <span className="hidden min-w-0 flex-col sm:flex">
        <span className="truncate text-sm font-black leading-tight">{title}</span>
        <span className="truncate text-[10px] font-semibold text-white/80">{sub}</span>
      </span>
      {badge && (
        <span className="absolute -left-0.5 -top-0.5 rounded-br-lg bg-yellow-300 px-1.5 py-0.5 text-[8px] font-black text-slate-900">
          {badge}
        </span>
      )}
      <span className="pointer-events-none absolute inset-y-0 -right-6 w-12 skew-x-[-20deg] bg-white/10" />
    </button>
  );
}

/* baris rekor di panel kanan (gaya daftar teman) */
function StatRow({ icon: Icon, tint, label, value, sub, bar, barClass }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/20 bg-[#0b1750]/70 p-2">
      <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/30 bg-gradient-to-b from-white/20 to-white/5', tint)}>
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
    <button
      onClick={onClick}
      className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-white/85 transition hover:text-white active:scale-95"
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/10 transition group-hover:border-yellow-200 group-hover:bg-white/20 sm:h-9 sm:w-9">
        <Icon size={18} />
        {dot && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0a1240] bg-red-500" />}
      </span>
      <span className="text-[10px] font-extrabold tracking-wide sm:text-xs">{label}</span>
    </button>
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

  // level pemain dari aktivitas (menang, kalah, koleksi)
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
    { id: 'deck',       label: 'Decks',   icon: Layers },
    { id: 'collection', label: 'Koleksi', icon: Library },
    { id: 'shop',       label: 'Toko',    icon: ShoppingBag, dot: gold >= PACK_PRICE },
    { id: 'gacha',      label: 'Gacha',   icon: Sparkles },
    { id: 'rules',      label: 'Cara Main', icon: BookOpen },
  ];

  return (
    <div className="no-select relative h-[100dvh] w-full overflow-hidden text-white">
      <style>{`
        @keyframes lb-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes lb-shine { 0% { transform: translateX(-140%) skewX(-20deg); } 60%,100% { transform: translateX(420%) skewX(-20deg); } }
        @keyframes lb-glow { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .95; transform: scale(1.06); } }
        @media (prefers-reduced-motion: reduce) { .lb-anim { animation: none !important; } }
      `}</style>

      <Backdrop />

      {/* ===== BAR ATAS: profil | banner event | resource ===== */}
      <header
        className="absolute inset-x-0 top-0 z-30 flex items-center gap-2 px-2.5 pb-5 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-3 sm:px-4"
        style={{ background: 'linear-gradient(180deg, rgba(6,12,40,.7), rgba(6,12,40,0))' }}
      >
        {/* kiri: kartu profil */}
        <div className="flex h-[56px] min-w-0 flex-1 items-center rounded-2xl border border-white/35 bg-[#0c1a4a]/80 py-1 pl-1.5 pr-5 shadow-lg backdrop-blur">
          <button
            onClick={() => go2('collection')}
            aria-label="Profil"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-gradient-to-b from-sky-300 to-blue-600 text-2xl shadow transition hover:scale-105 active:scale-95"
          >
            🧑
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
          </button>
          <div className="ml-3 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 leading-none">
              <span className="truncate text-sm font-black">Pemain</span>
              <span className="shrink-0 rounded bg-yellow-300 px-1.5 py-0.5 text-[10px] font-black text-slate-900">Lv {level}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-white/30 bg-black/50">
              <div className="h-full bg-gradient-to-r from-sky-300 to-green-300" style={{ width: `${(xpNow / 400) * 100}%` }} />
            </div>
            <div className="mt-0.5 text-[9px] font-bold tabular-nums leading-none text-white/65">{xpNow}/400 XP</div>
          </div>
        </div>

        {/* tengah: banner event berputar */}
        <button
          onClick={() => go2(banner.id)}
          className="relative hidden h-[56px] w-[300px] shrink-0 items-center gap-3 overflow-hidden rounded-2xl border border-white/50 px-3 text-left shadow-xl transition hover:brightness-110 active:scale-[0.98] lg:flex xl:w-[360px]"
          style={{ background: banner.tone }}
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
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/50 bg-black/25">
                <banner.icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black leading-tight">{banner.title}</span>
                <span className="block truncate text-[11px] font-semibold text-white/85">{banner.sub}</span>
              </span>
            </motion.span>
          </AnimatePresence>
          <span className="shrink-0 rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-900">{banner.cta}</span>
          <span className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-1">
            {BANNERS.map((b, i) => (
              <span key={b.id} className={clsx('h-1 rounded-full transition-all', i === bannerIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/45')} />
            ))}
          </span>
        </button>

        {/* kanan: koin + suara + reset dalam satu kapsul */}
        <div className="flex h-[56px] shrink-0 items-center gap-1 rounded-2xl border border-white/35 bg-[#0c1a4a]/80 p-1.5 shadow-lg backdrop-blur">
          <span className="flex h-10 items-center gap-1.5 pl-2 pr-1 text-sm font-extrabold sm:pl-3">
            <Coins size={16} className="text-yellow-300" />
            <span className="tabular-nums">{gold.toLocaleString()}</span>
            <button
              onClick={() => go2('shop')}
              aria-label="Beli pack"
              className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-blue-700 transition hover:scale-110 active:scale-90"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          </span>
          <span className="mx-1 h-5 w-px bg-white/25" />
          <IconCircle onClick={toggleMute} label="Suara" className="!h-10 !w-10 !rounded-xl !border-transparent !bg-white/10 !shadow-none">
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </IconCircle>
          <IconCircle
            label="Reset progres"
            className="!hidden sm:!flex !h-10 !w-10 !rounded-xl !border-transparent !bg-red-600/70 !shadow-none hover:!bg-red-500"
            onClick={() => { if (window.confirm('Hapus semua progres (koleksi, deck, koin) dan mulai dari awal?')) resetAll(); }}
          >
            <RotateCcw size={15} />
          </IconCircle>
        </div>
      </header>

      {/* ===== KIRI: banner fitur ===== */}
      <aside className="absolute bottom-[calc(92px+env(safe-area-inset-bottom))] left-2.5 top-[clamp(76px,16vh,104px)] z-20 flex flex-col justify-between gap-2 sm:left-3 lg:bottom-[calc(160px+env(safe-area-inset-bottom))]">
        {/* atas: banner fitur */}
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

        {/* tengah: jalur juara */}
        <div className="hidden w-[216px] rounded-xl border border-white/30 bg-[#0a1550]/65 p-2 shadow-2xl backdrop-blur-md md:block [@media(max-height:520px)]:!hidden">
          <div className="flex items-center justify-between px-1 pb-1.5 text-[11px] font-black uppercase tracking-wider text-white/80">
            <span className="flex items-center gap-1.5"><Crown size={13} className="text-yellow-300" /> Jalur Juara</span>
            <span className="tabular-nums">{champDone}/8</span>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={clsx(
                  'flex aspect-square items-center justify-center rounded-md border text-[10px] font-black',
                  i < champDone
                    ? 'border-yellow-200 bg-gradient-to-b from-yellow-300 to-orange-500 text-slate-900'
                    : 'border-white/25 bg-black/35 text-white/45',
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <div className="mt-1.5 px-1 text-[10px] text-white/60">Satu kemenangan membuka satu juara.</div>
        </div>

        {/* target pemain */}
        <div className="hidden w-[216px] flex-col gap-1.5 rounded-xl border border-white/30 bg-[#0a1550]/65 p-2 shadow-2xl backdrop-blur-md md:flex [@media(max-height:560px)]:hidden">
          <div className="flex items-center gap-1.5 px-1 pb-0.5 text-[11px] font-black uppercase tracking-wider text-white/80">
            <Target size={13} className="text-sky-300" /> Target Pemain
          </div>
          {missions.map((m) => {
            const done = m.cur >= m.max;
            return (
              <div key={m.label} className="rounded-lg border border-white/20 bg-[#0b1750]/70 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                  <span className={clsx('truncate', done && 'text-green-300')}>{m.label}</span>
                  <span className="shrink-0 tabular-nums text-white/75">{done ? '✓' : `${m.cur}/${m.max}`}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
                  <div
                    className={clsx('h-full rounded-full', done ? 'bg-green-400' : 'bg-gradient-to-r from-sky-300 to-blue-500')}
                    style={{ width: `${(m.cur / m.max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ===== KANAN: panel rekor ===== */}
      <aside className="absolute bottom-[calc(92px+env(safe-area-inset-bottom))] right-3 top-[clamp(76px,14vh,100px)] z-20 hidden w-[216px] flex-col gap-2 overflow-y-auto md:flex lg:w-[240px] [@media(max-height:480px)]:!hidden">
        <div className="flex flex-col gap-1.5 rounded-xl border border-white/30 bg-[#0a1550]/65 p-2 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between px-1 pb-0.5 text-[11px] font-black uppercase tracking-wider text-white/80">
          <span>Rekor Duel</span>
          <span className="tabular-nums">{games} main</span>
        </div>
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
        </div>

        <button
          onClick={() => go2('deck')}
          className="flex items-center gap-2.5 rounded-xl border border-white/30 bg-[#0a1550]/65 p-2 text-left shadow-2xl backdrop-blur-md transition hover:bg-[#13237a]/80"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/40 bg-gradient-to-b from-sky-400 to-blue-700">
            <Layers size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black">{deck ? deck.name : 'Belum ada deck'}</span>
            <span className="block text-[10px] font-semibold tabular-nums text-white/65">
              {deck ? deck.cards.length : 0} kartu · {decks.length} deck
            </span>
          </span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold">Edit</span>
        </button>

        {/* tantangan berikutnya */}
        <button
          onClick={() => go2('setup')}
          className="relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-yellow-200/60 p-2 text-left shadow-2xl transition hover:brightness-110 active:scale-[0.98]"
          style={{ background: 'linear-gradient(120deg,#c8321f,#7a1a3a)' }}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/50 bg-black/25">
            <Swords size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-white/75">Tantangan berikutnya</span>
            <span className="block truncate text-sm font-black">Juara #{Math.min(8, champDone + 1)}</span>
          </span>
          <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-[11px] font-black text-slate-900">Duel</span>
        </button>
      </aside>

      {/* ===== TENGAH: tombol Duel ===== */}
      <main className="absolute inset-0 z-10 flex flex-col items-center justify-end px-3 pb-[calc(76px+env(safe-area-inset-bottom))] sm:pb-[calc(88px+env(safe-area-inset-bottom))]">
        {/* ringkasan mobile (md ke bawah) */}
        <div className="mb-2 flex w-[min(92vw,420px)] flex-col gap-1.5 md:hidden [@media(max-height:560px)]:!hidden">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { icon: Trophy,  tint: 'text-yellow-300', label: 'Menang',   value: `${winRate}%` },
              { icon: Flame,   tint: 'text-orange-300', label: 'Beruntun', value: stats.streak || 0 },
              { icon: Library, tint: 'text-green-300',  label: 'Koleksi',  value: `${ownedPct}%` },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-[#0a1550]/70 px-2 py-1.5 shadow-lg backdrop-blur">
                <c.icon size={16} className={clsx('shrink-0', c.tint)} />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[9px] font-extrabold uppercase tracking-wide text-white/70">{c.label}</div>
                  <div className="text-sm font-black tabular-nums">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-[#0a1550]/70 px-2.5 py-1.5 shadow-lg backdrop-blur">
            <Crown size={15} className="shrink-0 text-yellow-300" />
            <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-white/80">Juara</span>
            <div className="flex flex-1 gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className={clsx('h-2 flex-1 rounded-full', i < champDone ? 'bg-gradient-to-r from-yellow-300 to-orange-400' : 'bg-black/45')} />
              ))}
            </div>
            <span className="shrink-0 text-[11px] font-black tabular-nums">{champDone}/8</span>
          </div>
        </div>

        {/* plakat rank */}
        <div
          className="lb-anim mb-2 flex items-center gap-3 rounded-full border border-yellow-200/70 [@media(max-height:480px)]:!hidden bg-[#0c1a4a]/80 py-1.5 pl-1.5 pr-5 shadow-xl backdrop-blur"
          style={{ animation: 'lb-float 4s ease-in-out infinite' }}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-yellow-200 bg-gradient-to-b from-yellow-300 to-orange-500 text-base font-black text-slate-900 shadow-inner sm:h-12 sm:w-12">
            {level}
          </span>
          <div className="leading-tight">
            <div className="text-sm font-black sm:text-base">Duel Juara Elemen</div>
            <div className="text-[11px] font-semibold text-white/75">Lawan 8 juara · {xpNow}/400 XP</div>
          </div>
        </div>

        {/* tombol utama */}
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
        <button
          onClick={() => go2('deck')}
          className="mt-2.5 flex w-[min(84vw,360px)] items-center justify-between gap-2 rounded-full border border-white/35 bg-[#0c1a4a]/80 px-4 py-1.5 text-sm font-bold backdrop-blur transition hover:bg-[#1b2f7a]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Layers size={15} className="shrink-0 text-sky-300" />
            <span className="truncate">Deck: {deck ? deck.name : 'belum ada'}</span>
          </span>
          <span className="shrink-0 text-xs tabular-nums text-white/70">{deck ? deck.cards.length : 0} kartu</span>
        </button>
      </main>

      {/* ===== gelembung tips ===== */}
      <button
        onClick={() => { sfx.click(); setTipIdx((i) => (i + 1) % TIPS.length); }}
        className="absolute bottom-[calc(84px+env(safe-area-inset-bottom))] left-3 z-20 hidden min-h-[52px] w-full max-w-[300px] items-center rounded-2xl border-2 border-white bg-white px-4 py-2 text-left text-[12px] font-semibold leading-snug text-slate-700 shadow-xl transition hover:scale-[1.02] lg:flex"
        aria-label="Tips berikutnya"
      >
        <AnimatePresence mode="wait">
          <motion.span key={tipIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {TIPS[tipIdx]}
          </motion.span>
        </AnimatePresence>
        <span className="absolute -bottom-1.5 left-8 h-3.5 w-3.5 rotate-45 bg-white" />
      </button>

      {/* ===== BAR BAWAH ===== */}
      <nav
        className="absolute inset-x-0 bottom-0 z-30 flex items-stretch justify-around gap-1 border-t border-white/25 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md sm:px-6"
        style={{ background: 'linear-gradient(180deg, rgba(10,20,70,.7), rgba(6,10,40,.92))' }}
      >
        {nav.map((n) => (
          <NavItem key={n.id} icon={n.icon} label={n.label} dot={n.dot} onClick={() => go2(n.id)} />
        ))}
      </nav>
    </div>
  );
}