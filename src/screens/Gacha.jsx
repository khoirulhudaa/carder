import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import Header from '../components/Header.jsx';
import Card, { CardBack } from '../components/Card.jsx';
import { useStore } from '../store/useStore.js';
import { CARDS } from '../data/cards.js';
import { PACK_PRICE, RARITY } from '../engine/constants.js';
import { sfx } from '../lib/sfx.js';
import {
  BASE_WEIGHT, MAX_RANK, TEST_COINS, TEST_UNLIMITED_COINS,
  addCards, drawCard, rankColor, rankOf,
} from '../lib/pulls.js';

/* ------------------------------------------------------------------ */
/*  Aturan gacha                                                      */
/* ------------------------------------------------------------------ */
const PRICE_1 = Math.max(1, Math.round(PACK_PRICE / 3)); // 1 tarikan
const PRICE_10 = PRICE_1 * 9;                             // 10 tarikan (diskon 1 gratis)
const LEGEND_PITY = 40; // tarikan ke-40 tanpa Legenda -> pasti Legenda
const EPIC_PITY = 10;   // tiap 10 tarikan tanpa Epik+ -> pasti Epik+ (10x pull juga menjamin 1 Epik+)

const PITY_KEY = 'elementra_gacha_pity';
const loadPity = () => {
  try { return { legend: 0, epic: 0, ...JSON.parse(localStorage.getItem(PITY_KEY) || '{}') }; } catch (e) { return { legend: 0, epic: 0 }; }
};
const savePity = (p) => { try { localStorage.setItem(PITY_KEY, JSON.stringify(p)); } catch (e) { /* abaikan */ } };

