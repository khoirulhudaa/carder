import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Card from './Card.jsx';
import { CARDS } from '../data/cards.js';
import { ELEMENTS, relations } from '../data/elements.js';
import { KEYWORDS } from '../data/effects.js';
import { describeCard } from '../data/describe.js';
import { RARITY, TYPE_NAMES, COPY_LIMIT } from '../engine/constants.js';

export default function CardModal({ id, onClose }) {
  const c = CARDS[id];
  if (!c) return null;
  const el = ELEMENTS[c.element];
  const rel = relations(c.element);
  const kws = [...new Set([...(c.kw || [])])];
  const lines = describeCard(c);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#05060a]/80 p-3 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="panel relative flex max-h-[92dvh] w-full max-w-2xl flex-col items-center gap-5 overflow-y-auto p-5 sm:flex-row sm:items-start"
      >
        <button className="btn btn-sm absolute right-3 top-3 !p-1.5" onClick={onClose} aria-label="Tutup">
          <X size={16} />
        </button>
        <div className="shrink-0 pt-2">
          <Card id={id} size="xl" glow />
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-sm">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{c.name}</h2>
            <p className="text-xs text-slate-400">
              {TYPE_NAMES[c.type]}
              {c.race ? ` · ${c.race}` : ''} ·{' '}
              <span style={{ color: RARITY[c.rarity].color }}>{RARITY[c.rarity].name}</span> · Biaya {c.cost} · maks {COPY_LIMIT[c.rarity]} di deck
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="chip" style={{ borderColor: `${el.color}88`, color: el.color }}>
              <i className="h-2 w-2 rounded-full" style={{ background: el.color }} />
              {el.name}
            </span>
            {rel.strong.length > 0 && (
              <span className="chip">
                Kuat vs {rel.strong.map((e) => ELEMENTS[e].name).join(', ')}
              </span>
            )}
            {rel.weak.length > 0 && (
              <span className="chip">
                Lemah vs {rel.weak.map((e) => ELEMENTS[e].name).join(', ')}
              </span>
            )}
          </div>

          {c.type === 'monster' && (
            <div className="flex gap-6 text-base font-semibold text-white">
              <span><i className="mr-1 text-xs font-medium not-italic text-slate-500">ATK</i>{c.atk}</span>
              <span><i className="mr-1 text-xs font-medium not-italic text-slate-500">DEF</i>{c.def}</span>
              <span><i className="mr-1 text-xs font-medium not-italic text-slate-500">HP</i>{c.hp}</span>
            </div>
          )}

          <div className="space-y-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-3">
            {lines.map((l, i) => (
              <p key={i}>
                <b className={l.skill ? 'text-violet-300' : 'text-amber-200'}>{l.k}:</b> {l.text}
              </p>
            ))}
          </div>

          {kws.length > 0 && (
            <ul className="space-y-1 text-xs text-slate-300">
              {kws.map((k) => (
                <li key={k}>
                  <b>{KEYWORDS[k].name}</b>{' '}
                  — {KEYWORDS[k].desc}
                </li>
              ))}
            </ul>
          )}

          {c.flavor && <p className="border-l-2 border-white/20 pl-3 text-xs italic text-slate-400">“{c.flavor}”</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}