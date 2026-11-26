import { useState } from 'react';
import clsx from 'clsx';
import { Swords, AlertTriangle } from 'lucide-react';
import Header from '../components/Header.jsx';
import { useStore } from '../store/useStore.js';
import { OPPONENTS, DIFFICULTIES, buildEnemyDeck } from '../data/opponents.js';
import { ELEMENTS } from '../data/elements.js';
import { validateDeck } from '../engine/deck.js';
import { sfx } from '../lib/sfx.js';

export default function DuelSetup({ onBack, onStart }) {
  const { decks, activeDeck, collection, setActiveDeck } = useStore();
  const [deckId, setDeckId] = useState(activeDeck || decks[0]?.id);
  const [oppId, setOppId] = useState('api');
  const [diff, setDiff] = useState('normal');

  const deck = decks.find((d) => d.id === deckId);
  const check = deck ? validateDeck(deck.cards, collection) : { ok: false, errors: ['Belum ada deck'] };
  const opp = OPPONENTS.find((o) => o.id === oppId);

  const start = () => {
    sfx.cast();
    setActiveDeck(deckId);
    onStart({
      deck: deck.cards,
      enemyDeck: buildEnemyDeck(opp, diff),
      enemy: opp,
      difficulty: diff,
      playerName: 'Kamu',
    });
  };

  return (
    <div className="flex h-[100dvh] flex-col">
      <Header title="Siapkan Duel" onBack={onBack} />
      <div className="mx-auto w-full max-w-8xl flex-1 space-y-8 overflow-y-auto p-4 sm:p-6">
        <section>
          <h2 className="eyebrow mb-3">1 · Deck</h2>
          <div className="flex flex-wrap gap-2">
            {decks.map((d) => {
              const ok = validateDeck(d.cards, collection).ok;
              return (
                <button key={d.id} onClick={() => setDeckId(d.id)} className={clsx('chip !px-3.5 !py-2 text-sm', deckId === d.id && 'chip-on')}>
                  {!ok && <AlertTriangle size={13} className="text-rose-400" />} {d.name}
                  <span className="text-slate-500">{d.cards.length}</span>
                </button>
              );
            })}
          </div>
          {!check.ok && (
            <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/[0.07] p-2.5 text-xs text-rose-300">
              Deck belum valid: {check.errors.slice(0, 2).join(' · ')}. Perbaiki di Deck Builder.
            </p>
          )}
        </section>

        <section>
          <h2 className="eyebrow mb-3">2 · Lawan</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OPPONENTS.map((o) => {
              const el = o.element ? ELEMENTS[o.element] : null;
              const on = oppId === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => { sfx.click(); setOppId(o.id); }}
                  className={clsx(
                    'relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-left transition active:scale-[.99]',
                    on ? 'border-white/40 bg-white/[0.06]' : 'border-white/[0.08] bg-[#0f1218]/90 hover:border-white/25',
                  )}
                >
                  <i className="absolute inset-y-0 left-0 w-[3px]" style={{ background: el?.color || '#64748b' }} />
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl">{o.avatar}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold tracking-tight">{o.name}</span>
                    <span className="block text-xs text-slate-500">
                      {el ? el.name : 'Acak'} · {o.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="eyebrow mb-3">3 · Kesulitan</h2>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(DIFFICULTIES).map((d) => (
              <button
                key={d.id}
                onClick={() => setDiff(d.id)}
                className={clsx('rounded-xl border p-3 text-center transition', diff === d.id ? 'border-indigo-300/60 bg-indigo-400/10' : 'border-white/[0.08] bg-[#0f1218]/90 hover:border-white/25')}
              >
                <div className="text-sm font-semibold tracking-tight">{d.name}</div>
                <div className="mt-0.5 text-xs text-slate-400">+{d.reward} koin</div>
                <div className="mt-1 hidden text-[11px] text-slate-500 sm:block">{d.desc}</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="shrink-0 border-t border-white/[0.07] bg-[#08090d]/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button className="btn btn-primary mx-auto flex w-full max-w-md !py-3 text-[15px]" disabled={!check.ok} onClick={start}>
          <Swords size={17} /> Mulai duel vs {opp.name.split(',')[0]}
        </button>
      </div>
    </div>
  );
}