/* ------------------------------------------------------------------ */
/*  Hasil tarikan                                                     */
/* ------------------------------------------------------------------ */
function GachaResult({ result, onClose }) {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [phase, setPhase] = useState(reduce ? 'open' : 'charge');
  const [flipped, setFlipped] = useState([]);
  const all = flipped.length === result.ids.length;
  const many = result.ids.length > 1;

  const best = Math.max(...result.ids.map((id) => rankOf(CARDS[id])));
  const color = rankColor(best);

  useEffect(() => {
    if (phase !== 'charge') return undefined;
    sfx.cast();
    const t = setTimeout(() => setPhase('open'), 1700);
    return () => clearTimeout(t);
  }, [phase]);

  const flip = (i) => {
    if (flipped.includes(i)) return;
    rankOf(CARDS[result.ids[i]]) >= 2 ? sfx.rare() : sfx.flip();
    setFlipped((f) => [...f, i]);
  };
  const flipAll = () => result.ids.forEach((_, i) => setTimeout(() => flip(i), i * 130));

  const cardProps = many ? { size: 'sm', className: '!text-[11px]' } : { size: 'md', className: 'sm:!text-[15px]' };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 overflow-y-auto bg-[#05060a]/92 p-4 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {phase === 'charge' ? (
        <button className="flex flex-col items-center gap-6" onClick={() => setPhase('open')} aria-label="Lewati animasi">
          <div className="relative flex h-56 w-56 items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${color}, transparent, ${color}, transparent)`,
                WebkitMask: 'radial-gradient(circle, transparent 58%, #000 60%)',
                mask: 'radial-gradient(circle, transparent 58%, #000 60%)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="h-28 w-28 rounded-full"
              style={{ background: `radial-gradient(circle at 35% 30%, #fff, ${color} 55%, transparent 76%)`, boxShadow: `0 0 70px ${color}` }}
              animate={{ scale: [0.6, 1, 0.8, 1.3] }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
            />
          </div>
          <span className="text-sm text-slate-400">Memanggil…</span>
        </button>
      ) : (
        <>
          <motion.div className="pointer-events-none fixed inset-0 bg-white" initial={{ opacity: reduce ? 0 : 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} />
          <div className="text-center">
            <h2 className="text-xl font-semibold tracking-tight">{many ? `${result.ids.length} tarikan` : 'Hasil tarikan'}</h2>
            <p className="mt-1 text-sm text-slate-400">Ketuk kartu untuk membaliknya</p>
          </div>
          <div className="flex max-w-3xl flex-wrap justify-center gap-3">
            {result.ids.map((id, i) => {
              const on = flipped.includes(i);
              const r = rankOf(CARDS[id]);
              return (
                <motion.button
                  key={i}
                  onClick={() => flip(i)}
                  className="relative"
                  whileTap={{ scale: 0.96 }}
                  initial={reduce ? false : { y: 60, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 170, damping: 18 }}
                >
                  <AnimatePresence mode="wait">
                    {on ? (
                      <motion.div key="front" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.25 }}>
                        <Card id={id} glow={r >= 2} {...cardProps} />
                      </motion.div>
                    ) : (
                      <motion.div key="back" exit={{ rotateY: 90 }} transition={{ duration: 0.2 }}>
                        <CardBack size={cardProps.size} className={cardProps.className} />
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
            {!all && many && <button className="btn" onClick={flipAll}>Balik semua</button>}
            <button className="btn btn-primary" onClick={onClose}>{all ? 'Selesai' : 'Lewati'}</button>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Layar Gacha                                                       */
/* ------------------------------------------------------------------ */
export default function Gacha({ onBack }) {
  const gold = useStore((s) => s.gold);
  const [pity, setPity] = useState(loadPity);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');

  // mode tes: isi ulang koin otomatis
  useEffect(() => {
    if (TEST_UNLIMITED_COINS && gold < TEST_COINS / 2) useStore.setState({ gold: TEST_COINS });
  }, [gold]);

  const pull = (count) => {
    const price = count === 10 ? PRICE_10 : PRICE_1;
    const st = useStore.getState();
    if (st.gold < price) { setMsg('Koin tidak cukup. Menangkan duel untuk mendapat koin.'); return; }

    let { legend, epic } = pity;
    let gotEpic = false;
    const ids = [];
    for (let i = 0; i < count; i += 1) {
      let min = 0;
      if (legend + 1 >= LEGEND_PITY) min = MAX_RANK;
      else if (epic + 1 >= EPIC_PITY || (count === 10 && i === 9 && !gotEpic)) min = Math.min(2, MAX_RANK);
      const c = drawCard(min, 1);
      const r = rankOf(c);
      legend = r >= MAX_RANK ? 0 : legend + 1;
      epic = r >= 2 ? 0 : epic + 1;
      if (r >= 2) gotEpic = true;
      ids.push(c.id);
    }
    const isNew = addCards(ids, price);
    const next = { legend, epic };
    setPity(next);
    savePity(next);
    setMsg('');
    setResult({ ids, isNew });
  };

  const rates = Object.keys(RARITY).map((k, i) => ({ name: RARITY[k].name, pct: BASE_WEIGHT[i] ?? 0, color: rankColor(i) }));

  return (
    <div className="flex h-[100dvh] flex-col">
      <Header title="Gacha" onBack={onBack} />
      <div className="mx-auto w-full max-w-8xl flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        {/* lingkaran pemanggilan */}
        <section className="panel flex flex-col items-center gap-5 p-6 text-center">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full opacity-80"
              style={{
                background: 'conic-gradient(from 0deg, transparent, #a855f7, transparent, #38bdf8, transparent, #fbbf24, transparent)',
                WebkitMask: 'radial-gradient(circle, transparent 62%, #000 64%)',
                mask: 'radial-gradient(circle, transparent 62%, #000 64%)',
              }}
            />
            <div className="h-20 w-20 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #fff, #a855f7 55%, transparent 76%)', boxShadow: '0 0 50px #a855f7' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Panggil Kartu</h2>
            <p className="mt-1 text-sm text-slate-400">Tarik satu per satu. Epik+ terjamin tiap {EPIC_PITY} tarikan, Legenda pasti di tarikan ke-{LEGEND_PITY}.</p>
          </div>

          <div className="grid w-full max-w-sm grid-cols-2 gap-2">
            <button className="btn flex-col !py-3" disabled={gold < PRICE_1} onClick={() => pull(1)}>
              <span className="font-semibold">Tarik ×1</span>
              <span className="flex items-center gap-1 text-xs text-slate-400"><Coins size={12} /> {PRICE_1}</span>
            </button>
            <button className="btn btn-primary flex-col !py-3" disabled={gold < PRICE_10} onClick={() => pull(10)}>
              <span className="font-semibold">Tarik ×10</span>
              <span className="flex items-center gap-1 text-xs opacity-80"><Coins size={12} /> {PRICE_10}</span>
            </button>
          </div>
          {msg && <p className="text-sm text-slate-300">{msg}</p>}
        </section>

        {/* pity */}
        <section className="panel space-y-3 p-4">
          <h3 className="text-sm font-semibold">Pity</h3>
          {[
            { label: 'Legenda', val: pity.legend, max: LEGEND_PITY, color: rankColor(3) },
            { label: 'Epik+', val: pity.epic, max: EPIC_PITY, color: rankColor(2) },
          ].map((p) => (
            <div key={p.label}>
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{p.label}</span>
                <span className="tabular-nums">{p.val}/{p.max}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${(p.val / p.max) * 100}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </section>

        {/* peluang */}
        <section className="panel p-4">
          <h3 className="mb-2 text-sm font-semibold">Peluang per tarikan</h3>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {rates.map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: r.color }} />{r.name}</span>
                <b className="tabular-nums">{r.pct}%</b>
              </div>
            ))}
          </div>
        </section>
      </div>
      <AnimatePresence>{result && <GachaResult result={result} onClose={() => setResult(null)} />}</AnimatePresence>
    </div>
  );
}