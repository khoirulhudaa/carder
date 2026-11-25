import { useState } from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { ELEMENT_LIST, ELEMENTS } from '../data/elements.js';
import { ALL_CARDS } from '../data/cards.js';
import { RARITY, TYPE_NAMES } from '../engine/constants.js';

const TYPE_ORDER = ['monster', 'spell', 'relic', 'trap', 'field'];
const EL_ORDER = ['api', 'air', 'tanah', 'angin', 'petir', 'alam', 'cahaya', 'gelap', 'netral'];

export function useFilters() {
  const [el, setEl] = useState('all');
  const [type, setType] = useState('all');
  const [rar, setRar] = useState('all');
  const [q, setQ] = useState('');
  const [onlyOwned, setOnlyOwned] = useState(false);

  const apply = (collection) =>
    ALL_CARDS.filter((c) => {
      if (el !== 'all' && c.element !== el) return false;
      if (type !== 'all' && c.type !== type) return false;
      if (rar !== 'all' && c.rarity !== rar) return false;
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (onlyOwned && !(collection?.[c.id] > 0)) return false;
      return true;
    }).sort(
      (a, b) =>
        EL_ORDER.indexOf(a.element) - EL_ORDER.indexOf(b.element) ||
        TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) ||
        a.cost - b.cost,
    );

  return { el, setEl, type, setType, rar, setRar, q, setQ, onlyOwned, setOnlyOwned, apply };
}

export function FilterBar({ f }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button className={clsx('chip shrink-0', f.el === 'all' && 'chip-on')} onClick={() => f.setEl('all')}>
          Semua
        </button>
        {[...ELEMENT_LIST, ELEMENTS.netral].map((e) => (
          <button key={e.id} className={clsx('chip shrink-0', f.el === e.id && 'chip-on')} onClick={() => f.setEl(f.el === e.id ? 'all' : e.id)} title={e.name}>
            <i className="h-2 w-2 rounded-full" style={{ background: e.color }} />
            {e.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <select value={f.type} onChange={(e) => f.setType(e.target.value)} className="chip bg-[#151a23] !py-1.5">
          <option value="all">Semua jenis</option>
          {TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {TYPE_NAMES[t]}
            </option>
          ))}
        </select>
        <select value={f.rar} onChange={(e) => f.setRar(e.target.value)} className="chip bg-[#151a23] !py-1.5">
          <option value="all">Semua kelangkaan</option>
          {Object.values(RARITY).map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button className={clsx('chip', f.onlyOwned && 'chip-on')} onClick={() => f.setOnlyOwned(!f.onlyOwned)}>
          Punya saja
        </button>
        <label className="chip min-w-0 flex-1 gap-1.5">
          <Search size={13} className="shrink-0 opacity-60" />
          <input
            value={f.q}
            onChange={(e) => f.setQ(e.target.value)}
            placeholder="Cari nama…"
            className="w-full min-w-0 bg-transparent outline-none placeholder:text-slate-500"
          />
        </label>
      </div>
    </div>
  );
}