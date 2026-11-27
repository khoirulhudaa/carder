import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import Header from '../components/Header.jsx';
import Card, { CardBack } from '../components/Card.jsx';
import { useStore } from '../store/useStore.js';
import { CARDS } from '../data/cards.js';
import { PACK_PRICE, RARITY } from '../engine/constants.js';
import { sfx } from '../lib/sfx.js';
import { bgm } from '../lib/bgm.js';
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
/*  Pusaran kartu: kartu-kartu tersapu angin berputar mengelilingi pusat */
/* ------------------------------------------------------------------ */
const VX_STEPS = 24;
const VX_ELL = Array.from({ length: VX_STEPS + 1 }, (_, k) => {
  const t = k / VX_STEPS;
  const a = t * Math.PI * 2;
  const c = Math.cos(a).toFixed(4);
  const sn = Math.sin(a);
  const depth = (sn + 1) / 2; // 0 = jauh (belakang), 1 = dekat (depan)
  return `${(t * 100).toFixed(2)}%{transform:translate(calc(var(--rx)*${c}),calc(var(--ry)*${sn.toFixed(4)})) scale(${(0.7 + 0.45 * depth).toFixed(3)});z-index:${sn > 0 ? 3 : 1};opacity:${(0.55 + 0.45 * depth).toFixed(2)}}`;
}).join('');

const VX_CSS = `
.vx{position:relative}
.vx-ring{position:absolute;border-radius:9999px;pointer-events:none;-webkit-mask:radial-gradient(circle,transparent 66%,#000 68%);mask:radial-gradient(circle,transparent 66%,#000 68%);animation:vx-turn var(--rd) linear infinite}
.vx-core{position:absolute;border-radius:9999px;pointer-events:none;animation:vx-pulse var(--pd) ease-in-out infinite}
.vx-b{position:absolute;inset:0;animation:vx-breathe var(--bd) ease-in-out infinite;animation-delay:var(--bl)}
.vx-o{position:absolute;left:50%;top:50%;width:0;height:0;animation:vx-ell var(--dur) linear infinite;animation-delay:var(--dl)}
.vx-c{position:absolute;border-radius:6px;border:2px solid rgba(255,255,255,.8);animation:vx-flutter var(--fd) ease-in-out infinite;animation-delay:var(--dl)}
@keyframes vx-ell{${VX_ELL}}
@keyframes vx-breathe{0%,100%{transform:scale(1)}50%{transform:scale(.66)}}
@keyframes vx-flutter{0%,100%{transform:perspective(220px) rotateY(-58deg) rotateZ(-16deg)}50%{transform:perspective(220px) rotateY(58deg) rotateZ(16deg)}}
@keyframes vx-turn{to{transform:rotate(360deg)}}
@keyframes vx-pulse{0%,100%{opacity:.55;transform:scale(.88)}50%{opacity:1;transform:scale(1.12)}}
@media (prefers-reduced-motion:reduce){.vx-b,.vx-o,.vx-c,.vx-ring,.vx-core{animation:none!important}}
`;

function CardVortex({ color = '#a855f7', size = 190, count = 10, fast = false }) {
  const k = fast ? 0.36 : 1;
  const cw = Math.round(size * 0.17);
  const ch = Math.round(cw * 1.4);
  const cards = Array.from({ length: count }, (_, i) => {
    const ring = i % 3;
    const rx = size * (0.27 + ring * 0.085);
    const dur = (5.2 + ring * 1.7) * k;
    const bd = (2.6 + ring * 0.6) * k;
    return {
      i,
      '--rx': `${rx}px`,
      '--ry': `${rx * 0.5}px`,
      '--dur': `${dur}s`,
      '--dl': `${-((i * 0.618) % 1) * dur}s`,
      '--bd': `${bd}s`,
      '--bl': `${-((i * 0.37) % 1) * bd}s`,
      '--fd': `${(1.5 + (i % 4) * 0.35) * k}s`,
    };
  });
  const rings = [
    { inset: '2%', rd: 5.5 * k, dir: 'normal', op: 0.55 },
    { inset: '14%', rd: 3.8 * k, dir: 'reverse', op: 0.45 },
    { inset: '27%', rd: 2.6 * k, dir: 'normal', op: 0.4 },
  ];

  return (
    <div className="vx" style={{ width: size, height: size, transform: 'rotate(-16deg)' }} aria-hidden>
      <style>{VX_CSS}</style>
      {rings.map((r, i) => (
        <div
          key={i}
          className="vx-ring"
          style={{
            inset: r.inset,
            opacity: r.op,
            '--rd': `${r.rd}s`,
            animationDirection: r.dir,
            background: `conic-gradient(from ${i * 70}deg, transparent 0 18%, ${color} 30%, transparent 44% 62%, #fff 74%, transparent 88%)`,
          }}
        />
      ))}
      <div
        className="vx-core"
        style={{
          inset: '38%',
          '--pd': `${1.6 * k}s`,
          background: `radial-gradient(circle at 40% 35%, #fff, ${color} 55%, transparent 78%)`,
          boxShadow: `0 0 ${Math.round(size * 0.28)}px ${color}`,
        }}
      />
      {cards.map(({ i, ...vars }) => (
        <div key={i} className="vx-b" style={vars}>
          <div className="vx-o" style={vars}>
            <div
              className="vx-c"
              style={{
                ...vars,
                width: cw,
                height: ch,
                marginLeft: -cw / 2,
                marginTop: -ch / 2,
                background: `radial-gradient(circle at 50% 50%, ${color} 0 13%, transparent 15%), linear-gradient(145deg,#3b3f9a,#171a4a)`,
                boxShadow: `0 0 12px ${color}, inset 0 0 8px rgba(255,255,255,.25)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

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

  // musik mistis selama animasi tarikan & hasil
  useEffect(() => {
    bgm.setOverlay('summon');
    return () => bgm.setOverlay(null);
  }, []);

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
          <motion.div
            animate={{ scale: [0.85, 1, 1.12, 0.8, 1.55], rotate: [0, 0, 6, -6, 18] }}
            transition={{ duration: 1.7, ease: 'easeInOut' }}
          >
            <CardVortex size={270} count={16} fast color={color} />
          </motion.div>
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
          <CardVortex size={200} count={10} color="#a855f7" />
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