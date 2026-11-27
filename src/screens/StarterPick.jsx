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
    <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <div>
        <h1
          className="font-display text-4xl font-black tracking-[0.12em] text-white sm:text-6xl"
          style={{ WebkitTextStroke: '3px #5b0a10', paintOrder: 'stroke fill', textShadow: '0 4px 0 #5b0a10, 0 8px 14px rgba(0,0,0,.5)' }}
        >
          ELEMENTRA
        </h1>
        <p className="mt-3 text-sm text-white/90 sm:text-base">Pilih elemen pertamamu. Kamu mendapat deck awal siap main + 400 koin.</p>
      </div>

      <div className="tcg-strip w-full !p-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ELEMENT_LIST.map((e, i) => (
            <motion.button
              key={e.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => { sfx.click(); setPick(e.id); }}
              className={clsx('tcg-item rounded-md border-2 p-3 text-left active:scale-95', pick === e.id ? 'is-on border-yellow-300' : 'border-white/25 hover:border-white/60')}
              style={{ background: `linear-gradient(160deg, ${e.from}, #0b1a40)` }}
            >
              <div className="text-4xl">{e.icon}</div>
              <div className="mt-1 font-display font-extrabold" style={{ color: e.color }}>{e.name}</div>
              <div className="text-xs text-white/80">{e.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>

      <button className="tcg-play" disabled={!chosen} onClick={() => startWith(pick)}>
        {chosen ? `Mulai: ${chosen.name} ${chosen.icon}` : 'Pilih satu elemen'}
      </button>
    </div>
  );
}