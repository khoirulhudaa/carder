import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence } from 'framer-motion';
import { Info, Plus, Save, Trash2, Wand2, Eraser } from 'lucide-react';
import Header from '../components/Header.jsx';
import CardGrid from '../components/CardGrid.jsx';
import CardModal from '../components/CardModal.jsx';
import { FilterBar, useFilters } from '../components/Filters.jsx';
import { useStore } from '../store/useStore.js';
import { CARDS } from '../data/cards.js';
import { ELEMENT_LIST, ELEMENTS } from '../data/elements.js';
import { RARITY, DECK_MAX, DECK_MIN } from '../engine/constants.js';
import { autoDeck, copyLimit, countIds, validateDeck } from '../engine/deck.js';
import { sfx } from '../lib/sfx.js';

const blank = () => ({ id: 'd' + Date.now(), name: 'Deck Baru', cards: [] });

export default function DeckBuilder({ onBack }) {
  const { collection, decks, activeDeck, saveDeck, deleteDeck, setActiveDeck } = useStore();
  const [cur, setCur] = useState(() => {
    const d = decks.find((x) => x.id === activeDeck) || decks[0];
    return d ? { ...d, cards: [...d.cards] } : blank();
  });
  const [saved, setSaved] = useState(JSON.stringify(cur));
  const [tab, setTab] = useState('koleksi');
  const [info, setInfo] = useState(null);
  const [toast, setToast] = useState('');
  const f = useFilters();

  const counts = useMemo(() => countIds(cur.cards), [cur.cards]);
  const check = validateDeck(cur.cards, collection);
  const dirty = JSON.stringify(cur) !== saved;

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const add = (id) => {
    const c = CARDS[id];
    const have = collection[id] || 0;
    const n = counts[id] || 0;
    if (cur.cards.length >= DECK_MAX) return say(`Deck penuh (${DECK_MAX})`);
    if (have === 0) return say('Kamu belum punya kartu ini');
    if (n >= copyLimit(c)) return say(`Batas ${copyLimit(c)} salinan untuk kartu ${RARITY[c.rarity].name}`);
    if (n >= have) return say('Salinan di koleksimu habis');
    sfx.click();
    setCur((d) => ({ ...d, cards: [...d.cards, id] }));
  };
  const remove = (id) => {
    const i = cur.cards.lastIndexOf(id);
    if (i < 0) return;
    sfx.click();
    setCur((d) => ({ ...d, cards: d.cards.filter((_, k) => k !== i) }));
  };

  const load = (id) => {
    if (dirty && !window.confirm('Perubahan belum disimpan. Pindah deck?')) return;
    const d = decks.find((x) => x.id === id);
    if (!d) return;
    const next = { ...d, cards: [...d.cards] };
    setCur(next);
    setSaved(JSON.stringify(next));
  };
  const create = () => {
    if (dirty && !window.confirm('Perubahan belum disimpan. Buat deck baru?')) return;
    const b = blank();
    setCur(b);
    setSaved('');
  };
  const save = () => {
    saveDeck(cur);
    setSaved(JSON.stringify(cur));
    say(check.ok ? 'Deck tersimpan' : 'Tersimpan (belum valid untuk duel)');
  };
  const del = () => {
    if (!decks.some((d) => d.id === cur.id)) return create();
    if (!window.confirm(`Hapus "${cur.name}"?`)) return;
    deleteDeck(cur.id);
    const rest = decks.filter((d) => d.id !== cur.id);
    const next = rest[0] ? { ...rest[0], cards: [...rest[0].cards] } : blank();
    setCur(next);
    setSaved(JSON.stringify(next));
  };
  const fill = (el) => {
    const ids = autoDeck([el], 30, collection);
    setCur((d) => ({ ...d, cards: ids }));
    say(ids.length < DECK_MIN ? `Koleksi ${ELEMENTS[el].name} belum cukup (${ids.length} kartu)` : 'Deck diisi otomatis');
  };

  const list = f.apply(collection);
  const sorted = Object.keys(counts).sort((a, b) => CARDS[a].cost - CARDS[b].cost || CARDS[a].name.localeCompare(CARDS[b].name));
  const typeCount = (t) => cur.cards.filter((id) => CARDS[id].type === t).length;
  const curve = Array.from({ length: 8 }, (_, i) => cur.cards.filter((id) => Math.min(7, CARDS[id].cost) === i).length);
  const maxCurve = Math.max(1, ...curve);
  const isSaved = decks.some((d) => d.id === cur.id);

  return (
    <div className="flex h-[100dvh] flex-col">
      <Header title="Decks" onBack={onBack} compact>
        <div className="flex gap-1 lg:hidden">
          {['koleksi', 'deck'].map((t) => (
            <button key={t} className={clsx('chip', tab === t && 'chip-on')} onClick={() => setTab(t)}>
              {t === 'koleksi' ? 'Koleksi' : `Deck ${cur.cards.length}`}
            </button>
          ))}
        </div>
      </Header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
        {/* koleksi (Card Library) */}
        <section className={clsx('flex min-h-0 flex-1 flex-col gap-2', tab !== 'koleksi' && 'hidden lg:flex')}>
          <FilterBar f={f} />
          <div className="tcg-paper min-h-0 flex-1 overflow-y-auto rounded-md">
            <CardGrid
              items={list.map((c) => {
                const have = collection[c.id] || 0;
                const left = have - (counts[c.id] || 0);
                return { id: c.id, badge: have ? `${left}/${have}` : '0', dim: left <= 0 };
              })}
              onPick={add}
              onInfo={setInfo}
            />
          </div>
        </section>

        {/* deck */}
        <aside className={clsx('panel flex min-h-0 flex-col gap-2 p-3 lg:w-80 xl:w-96', tab !== 'deck' ? 'hidden lg:flex' : 'flex-1 lg:flex-none')}>
          <div className="flex gap-2">
            <select value={isSaved ? cur.id : ''} onChange={(e) => load(e.target.value)} className="tcg-select min-w-0 flex-1 !px-5 !py-2">
              {!isSaved && <option value="">(belum disimpan)</option>}
              {decks.map((d) => (
                <option key={d.id} value={d.id} className="text-black">
                  {d.name}
                  {d.id === activeDeck ? ' (aktif)' : ''}
                </option>
              ))}
            </select>
            <button className="btn btn-sm" onClick={create} title="Deck baru">
              <Plus size={14} />
            </button>
          </div>
          <input
            value={cur.name}
            maxLength={24}
            onChange={(e) => setCur((d) => ({ ...d, name: e.target.value }))}
            className="rounded-md border border-white/40 bg-black/40 px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-yellow-300"
            placeholder="Nama deck"
          />

          <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs">
            <span className={clsx('font-extrabold', check.ok ? 'text-green-300' : 'text-yellow-300')}>
              {cur.cards.length}/{DECK_MIN}–{DECK_MAX} kartu
            </span>
            <span className="text-white/70">
              {typeCount('monster')} monster · {typeCount('spell')} sihir · {typeCount('relic')} relik · {typeCount('trap')} jebakan · {typeCount('field')} medan
            </span>
          </div>

          <div className="flex h-8 items-end gap-1">
            {curve.map((n, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
                <div className="w-full rounded-t bg-yellow-300" style={{ height: `${(n / maxCurve) * 100}%`, minHeight: n ? 2 : 0 }} />
              </div>
            ))}
          </div>
          <div className="-mt-1 flex gap-1 text-center text-[9px] text-white/70">
            {curve.map((_, i) => (
              <span key={i} className="flex-1">{i === 7 ? '7+' : i}</span>
            ))}
          </div>

          <div className="tcg-strip min-h-[7rem] flex-1 overflow-y-auto !p-1">
            {sorted.length === 0 && <p className="p-4 text-center text-xs text-white/70">Ketuk kartu di koleksi untuk menambah, atau pakai “Isi otomatis”.</p>}
            {sorted.map((id) => {
              const c = CARDS[id];
              return (
                <div key={id} className="flex items-center gap-1">
                  <button onClick={() => remove(id)} className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-white/15">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/50 bg-black/30 text-[11px] font-bold text-white">{c.cost}</span>
                    <span className="flex-1 truncate font-semibold" style={{ color: RARITY[c.rarity].color }}>{c.name}</span>
                    <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: ELEMENTS[c.element].color }} />
                    <span className="w-6 text-right font-extrabold">×{counts[id]}</span>
                  </button>
                  <button onClick={() => setInfo(id)} className="rounded-full p-1.5 text-white/70 hover:bg-white/15 hover:text-white" aria-label="Detail">
                    <Info size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {!check.ok && cur.cards.length > 0 && (
            <ul className="space-y-0.5 rounded-md border border-yellow-300/40 bg-black/40 p-2 text-[11px] text-yellow-200">
              {check.errors.slice(0, 3).map((e) => <li key={e}>• {e}</li>)}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value=""
              onChange={(e) => e.target.value && fill(e.target.value)}
              className="tcg-select flex-1 !py-2"
            >
              <option value="">Isi otomatis…</option>
              {ELEMENT_LIST.map((e) => (
                <option key={e.id} value={e.id} className="text-black">{e.name}</option>
              ))}
            </select>
            <button className="btn btn-sm" onClick={() => setCur((d) => ({ ...d, cards: [] }))} title="Kosongkan">
              <Eraser size={14} />
            </button>
            <button className="btn btn-sm btn-danger" onClick={del} title="Hapus deck">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={save} disabled={!dirty && isSaved}>
              <Save size={15} /> Simpan
            </button>
            <button
              className="btn flex-1"
              disabled={!isSaved || dirty || !check.ok}
              onClick={() => { setActiveDeck(cur.id); say('Dijadikan deck aktif'); }}
            >
              <Wand2 size={15} /> Aktifkan
            </button>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="panel !rounded-full px-4 py-2 text-sm font-bold">{toast}</div>
        </div>
      )}
      <AnimatePresence>{info && <CardModal id={info} onClose={() => setInfo(null)} />}</AnimatePresence>
    </div>
  );
}