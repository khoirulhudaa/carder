import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Sparkles } from 'lucide-react';
import Header from '../components/Header.jsx';
import Card, { CardBack } from '../components/Card.jsx';
import { useStore, duplicateInfo } from '../store/useStore.js';
import { ELEMENT_LIST } from '../data/elements.js';
import { CARDS } from '../data/cards.js';
import { PACK_PRICE, ELEMENT_PACK_PRICE } from '../engine/constants.js';
import { sfx } from '../lib/sfx.js';

function PackOpen({ result, onClose }) {
  const [flipped, setFlipped] = useState([]);
  const all = flipped.length === result.ids.length;

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
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight">Pack terbuka</h2>
        <p className="mt-1 text-sm text-slate-400">Ketuk kartu untuk membaliknya</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {result.ids.map((id, i) => {
          const on = flipped.includes(i);
          return (
            <motion.button key={i} onClick={() => flip(i)} className="relative" whileTap={{ scale: 0.96 }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.07 }}>
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
    </motion.div>
  );
}

export default function Shop({ onBack }) {
  const { gold, buyPack, sellDuplicates, collection, packsOpened } = useStore();
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');
  const dup = duplicateInfo(collection);

  const buy = (el) => {
    const r = buyPack(el);
    if (!r) { setMsg('Koin tidak cukup. Menangkan duel untuk mendapat koin.'); return; }
    setMsg('');
    sfx.cast();
    setResult(r);
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