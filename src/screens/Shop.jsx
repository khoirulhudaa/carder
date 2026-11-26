import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Sparkles } from 'lucide-react';
import Header from '../components/Header.jsx';
import Card, { CardBack } from '../components/Card.jsx';
import { useStore, duplicateInfo } from '../store/useStore.js';
import { ELEMENT_LIST } from '../data/elements.js';
import { CARDS, ALL_CARDS } from '../data/cards.js';
import { PACK_PRICE, ELEMENT_PACK_PRICE } from '../engine/constants.js';
import { sfx } from '../lib/sfx.js';
import { tearSound } from '../lib/sfxtear.js';
import { TEST_UNLIMITED_COINS, TEST_COINS, MAX_RANK, drawCard, rankOf } from '../lib/pulls.js';

/* ------------------------------------------------------------------ */
/*  Bungkus pack foil + efek sobek                                    */
/* ------------------------------------------------------------------ */
// Garis sobekan bergerigi (persen x, persen y). Dipakai untuk memotong bungkus jadi 2 bagian.
const ZIG = [
  [0, 16], [6, 13], [12, 17], [18, 13], [24, 17], [30, 13], [36, 17],
  [42, 13], [48, 17], [54, 13], [60, 17], [66, 13], [72, 17], [78, 13],
  [84, 17], [90, 13], [100, 16],
];
const pts = (list) => list.map(([x, y]) => `${x}% ${y}%`).join(', ');
const TOP_CLIP = `polygon(0 0, 100% 0, ${pts([...ZIG].reverse())})`;
const BODY_CLIP = `polygon(${pts(ZIG)}, 100% 100%, 0 100%)`;

const RIDGES = 'repeating-linear-gradient(90deg, rgba(110,70,10,.6) 0 2px, rgba(250,215,120,.55) 2px 4px)';

// siluet bungkus menggembung di tengah (lipatan atas/bawah lebih sempit)
const PILLOW = 'polygon(2.5% 0, 97.5% 0, 100% 10%, 100% 90%, 97.5% 100%, 2.5% 100%, 0 90%, 0 10%)';

/* ------------------------------------------------------------------ */
/*  Tema bungkus & tingkatan pack                                     */
/* ------------------------------------------------------------------ */
const THEME_GOLD = {
  base: 'linear-gradient(135deg,#8f6210 0%,#f6cf63 16%,#b98322 32%,#ffeaa6 48%,#c28d28 64%,#f3c85a 80%,#8a5c0e 100%)',
  banner: 'linear-gradient(90deg,#3a0b0b,#8a1616,#3a0b0b)',
  tint: null,
  tintOpacity: 0.65,
  badge: '5 KARTU',
};

// mins = rarity minimum tiap slot dari 5 kartu (0 = bebas, 1 = Langka+, 2 = Epik+, 3 = Legenda)
const TIERS = [
  {
    id: 'rare', name: 'Pack Langka', mult: 3, mins: [0, 0, 1, 1, 1], boost: 1, showRank: 1,
    desc: '3 kartu Langka atau lebih terjamin.',
    theme: {
      base: 'linear-gradient(135deg,#4a5568 0%,#e2e8f0 16%,#8a97ab 32%,#f8fafc 48%,#9aa7ba 64%,#dbe4ef 80%,#4a5568 100%)',
      banner: 'linear-gradient(90deg,#0c2a4a,#1d5fa8,#0c2a4a)',
      tint: '#38bdf8', tintOpacity: 0.4, badge: 'LANGKA+',
    },
  },
  {
    id: 'epic', name: 'Pack Epik', mult: 8, mins: [1, 1, 1, 2, 2], boost: 2, showRank: 2,
    desc: '2 kartu Epik atau lebih terjamin, sisanya Langka+.',
    theme: {
      base: 'linear-gradient(135deg,#3b1a6b 0%,#b18cff 16%,#6d3fc0 32%,#e3d0ff 48%,#7c4ad0 64%,#b18cff 80%,#2f1458 100%)',
      banner: 'linear-gradient(90deg,#2a0f4d,#6d28d9,#2a0f4d)',
      tint: '#a855f7', tintOpacity: 0.4, badge: 'EPIK+',
    },
  },
  {
    id: 'legend', name: 'Pack Legenda', mult: 20, mins: [1, 2, 2, 2, 3], boost: 3, showRank: 3,
    desc: '1 Legenda terjamin, ditambah 3 kartu Epik atau lebih.',
    theme: {
      base: 'linear-gradient(135deg,#7a1d05 0%,#ffb347 16%,#d9531e 32%,#fff1b8 48%,#e0782b 64%,#ffd070 80%,#6b1704 100%)',
      banner: 'linear-gradient(90deg,#4a0a0a,#c2410c,#4a0a0a)',
      tint: '#f97316', tintOpacity: 0.35, badge: '★ LEGENDA', holo: true,
    },
  },
];

