import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlaskConical, Plus } from 'lucide-react';
import Header from '../components/Header.jsx';
import Card from '../components/Card.jsx';
import { useStore } from '../store/useStore.js';
import { ALL_CARDS, CARDS } from '../data/cards.js';
import { describeCard } from '../data/describe.js';
import { sfx } from '../lib/sfx.js';
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

export default function Fusion({ onBack }) {
  const collection = useStore((s) => s.collection);
  const [baseId, setBaseId] = useState(null);
  const [donorId, setDonorId] = useState(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(null);

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
    sfx.rare();
    setDone(r.id);
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

      {/* berhasil */}
      <AnimatePresence>
        {done && (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-[#05060a]/90 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-xl font-semibold tracking-tight">Fusi berhasil</h2>
            <motion.div initial={{ scale: 0.6, rotate: -6, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
              <Card id={done} size="lg" glow className="!text-[18px]" />
            </motion.div>
            <p className="max-w-xs text-center text-sm text-slate-400">Kartu baru sudah masuk ke koleksimu. Deck yang memakai kartu dasar otomatis diperbarui dengan kartu ini.</p>
            <button className="btn btn-primary" onClick={() => setDone(null)}>Selesai</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}