import { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { ELEMENT_LIST } from '../data/elements.js';
import { useStore } from '../store/useStore.js';
import { sfx } from '../lib/sfx.js';

export default function StarterPick() {
  const startWith = useStore((s) => s.startWith);
  const [pick, setPick] = useState(null);
  const chosen = ELEMENT_LIST.find((e) => e.id === pick);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-8xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <div>
        <h1 className="bg-gradient-to-r from-orange-300 via-fuchsia-300 to-sky-300 bg-clip-text font-display text-4xl font-extrabold text-transparent sm:text-5xl">
          ELEMENTRA
        </h1>
        <p className="mt-2 text-slate-300">Pilih elemen pertamamu. Kamu mendapat deck awal siap main + 400 koin.</p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {ELEMENT_LIST.map((e, i) => (
          <motion.button
            key={e.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => { sfx.click(); setPick(e.id); }}
            className={clsx(
              'rounded-2xl border-2 p-3 text-left transition active:scale-95',
              pick === e.id ? 'scale-[1.03] border-white' : 'border-white/10 hover:border-white/40',
            )}
            style={{ background: `linear-gradient(160deg, ${e.from}, #0b1020)` }}
          >
            <div className="text-4xl">{e.icon}</div>
            <div className="mt-1 font-display font-bold" style={{ color: e.color }}>
              {e.name}
            </div>
            <div className="text-xs text-slate-300">{e.desc}</div>
          </motion.button>
        ))}
      </div>

      <button className="btn btn-primary w-full max-w-xs !py-3 text-base" disabled={!chosen} onClick={() => startWith(pick)}>
        {chosen ? `Mulai dengan ${chosen.name} ${chosen.icon}` : 'Pilih satu elemen'}
      </button>
    </div>
  );
}