// kartu karakter yang tampil di bungkus (5 kartu supaya terlihat penuh)
const SHOWCASE = ['api_naga', 'chy_serafim', 'glp_raja'];
function showcaseFor(elId, tier) {
  const monsters = Object.values(CARDS).filter((c) => c.type === 'monster' && !c.token);
  const byRank = (list) => [...list].sort((a, b) => rankOf(b) - rankOf(a));
  let pool;
  if (tier) {
    const exact = monsters.filter((c) => rankOf(c) === Math.min(tier.showRank, MAX_RANK));
    pool = [...exact, ...byRank(monsters)].map((c) => c.id);
  } else if (elId) {
    pool = byRank(monsters.filter((c) => c.element === elId)).map((c) => c.id);
    if (pool.length < 5) pool = [...SHOWCASE, ...byRank(monsters).map((c) => c.id)];
  } else {
    pool = [...SHOWCASE, ...byRank(monsters).map((c) => c.id)];
  }
  return [...new Set(pool)].slice(0, 5);
}

function PackArt({ theme, label, cards }) {
  const n = cards.length;
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        clipPath: PILLOW,
        background: theme.base,
      }}
    >
      {/* warna elemen / tingkatan pack */}
      {theme.tint && <div className="absolute inset-0" style={{ background: theme.tint, mixBlendMode: 'overlay', opacity: theme.tintOpacity ?? 0.6 }} />}
      {/* kilau pelangi (pack Legenda) */}
      {theme.holo && (
        <div
          className="absolute inset-0 opacity-45 mix-blend-overlay"
          style={{ background: 'linear-gradient(115deg, #ff3d81, #ffd23d, #3dffb0, #3db4ff, #b13dff, #ff3d81)' }}
        />
      )}

      {/* kerutan foil */}
      <div
        className="absolute inset-0 opacity-45 mix-blend-overlay"
        style={{ background: 'repeating-linear-gradient(63deg, rgba(255,255,255,.6) 0 2px, transparent 2px 19px, rgba(0,0,0,.4) 19px 21px, transparent 21px 47px)' }}
      />
      <div
        className="absolute inset-0 opacity-35 mix-blend-overlay"
        style={{ background: 'repeating-linear-gradient(-28deg, rgba(255,255,255,.5) 0 1px, transparent 1px 31px, rgba(0,0,0,.35) 31px 33px, transparent 33px 71px)' }}
      />

      {/* sinar di belakang kartu */}
      <div
        className="absolute left-1/2 top-[52%] h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2 opacity-30"
        style={{
          background: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,.95) 0 5deg, transparent 5deg 15deg)',
          WebkitMaskImage: 'radial-gradient(circle, #000 8%, transparent 58%)',
          maskImage: 'radial-gradient(circle, #000 8%, transparent 58%)',
        }}
      />

      {/* lipatan (crimp) atas & bawah, tebal dan terlihat tertekan */}
      <div className="absolute inset-x-0 top-0 h-[9%]" style={{ background: RIDGES }} />
      <div className="absolute inset-x-0 top-0 h-[9%] bg-gradient-to-b from-black/45 via-transparent to-black/25" />
      <div className="absolute inset-x-0 bottom-0 h-[9%]" style={{ background: RIDGES }} />
      <div className="absolute inset-x-0 bottom-0 h-[9%] bg-gradient-to-t from-black/45 via-transparent to-black/25" />

      {/* lencana jumlah kartu */}
      <div className="absolute right-3 top-[10.5%] rounded-[4px] bg-black/80 px-1.5 py-[1px] text-[9px] font-extrabold tracking-wider text-amber-100">
        {theme.badge || '5 KARTU'}
      </div>

      {/* logo */}
      <div className="absolute inset-x-0 top-[20%] text-center">
        <div
          className="text-[25px] font-black tracking-[0.1em] text-white"
          style={{ WebkitTextStroke: '3px #5b2a05', paintOrder: 'stroke fill', textShadow: '0 3px 0 #5b2a05, 0 7px 10px rgba(0,0,0,.55)' }}
        >
          ELEMENTRA
        </div>
        <div className="mx-auto mt-1 w-max rounded-[3px] border border-amber-200/60 bg-[#4a1f04]/90 px-2 py-[1px] text-[8px] font-bold tracking-[0.22em] text-amber-100">
          DUEL KARTU ELEMENTAL
        </div>
      </div>

      {/* karakter: kipas 5 kartu */}
      <div className="absolute inset-x-0 top-[33%] flex h-[46%] items-center justify-center">
        {cards.map((id, i) => {
          const k = i - (n - 1) / 2;
          return (
            <div
              key={id}
              className="absolute drop-shadow-[0_8px_8px_rgba(0,0,0,.6)]"
              style={{ transform: `translateX(${k * 31}px) translateY(${k * k * 4}px) rotate(${k * 7}deg)`, zIndex: 10 - Math.round(Math.abs(k) * 2) }}
            >
              <Card id={id} size="sm" className="!text-[9px]" />
            </div>
          );
        })}
      </div>

      {/* pita nama pack */}
      <div className="absolute inset-x-[-6%] bottom-[12%] -skew-y-3 border-y-2 border-amber-200/80 py-1.5 text-center shadow-[0_4px_10px_rgba(0,0,0,.5)]" style={{ background: theme.banner }}>
        <span className="text-[14px] font-black uppercase tracking-[0.14em] text-white" style={{ textShadow: '0 2px 0 rgba(0,0,0,.6)' }}>
          {label}
        </span>
      </div>

      {/* efek menggembung (3D): sisi gelap, tengah terang */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.1) 12%, rgba(255,255,255,0) 30%, rgba(255,255,255,.22) 42%, rgba(255,255,255,0) 58%, rgba(0,0,0,.12) 88%, rgba(0,0,0,.6) 100%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 38% 40%, rgba(255,255,255,.28), transparent 70%), radial-gradient(ellipse 90% 60% at 60% 105%, rgba(0,0,0,.45), transparent 70%)' }}
      />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_18px_rgba(0,0,0,.5),inset_2px_2px_3px_rgba(255,255,255,.55),inset_-2px_-2px_3px_rgba(0,0,0,.4)]" />
    </div>
  );
}

