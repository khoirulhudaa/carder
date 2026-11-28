import { useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';
import Card from '../components/Card.jsx';
import Header from '../components/Header.jsx';
import { useStore } from '../store/useStore.js';
import { CARDS } from '../data/cards.js';
import { OPPONENTS, DIFFICULTIES, buildEnemyDeck } from '../data/opponents.js';
import { ELEMENTS } from '../data/elements.js';
import { validateDeck } from '../engine/deck.js';
import { sfx } from '../lib/sfx.js';

const GAP = 8;

// Semua kartu deck. Di desktop ukurannya disesuaikan agar muat tanpa digulir.
function DeckCards({ ids }) {
  const boxRef = useRef(null);
  const [fit, setFit] = useState(null);

  // kartu kembar digabung dan diurutkan dari biaya termurah
  const counts = ids.reduce((m, id) => m.set(id, (m.get(id) || 0) + 1), new Map());
  const list = [...counts].sort(([a], [b]) => (CARDS[a]?.cost ?? 0) - (CARDS[b]?.cost ?? 0));
  const total = list.length;

  useLayoutEffect(() => {
    const box = boxRef.current;
    const calc = () => {
      const card = box.querySelector('[data-card]');
      if (!card || !window.matchMedia('(min-width: 1024px)').matches) { setFit(null); return; }
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      const W = box.clientWidth;
      const H = box.clientHeight;
      let best = null;
      for (let cols = 1; cols <= total; cols += 1) {
        const rows = Math.ceil(total / cols);
        const scale = Math.min(1.6, (W - GAP * (cols - 1)) / (cols * w), (H - GAP * (rows - 1)) / (rows * h));
        if (scale > 0 && (!best || scale > best.scale)) best = { scale, cols, w: w * scale, h: h * scale };
      }
      setFit(best);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(box);
    return () => ro.disconnect();
  }, [total]);

  return (
    <div ref={boxRef} className="lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div
        className="flex flex-wrap justify-center gap-2 lg:h-full lg:content-center"
        style={fit ? { maxWidth: Math.ceil(fit.cols * fit.w + GAP * (fit.cols - 1)) + 1, marginInline: 'auto' } : undefined}
      >
        {list.map(([id, n]) => (
          <div key={id} className="relative" style={fit ? { width: fit.w, height: fit.h } : undefined}>
            <div data-card className="w-max origin-top-left" style={fit ? { transform: `scale(${fit.scale})` } : undefined}>
              <Card id={id} size="hand" />
            </div>
            {n > 1 && (
              <span className="absolute bottom-1 right-1 rounded-full border border-white/60 bg-black/80 px-1.5 text-[11px] font-black text-white">×{n}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <div className="mx-auto min-h-0 w-full max-w-7xl flex-1 space-y-5 overflow-y-auto p-4 sm:p-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-6 lg:space-y-0 lg:overflow-hidden">
        {/* ===== kiri: lawan ===== */}
        <section className="lg:flex lg:min-h-0 lg:flex-col">
          <div className="mb-2 flex justify-center"><span className="tcg-select !rounded-lg ![clip-path:none]">Pilih lawan</span></div>
          <div className="tcg-strip grid grid-cols-1 gap-2 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:auto-rows-fr lg:overflow-y-auto">
            {OPPONENTS.map((o) => {
              const el = o.element ? ELEMENTS[o.element] : null;
              const on = oppId === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => { sfx.click(); setOppId(o.id); }}
                  className={clsx(
                    'tcg-item rounded-lg flex items-center gap-3 px-6 py-2.5 text-left active:scale-[.99] lg:min-h-0 lg:px-5 lg:py-1.5',
                    on ? 'is-on bg-gradient-to-r from-yellow-200 to-yellow-400 !text-slate-900' : 'bg-white/10 hover:bg-white/20',
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-black/30 text-2xl">{o.avatar}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold lg:whitespace-normal lg:leading-tight">{o.name}</span>
                    <span className={clsx('block truncate text-xs lg:line-clamp-2 lg:whitespace-normal', on ? 'text-slate-700' : 'text-white/70')}>
                      <i className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: el?.color || '#94a3b8' }} />
                      {el ? el.name : 'Acak'} · {o.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== kanan: deck dan kesulitan ===== */}
        <div className="space-y-5 lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:space-y-0">
          <section className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <div className="mb-2 flex justify-center"><span className="tcg-select !rounded-lg ![clip-path:none]">Pilih deck</span></div>
            <div className="tcg-strip flex flex-col gap-2 lg:min-h-0 lg:flex-1">
            <div className="flex shrink-0 flex-wrap justify-center gap-2">
              {decks.map((d) => {
                const ok = validateDeck(d.cards, collection).ok;
                return (
                  <button
                    key={d.id}
                    onClick={() => { sfx.click(); setDeckId(d.id); }}
                    className={clsx(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold',
                      deckId === d.id ? 'border-yellow-200 bg-yellow-300 text-slate-900' : 'border-white/40 bg-white/10 hover:bg-white/20',
                    )}
                  >
                    {!ok && <AlertTriangle size={12} />}
                    {d.name} · {d.cards.length} kartu
                  </button>
                );
              })}
              {decks.length === 0 && <p className="p-4 text-sm text-white/80">Belum ada deck. Buat di Deck Builder.</p>}
            </div>
            {deck && <DeckCards key={deck.id} ids={deck.cards} />}
            </div>
            {!check.ok && (
              <p className="mt-2 rounded-md border border-yellow-300/50 bg-black/50 p-2.5 text-xs text-yellow-200">
                Deck belum valid: {check.errors.slice(0, 2).join(' · ')}. Perbaiki di Deck Builder.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* ===== bilah bawah: kolomnya sejajar dengan dua panel di atas ===== */}
      <div className="shrink-0 border-t-2 border-cyan-400/50 bg-[#0a2f63]/90 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Kesulitan">
            {Object.values(DIFFICULTIES).map((d) => (
              <button
                key={d.id}
                onClick={() => { sfx.click(); setDiff(d.id); }}
                title={d.desc}
                aria-pressed={diff === d.id}
                className={clsx('tcg-item flex flex-col justify-center rounded-md border border-white/30 px-2 py-1.5 text-center', diff === d.id ? 'is-on bg-gradient-to-b from-yellow-200 to-yellow-500 text-slate-900' : 'bg-white/10 hover:bg-white/20')}
              >
                <span className="text-sm font-extrabold">{d.name}</span>
                <span className="text-xs font-bold">+{d.reward} koin</span>
              </button>
            ))}
          </div>
          <button className="tcg-play !w-full !max-w-none !rounded-lg ![clip-path:none]" disabled={!check.ok} onClick={start}>
            Play!
          </button>
        </div>
      </div>
    </div>
  );
}