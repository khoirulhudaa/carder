import { useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';
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
      <Header title="Trainer Challenge" onBack={onBack} />
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        <section>
          <div className="mb-2 flex justify-center"><span className="tcg-select">Pilih lawan</span></div>
          <div className="tcg-strip grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OPPONENTS.map((o) => {
              const el = o.element ? ELEMENTS[o.element] : null;
              const on = oppId === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => { sfx.click(); setOppId(o.id); }}
                  className={clsx(
                    'tcg-item tcg-hex flex items-center gap-3 px-6 py-2.5 text-left active:scale-[.99]',
                    on ? 'is-on bg-gradient-to-r from-yellow-200 to-yellow-400 !text-slate-900' : 'bg-white/10 hover:bg-white/20',
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-black/30 text-2xl">{o.avatar}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold">{o.name}</span>
                    <span className={clsx('block truncate text-xs', on ? 'text-slate-700' : 'text-white/70')}>
                      <i className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: el?.color || '#94a3b8' }} />
                      {el ? el.name : 'Acak'} · {o.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-2 flex justify-center"><span className="tcg-select">Pilih deck</span></div>
          <div className="tcg-strip flex gap-3 overflow-x-auto">
            {decks.map((d) => {
              const ok = validateDeck(d.cards, collection).ok;
              return (
                <button
                  key={d.id}
                  onClick={() => setDeckId(d.id)}
                  className={clsx('tcg-item flex h-32 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-white/40 bg-gradient-to-b from-sky-400 to-blue-900 p-2 text-center', deckId === d.id && 'is-on')}
                >
                  <span className="line-clamp-2 text-sm font-extrabold leading-tight">{d.name}</span>
                  <span className="flex items-center gap-1 text-[11px] text-white/90">
                    {!ok && <AlertTriangle size={12} className="text-yellow-300" />} {d.cards.length} kartu
                  </span>
                </button>
              );
            })}
            {decks.length === 0 && <p className="p-4 text-sm text-white/80">Belum ada deck. Buat di Deck Builder.</p>}
          </div>
          {!check.ok && (
            <p className="mt-2 rounded-md border border-yellow-300/50 bg-black/50 p-2.5 text-xs text-yellow-200">
              Deck belum valid: {check.errors.slice(0, 2).join(' · ')}. Perbaiki di Deck Builder.
            </p>
          )}
        </section>

        <section>
          <div className="mb-2 flex justify-center"><span className="tcg-select">Kesulitan</span></div>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(DIFFICULTIES).map((d) => (
              <button
                key={d.id}
                onClick={() => setDiff(d.id)}
                className={clsx('tcg-item rounded-md border border-white/30 p-3 text-center', diff === d.id ? 'is-on bg-gradient-to-b from-yellow-200 to-yellow-500 text-slate-900' : 'bg-white/10 hover:bg-white/20')}
              >
                <div className="text-sm font-extrabold">{d.name}</div>
                <div className="mt-0.5 text-xs font-bold">+{d.reward} koin</div>
                <div className={clsx('mt-1 hidden text-[11px] sm:block', diff === d.id ? 'text-slate-700' : 'text-white/70')}>{d.desc}</div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flex shrink-0 justify-center border-t-2 border-cyan-400/50 bg-[#0a2f63]/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button className="tcg-play" disabled={!check.ok} onClick={start}>
          Play!
        </button>
      </div>
    </div>
  );
}