function PackTear({ theme, label, cards, onDone }) {
  const [tearing, setTearing] = useState(false);

  const tear = () => {
    if (tearing) return;
    setTearing(true);
    tearSound();
  };

  useEffect(() => {
    if (!tearing) return undefined;
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [tearing, onDone]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight">{tearing ? 'Sobek!' : 'Pack siap dibuka'}</h2>
        <p className="mt-1 text-sm text-slate-400">{tearing ? '\u00a0' : 'Ketuk pack untuk menyobeknya'}</p>
      </div>

      {/* sudut pandang 3D (statis) */}
      <div style={{ perspective: 900 }}>
        <div style={{ transform: 'rotateY(-14deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
          <motion.button
            onClick={tear}
            aria-label="Sobek pack"
            className="relative block w-52 sm:w-60"
            style={{ aspectRatio: '3 / 4.6', filter: 'drop-shadow(0 22px 18px rgba(0,0,0,.65))' }}
            animate={tearing ? { rotate: [0, -1.5, 1.5, 0] } : undefined}
            transition={{ duration: 0.25 }}
          >
            {/* ketebalan bungkus */}
            {!tearing && (
              <div
                className="absolute inset-0"
                style={{ transform: 'translate(8px, 6px)', clipPath: PILLOW, background: 'linear-gradient(160deg,#6b430a,#2b1a03)', zIndex: 9 }}
              />
            )}

            {/* 5 kartu muncul dari sobekan */}
            {tearing && (
              <div className="pointer-events-none absolute inset-x-0 top-[8%] flex h-0 justify-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.85 }}
                    animate={{ x: (i - 2) * 32, y: -95 + Math.abs(i - 2) * 8, rotate: (i - 2) * 8, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.07, type: 'spring', stiffness: 160, damping: 16 }}
                    style={{ zIndex: i }}
                  >
                    <CardBack size="sm" className="!text-[10px]" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* bagian bawah bungkus */}
            <motion.div
              className="absolute inset-0"
              style={{ clipPath: BODY_CLIP, zIndex: 10 }}
              animate={tearing ? { y: [0, 6, 6], opacity: [1, 1, 0] } : undefined}
              transition={{ duration: 1.5, times: [0, 0.3, 1] }}
            >
              <PackArt theme={theme} label={label} cards={cards} />
            </motion.div>

            {/* bagian atas bungkus: robek lalu terlempar */}
            <motion.div
              className="absolute inset-0"
              style={{ clipPath: TOP_CLIP, zIndex: 11, transformOrigin: '0% 16%' }}
              animate={tearing ? { rotate: -26, x: -80, y: -150, opacity: 0 } : undefined}
              transition={{ duration: 0.8, ease: 'easeIn' }}
            >
              <PackArt theme={theme} label={label} cards={cards} />
            </motion.div>

            {/* kilatan di garis sobekan */}
            {tearing && (
              <motion.div
                className="absolute inset-x-0 top-[14%] h-[6%] bg-gradient-to-r from-transparent via-white to-transparent blur-[2px]"
                style={{ zIndex: 12 }}
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: [0, 1, 0], scaleX: [0.3, 1.1, 1.25] }}
                transition={{ duration: 0.6 }}
              />
            )}

            {/* percikan emas */}
            {tearing && Array.from({ length: 14 }).map((_, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute text-amber-200"
                style={{ left: `${(i / 13) * 100}%`, top: '15%', zIndex: 13, fontSize: 10 + (i % 3) * 4 }}
                initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 1.1, x: (i % 2 ? 1 : -1) * (10 + ((i * 7) % 40)), y: -(30 + ((i * 13) % 60)) }}
                transition={{ duration: 0.9, delay: (i % 5) * 0.04 }}
              >
                ✦
              </motion.span>
            ))}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Buka pack                                                         */
/* ------------------------------------------------------------------ */
function PackOpen({ result, onClose }) {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [phase, setPhase] = useState(reduce ? 'open' : 'sealed'); // sealed -> open
  const [flipped, setFlipped] = useState([]);
  const all = flipped.length === result.ids.length;

  const el = ELEMENT_LIST.find((e) => e.id === result.el);
  const tier = TIERS.find((t) => t.id === result.tier);
  const label = tier ? tier.name : el ? `Pack ${el.name}` : 'Pack Standar';
  const theme = tier ? tier.theme : { ...THEME_GOLD, tint: el?.color ?? null };

  const flip = (i) => {
    if (flipped.includes(i)) return;
    const c = CARDS[result.ids[i]];
    c.rarity === 'E' || c.rarity === 'L' ? sfx.rare() : sfx.flip();
    setFlipped((f) => [...f, i]);
  };
  const flipAll = () => {
    result.ids.forEach((_, i) => setTimeout(() => flip(i), i * 160));
    setFlipped((f) => f);
  };

  return (
    <motion.div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 overflow-y-auto bg-[#05060a]/90 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {phase === 'sealed' ? (
        <>
          <PackTear theme={theme} label={label} cards={showcaseFor(result.el, tier)} onDone={() => setPhase('open')} />
          <button className="btn btn-sm" onClick={() => setPhase('open')}>Lewati animasi</button>
        </>
      ) : (
        <>
          <div className="text-center">
            <h2 className="text-xl font-semibold tracking-tight">Pack terbuka</h2>
            <p className="mt-1 text-sm text-slate-400">Ketuk kartu untuk membaliknya</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {result.ids.map((id, i) => {
              const on = flipped.includes(i);
              return (
                <motion.button
                  key={i}
                  onClick={() => flip(i)}
                  className="relative"
                  whileTap={{ scale: 0.96 }}
                  initial={reduce ? false : { y: 90, opacity: 0, scale: 0.7 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 170, damping: 18 }}
                >
                  <AnimatePresence mode="wait">
                    {on ? (
                      <motion.div key="front" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.25 }}>
                        <Card id={id} size="md" glow={CARDS[id].rarity === 'E' || CARDS[id].rarity === 'L'} className="sm:!text-[15px]" />
                      </motion.div>
                    ) : (
                      <motion.div key="back" exit={{ rotateY: 90 }} transition={{ duration: 0.2 }}>
                        <CardBack size="md" className="sm:!text-[15px]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {on && result.isNew[i] && (
                    <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-indigo-400 px-2 py-0.5 text-[10px] font-semibold text-slate-950">Baru</span>
                  )}
                </motion.button>
              );
            })}
          </div>
          <div className="flex gap-2">
            {!all && <button className="btn" onClick={flipAll}>Balik semua</button>}
            <button className="btn btn-primary" onClick={onClose}>{all ? 'Selesai' : 'Lewati'}</button>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toko                                                              */
/* ------------------------------------------------------------------ */
export default function Shop({ onBack }) {
  const { gold, buyPack, sellDuplicates, collection, packsOpened } = useStore();

  // isi ulang koin otomatis tiap kali berkurang (hanya saat mode tes)
  useEffect(() => {
    if (TEST_UNLIMITED_COINS && gold < TEST_COINS / 2) useStore.setState({ gold: TEST_COINS });
  }, [gold]);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');
  const dup = duplicateInfo(collection);

  const buy = (el) => {
    const r = buyPack(el);
    if (!r) { setMsg('Koin tidak cukup. Menangkan duel untuk mendapat koin.'); return; }
    setMsg('');
    setResult({ ...r, el }); // simpan elemen pack untuk warna bungkus
  };

  // pack bertingkat (Langka / Epik / Legenda): dihitung di sini karena rarity dijamin per slot
  const buyTier = (tier) => {
    const price = PACK_PRICE * tier.mult;
    const st = useStore.getState();
    if (st.gold < price) { setMsg('Koin tidak cukup. Menangkan duel untuk mendapat koin.'); return; }
    const have = { ...st.collection };
    const ids = [];
    const isNew = [];
    [...tier.mins].sort((x, y) => x - y).forEach((min) => {
      const c = drawCard(min, tier.boost);
      ids.push(c.id);
      isNew.push(!have[c.id]);
      have[c.id] = (have[c.id] || 0) + 1;
    });
    useStore.setState({ gold: st.gold - price, collection: have, packsOpened: (st.packsOpened || 0) + 1 });
    setMsg('');
    setResult({ ids, isNew, el: null, tier: tier.id });
  };

  return (
    <div className="flex h-[100dvh] flex-col">
      <Header title="Toko Pack" onBack={onBack} />
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 overflow-y-auto p-4 sm:p-6">
        <section className="panel flex flex-col items-center gap-5 p-5 text-center sm:flex-row sm:text-left">
          <div className="flex -space-x-3">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} animate={{ rotate: (i - 1) * 8, y: i === 1 ? -4 : 0 }}>
                <CardBack size="sm" className="!text-[10px]" />
              </motion.div>
            ))}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold tracking-tight">Pack Standar</h2>
            <p className="mt-1 text-sm text-slate-400">5 kartu dari semua elemen. Slot terakhir dijamin Langka atau lebih.</p>
          </div>
          <button className="btn btn-primary !px-6 !py-2.5" disabled={gold < PACK_PRICE} onClick={() => buy(null)}>
            <Coins size={15} /> {PACK_PRICE}
          </button>
        </section>

        <section>
          <h2 className="eyebrow mb-1">Pack Premium</h2>
          <p className="mb-3 text-xs text-slate-500">Rarity tinggi dijamin. Makin mahal, makin besar peluang kartu Legenda.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {TIERS.map((t) => {
              const price = PACK_PRICE * t.mult;
              return (
                <div key={t.id} className="panel flex flex-col items-center gap-3 p-4 text-center">
                  <div
                    className="relative h-[4.6rem] w-[3.2rem] overflow-hidden rounded-[4px] border border-white/30 shadow-lg"
                    style={{ background: t.theme.base }}
                  >
                    <div className="absolute inset-0" style={{ background: t.theme.tint, mixBlendMode: 'overlay', opacity: t.theme.tintOpacity }} />
                    <div className="absolute inset-x-0 top-0 h-[10%] bg-black/25" />
                    <div className="absolute inset-x-0 bottom-0 h-[10%] bg-black/25" />
                    <span className="absolute inset-0 flex items-center justify-center text-lg text-white/90 drop-shadow">★</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">{t.name}</h3>
                    <p className="mt-1 text-xs leading-snug text-slate-400">{t.desc}</p>
                  </div>
                  <button className="btn btn-primary mt-auto w-full" disabled={gold < price} onClick={() => buyTier(t)}>
                    <Coins size={15} /> {price}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="eyebrow mb-1">Pack Elemen</h2>
          <p className="mb-3 text-xs text-slate-500">Isinya hanya kartu elemen pilihan dan netral. Cocok untuk melengkapi deck.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ELEMENT_LIST.map((e) => (
              <button
                key={e.id}
                disabled={gold < ELEMENT_PACK_PRICE}
                onClick={() => buy(e.id)}
                className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f1218]/90 p-4 text-left transition hover:border-white/25 active:scale-[.98] disabled:opacity-40"
              >
                <i className="absolute inset-x-0 top-0 h-[2px]" style={{ background: e.color }} />
                <div className="text-sm font-semibold tracking-tight">{e.name}</div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Coins size={12} /> {ELEMENT_PACK_PRICE}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
          <div className="text-sm">
            <b className="font-semibold">Jual kelebihan kartu</b>
            <p className="mt-0.5 text-xs text-slate-500">
              Salinan di atas batas deck (Biasa/Langka 3, Epik 2, Legenda 1) tidak bisa dipakai.
              {dup.count > 0 ? ` Kamu punya ${dup.count} kelebihan.` : ' Belum ada kelebihan.'}
            </p>
          </div>
          <button className="btn" disabled={dup.count === 0} onClick={() => { const g = sellDuplicates(); setMsg(`Terjual. +${g} koin`); sfx.cast(); }}>
            <Sparkles size={14} /> Jual · +{dup.value}
          </button>
        </section>

        {msg && <p className="text-center text-sm text-slate-300">{msg}</p>}
        <p className="text-center text-xs text-slate-600">Pack dibuka: {packsOpened}</p>
      </div>
      <AnimatePresence>{result && <PackOpen result={result} onClose={() => setResult(null)} />}</AnimatePresence>
    </div>
  );
}