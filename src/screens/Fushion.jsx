import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlaskConical, Plus } from 'lucide-react';
import Header from '../components/Header.jsx';
import Card from '../components/Card.jsx';
import { useStore } from '../store/useStore.js';
import { ALL_CARDS, CARDS } from '../data/cards.js';
import { describeCard } from '../data/describe.js';
import { sfx } from '../lib/sfx.js';
import { bgm } from '../lib/bgm.js';
import { FUSE_COPIES, canDonate, fuse, previewFused } from '../lib/fusion.js';

function lines(id) {
  try { return describeCard(CARDS[id]); } catch (e) { return []; }
}

function PickGrid({ items, selectedId, onPick, count, empty }) {
  return (
    <div className="grid max-h-72 grid-cols-[repeat(auto-fill,minmax(104px,1fr))] justify-items-center gap-2 overflow-y-auto rounded-xl border border-white/[0.07] bg-white/[0.02] p-2">
      {items.map((c) => (
        <div key={c.id} className="relative">
          <Card id={c.id} size="sm" className="!text-[10px]" selected={selectedId === c.id} onClick={() => onPick(c.id)} />
          <span className="pointer-events-none absolute -right-1 -top-1 rounded-full bg-black/80 px-1.5 text-[10px] font-semibold tabular-nums text-white">×{count(c.id)}</span>
        </div>
      ))}
      {items.length === 0 && <p className="col-span-full p-4 text-center text-xs text-slate-500">{empty}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Adegan fusi layar penuh                                           */
/*  charge (kartu mendekat) -> merge (pusaran) -> flash -> reveal      */
/* ------------------------------------------------------------------ */
const FX_BASE = '#38bdf8';
const FX_DONOR = '#a855f7';
const FX_RESULT = '#fbbf24';

function FusionScene({ baseId, donorId, id, onClose }) {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [phase, setPhase] = useState(reduce ? 'reveal' : 'charge');
  const off = typeof window !== 'undefined' && window.innerWidth < 640 ? 82 : 150;
  const cardCls = '!text-[12px] sm:!text-[15px]';

  // musik mistis selama adegan fusi berlangsung
  useEffect(() => {
    bgm.setOverlay('summon');
    return () => bgm.setOverlay(null);
  }, []);

  useEffect(() => {
    if (phase === 'reveal') { sfx.rare(); return undefined; }
    const next = { charge: ['merge', 2000], merge: ['flash', 1400], flash: ['reveal', 420] }[phase];
    if (phase === 'merge') sfx.cast();
    const t = setTimeout(() => setPhase(next[0]), next[1]);
    return () => clearTimeout(t);
  }, [phase]);

  const sparks = useMemo(
    () => Array.from({ length: 32 }, (_, i) => ({
      x: Math.cos((i / 32) * Math.PI * 2 + (i % 3) * 0.2) * (170 + (i % 5) * 50),
      y: Math.sin((i / 32) * Math.PI * 2 + (i % 3) * 0.2) * (170 + (i % 5) * 50),
      d: (i % 8) * 0.17,
      c: i % 2 ? FX_BASE : FX_DONOR,
    })),
    [],
  );
  const burst = useMemo(
    () => Array.from({ length: 30 }, (_, i) => ({
      x: Math.cos((i / 30) * Math.PI * 2) * (150 + (i % 4) * 60),
      y: Math.sin((i / 30) * Math.PI * 2) * (150 + (i % 4) * 60),
      s: 5 + (i % 3) * 3,
      d: (i % 5) * 0.03,
    })),
    [],
  );

  const gathering = phase === 'charge' || phase === 'merge';
  const merging = phase === 'merge';

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[#04050c]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* latar: cahaya radial + sinar berputar */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 50%, ${merging ? 'rgba(251,191,36,.22)' : phase === 'reveal' ? 'rgba(99,102,241,.1)' : 'rgba(99,102,241,.2)'}, transparent 60%)`, transition: 'background .6s' }}
      />
      {phase !== 'reveal' && (
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[1100px] w-[1100px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'repeating-conic-gradient(rgba(129,140,248,.18) 0 6deg, transparent 6deg 18deg)',
          WebkitMask: 'radial-gradient(circle, #000 8%, transparent 62%)',
          mask: 'radial-gradient(circle, #000 8%, transparent 62%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: merging ? 4 : 18, repeat: Infinity, ease: 'linear' }}
      />
      )}

      {gathering && (
        <motion.div
          className="relative flex h-full w-full items-center justify-center"
          animate={merging ? { x: [0, -7, 7, -5, 5, -2, 0], y: [0, 4, -4, 3, -3, 0, 0] } : { x: 0, y: 0 }}
          transition={merging ? { duration: 0.32, repeat: Infinity } : { duration: 0 }}
        >
          {/* percikan energi tersedot ke pusat */}
          {sparks.map((p, i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
              style={{ background: p.c, boxShadow: `0 0 10px ${p.c}` }}
              initial={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
              animate={{ x: 0, y: 0, opacity: [0, 1, 0], scale: [1, 0.3] }}
              transition={{ duration: merging ? 0.65 : 1.5, repeat: Infinity, delay: p.d, ease: 'easeIn' }}
            />
          ))}

          {/* garis energi penghubung */}
          {!merging && (
            <motion.div
              className="absolute h-[3px] rounded-full"
              style={{ width: off * 2, background: `linear-gradient(90deg, ${FX_BASE}, #fff, ${FX_DONOR})`, filter: 'blur(1px)' }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1], scaleX: 1 }}
              transition={{ duration: 1.6, delay: 0.3 }}
            />
          )}

          {/* inti cahaya saat pusaran */}
          {merging && (
            <motion.div
              className="absolute h-40 w-40 rounded-full"
              style={{ background: `radial-gradient(circle, #fff, ${FX_RESULT} 45%, transparent 72%)`, boxShadow: `0 0 90px ${FX_RESULT}` }}
              initial={{ scale: 0.2, opacity: 0.4 }}
              animate={{ scale: [0.2, 1, 2.4], opacity: [0.4, 1, 1] }}
              transition={{ duration: 1.4, ease: 'easeIn' }}
            />
          )}

          {/* dua kartu: berputar sebagai pusaran saat merge */}
          <motion.div
            className="absolute flex items-center justify-center"
            animate={merging ? { rotate: 720 } : { rotate: 0 }}
            transition={merging ? { duration: 1.4, ease: 'easeIn' } : { duration: 0 }}
          >
            <motion.div
              className="absolute"
              style={{ filter: `drop-shadow(0 0 16px ${FX_BASE})` }}
              initial={{ x: -off * 2.4, opacity: 0, rotate: -14 }}
              animate={merging ? { x: 0, rotate: -720, scale: 0.5, opacity: 1 } : { x: -off, rotate: 0, scale: 1, opacity: 1 }}
              transition={merging ? { duration: 1.4, ease: 'easeIn' } : { type: 'spring', stiffness: 90, damping: 14 }}
            >
              <motion.div animate={merging ? {} : { y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                <Card id={baseId} size="md" className={cardCls} />
              </motion.div>
            </motion.div>
            <motion.div
              className="absolute"
              style={{ filter: `drop-shadow(0 0 16px ${FX_DONOR})` }}
              initial={{ x: off * 2.4, opacity: 0, rotate: 14 }}
              animate={merging ? { x: 0, rotate: -720, scale: 0.5, opacity: 1 } : { x: off, rotate: 0, scale: 1, opacity: 1 }}
              transition={merging ? { duration: 1.4, ease: 'easeIn' } : { type: 'spring', stiffness: 90, damping: 14 }}
            >
              <motion.div animate={merging ? {} : { y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                <Card id={donorId} size="md" className={cardCls} />
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.p
            key={phase}
            className="absolute bottom-24 text-sm font-semibold tracking-wide text-slate-200 sm:bottom-28 sm:text-base"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {merging ? 'Pusaran energi…' : 'Menyatukan kekuatan…'}
          </motion.p>
          <button className="btn btn-sm absolute bottom-8" onClick={() => setPhase('flash')}>Lewati</button>
        </motion.div>
      )}

      {/* kilatan putih */}
      {phase === 'flash' && (
        <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} />
      )}

      {phase === 'reveal' && (
        <>
          {!reduce && (
            <motion.div className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />
          )}
          {/* gelombang kejut + ledakan partikel */}
          {!reduce && [0, 0.14, 0.28].map((d) => (
            <motion.div
              key={d}
              className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-4"
              style={{ borderColor: FX_RESULT }}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 7, opacity: 0 }}
              transition={{ duration: 1.3, delay: d, ease: 'easeOut' }}
            />
          ))}
          {!reduce && burst.map((p, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
              style={{ width: p.s, height: p.s, background: i % 2 ? '#fff' : FX_RESULT, boxShadow: `0 0 12px ${FX_RESULT}` }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
              transition={{ duration: 1.3, delay: p.d, ease: 'easeOut' }}
            />
          ))}

          <div className="relative z-10 flex max-h-[100dvh] w-full flex-col items-center gap-4 overflow-y-auto p-4 py-8">
            <motion.h2
              className="text-2xl font-extrabold tracking-wide"
              style={{ color: FX_RESULT, textShadow: `0 0 18px ${FX_RESULT}` }}
              initial={{ opacity: 0, y: -24, letterSpacing: '0.4em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.08em' }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              FUSI BERHASIL
            </motion.h2>
            <motion.div
              style={{ filter: `drop-shadow(0 0 26px ${FX_RESULT})` }}
              initial={{ scale: 0, rotate: -200, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.1 }}
            >
              <Card id={id} size="lg" glow className="!text-[15px] sm:!text-[18px]" />
            </motion.div>
            <motion.div
              className="w-full max-w-sm space-y-1.5 rounded-lg border border-white/10 bg-white/[0.05] p-3 text-xs leading-snug backdrop-blur"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {lines(id).map((l, i) => (
                <p key={i}><b className={l.skill ? 'text-violet-300' : 'text-amber-200'}>{l.k}:</b> <span className="text-slate-300">{l.text}</span></p>
              ))}
              <p className="pt-1 text-center text-slate-400">Kartu baru sudah masuk ke koleksimu. Deck yang memakai kartu dasar otomatis diperbarui.</p>
            </motion.div>
            <motion.button className="btn btn-primary" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
              Selesai
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function Fusion({ onBack }) {
  const collection = useStore((s) => s.collection);
  const [baseId, setBaseId] = useState(null);
  const [donorId, setDonorId] = useState(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [scene, setScene] = useState(null);

  const owned = (id) => collection[id] || 0;

  // kartu dasar: monster biasa yang punya >= 3 salinan
  const bases = useMemo(
    () => ALL_CARDS.filter((c) => !c.fused && c.type === 'monster' && !c.token && owned(c.id) >= FUSE_COPIES),
    [collection], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // donor: monster Biasa/Langka yang dimiliki dan punya skill/efek
  const donors = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ALL_CARDS.filter(
      (c) => canDonate(c) && owned(c.id) >= 1 && c.id !== baseId && (!t || c.name.toLowerCase().includes(t)),
    );
  }, [collection, baseId, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = useMemo(() => (baseId && donorId ? previewFused(baseId, donorId) : null), [baseId, donorId]);

  const pickBase = (id) => { sfx.click(); setBaseId(id); setDonorId(null); setMsg(''); };
  const pickDonor = (id) => { sfx.click(); setDonorId(id); setMsg(''); };

  const doFuse = () => {
    const r = fuse(baseId, donorId);
    if (!r.ok) { setMsg(r.reason); return; }
    sfx.click();
    setScene({ baseId, donorId, id: r.id });
    setBaseId(null);
    setDonorId(null);
    setMsg('');
  };

  return (
    <div className="flex h-[100dvh] flex-col">
      <Header title="Fusi Skill" onBack={onBack} />
      <div className="mx-auto w-full max-w-8xl flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
        <p className="text-sm text-slate-400">
          Kumpulkan <b className="text-white">{FUSE_COPIES} salinan</b> kartu yang sama, lalu ambil skill/efek dari kartu <b className="text-white">Biasa atau Langka</b> milikmu.
          Hasilnya satu kartu baru: stat kartu dasar dengan skill/efek donor. {FUSE_COPIES} salinan kartu dasar akan terpakai, kartu donor tidak.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-6">
            <section>
              <h2 className="eyebrow mb-2">1. Kartu dasar (punya ≥{FUSE_COPIES})</h2>
              <PickGrid
                items={bases}
                selectedId={baseId}
                onPick={pickBase}
                count={owned}
                empty={`Belum ada kartu dengan ${FUSE_COPIES} salinan. Buka pack atau gacha dulu.`}
              />
            </section>

            <section className={baseId ? '' : 'pointer-events-none opacity-40'}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="eyebrow">2. Kartu donor (Biasa/Langka)</h2>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari nama…"
                  className="w-36 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs outline-none focus:border-white/30"
                />
              </div>
              <PickGrid
                items={donors}
                selectedId={donorId}
                onPick={pickDonor}
                count={owned}
                empty="Tidak ada kartu donor yang cocok. Donor harus monster Biasa/Langka dengan skill atau efek."
              />
            </section>
          </div>

          {/* pratinjau */}
          <section className="panel flex flex-col items-center gap-4 p-5">
            <h2 className="eyebrow self-start">3. Hasil fusi</h2>
            {preview ? (
              <>
                <div className="flex items-center gap-3">
                  <Card id={baseId} size="sm" className="!text-[9px] opacity-80" />
                  <Plus size={16} className="text-slate-500" />
                  <Card id={donorId} size="sm" className="!text-[9px] opacity-80" />
                </div>
                <Card id={preview.id} size="md" glow />
                <div className="w-full space-y-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-3 text-xs leading-snug">
                  {lines(preview.id).map((l, i) => (
                    <p key={i}><b className={l.skill ? 'text-violet-300' : 'text-amber-200'}>{l.k}:</b> <span className="text-slate-300">{l.text}</span></p>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-500">
                  Biaya: {FUSE_COPIES}× {CARDS[baseId].name}. {CARDS[donorId].name} tetap kamu miliki.
                </p>
                {msg && <p className="text-xs font-semibold text-rose-300">{msg}</p>}
                <button className="btn btn-primary w-full" onClick={doFuse}>
                  <FlaskConical size={15} /> Fusikan
                </button>
              </>
            ) : (
              <p className="my-10 text-center text-sm text-slate-500">Pilih kartu dasar dan kartu donor untuk melihat hasilnya.</p>
            )}
          </section>
        </div>
      </div>

      {/* adegan fusi layar penuh */}
      <AnimatePresence>
        {scene && <FusionScene key={scene.id} baseId={scene.baseId} donorId={scene.donorId} id={scene.id} onClose={() => setScene(null)} />}
      </AnimatePresence>
    </div>
  );
}