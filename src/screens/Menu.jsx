import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Coins, Flame, Layers, Library, RotateCcw, ShoppingBag, Swords, Trophy, Volume2, VolumeX } from 'lucide-react';
import Card from '../components/Card.jsx';
import { useStore } from '../store/useStore.js';
import { ELEMENT_LIST } from '../data/elements.js';
import { sfx } from '../lib/sfx.js';

const SHOWCASE = ['api_naga', 'chy_serafim', 'glp_raja'];

export default function Menu({ go }) {
  const { gold, stats, muted, toggleMute, resetAll, collection } = useStore();
  const owned = Object.keys(collection).length;

  const items = [
    { id: 'setup', label: 'Duel', sub: 'Lawan 8 juara elemen', icon: Swords, primary: true },
    { id: 'deck', label: 'Deck Builder', sub: 'Susun strategimu', icon: Layers },
    { id: 'collection', label: 'Koleksi', sub: `${owned} kartu unik`, icon: Library },
    { id: 'shop', label: 'Toko Pack', sub: 'Buka kartu baru', icon: ShoppingBag },
    { id: 'rules', label: 'Cara Main', sub: 'Aturan dan elemen', icon: BookOpen },
  ];

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">
            <Coins size={13} className="text-slate-400" /> <span className="tabular-nums text-white">{gold}</span>
          </span>
          <span className="chip">
            <Trophy size={13} className="text-slate-400" /> {stats.wins} menang · {stats.losses} kalah
          </span>
          {stats.streak > 1 && (
            <span className="chip chip-on">
              <Flame size={13} /> {stats.streak} beruntun
            </span>
          )}
        </div>
        <button className="btn btn-sm !px-2" onClick={toggleMute} aria-label="Suara">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-10 py-8 lg:flex-row lg:gap-20">
        <div className="flex flex-col items-center gap-8">
          <div className="text-center">
            <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-semibold tracking-[0.22em] text-white sm:text-5xl">
              ELEMENTRA
            </motion.h1>
            <div className="mt-4 flex items-center justify-center gap-2">
              {ELEMENT_LIST.map((e) => (
                <i key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-400">Duel kartu elemental. Delapan elemen, ratusan strategi.</p>
          </div>
          <div className="flex items-end justify-center -space-x-5 sm:space-x-2">
            {SHOWCASE.map((id, i) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: i === 1 ? -8 : 0, rotate: (i - 1) * 5 }}
                transition={{ delay: 0.12 * i, type: 'spring' }}
              >
                <Card id={id} size="md" className="sm:!text-[15px]" />
              </motion.div>
            ))}
          </div>
        </div>

        <nav className="grid w-full max-w-sm gap-2">
          {items.map((it, i) => (
            <motion.button
              key={it.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i }}
              onClick={() => { sfx.click(); go(it.id); }}
              className={`group flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition active:scale-[.99] ${
                it.primary
                  ? 'border-transparent bg-indigo-400 text-slate-950 hover:bg-indigo-300'
                  : 'border-white/[0.08] bg-[#0f1218]/90 hover:border-white/25 hover:bg-white/[0.05]'
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${it.primary ? 'bg-slate-950/10' : 'border border-white/10 bg-white/[0.04] text-slate-300'}`}>
                <it.icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-tight tracking-tight">{it.label}</span>
                <span className={`block text-xs ${it.primary ? 'text-slate-900/70' : 'text-slate-500'}`}>{it.sub}</span>
              </span>
              <ChevronRight size={16} className={`transition group-hover:translate-x-0.5 ${it.primary ? 'opacity-70' : 'text-slate-600'}`} />
            </motion.button>
          ))}
        </nav>
      </div>

      <button
        className="mx-auto flex items-center gap-1.5 text-xs text-slate-600 transition hover:text-rose-300"
        onClick={() => { if (window.confirm('Hapus semua progres (koleksi, deck, koin) dan mulai dari awal?')) resetAll(); }}
      >
        <RotateCcw size={12} /> Reset progres
      </button>
    </div>
  );
}