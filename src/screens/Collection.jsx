import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from '../components/Header.jsx';
import CardGrid from '../components/CardGrid.jsx';
import CardModal from '../components/CardModal.jsx';
import { FilterBar, useFilters } from '../components/Filters.jsx';
import { useStore } from '../store/useStore.js';
import { ALL_CARDS } from '../data/cards.js';

export default function Collection({ onBack }) {
  const collection = useStore((s) => s.collection);
  const f = useFilters();
  const [info, setInfo] = useState(null);

  const list = f.apply(collection);
  const owned = ALL_CARDS.filter((c) => collection[c.id] > 0).length;
  const total = Object.values(collection).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-[100dvh] flex-col">
      <Header title="Card Library" onBack={onBack} />
      <div className="shrink-0 space-y-2 border-b-2 border-cyan-400/50 bg-[#0a2f63]/90 p-3">
        <div className="flex items-center gap-3 text-xs text-white">
          <span>
            Terkumpul <b>{owned}</b>/{ALL_CARDS.length} kartu unik · {total} total
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-white/30 bg-black/50">
            <div className="h-full bg-gradient-to-r from-yellow-200 to-green-400" style={{ width: `${(owned / ALL_CARDS.length) * 100}%` }} />
          </div>
        </div>
        <FilterBar f={f} />
      </div>
      <div className="tcg-paper min-h-0 flex-1 overflow-y-auto">
        <CardGrid
          items={list.map((c) => ({ id: c.id, badge: collection[c.id] ? collection[c.id] : 0, dim: !collection[c.id] }))}
          onInfo={setInfo}
        />
      </div>
      <AnimatePresence>{info && <CardModal id={info} onClose={() => setInfo(null)} />}</AnimatePresence>
    </div>
  );
}