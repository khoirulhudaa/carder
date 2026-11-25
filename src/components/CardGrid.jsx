import { Info } from 'lucide-react';
import Card, { SIZE } from './Card.jsx';

// items: [{ id, badge?, dim? }]
export default function CardGrid({ items, onPick, onInfo, size = 'grid', empty = 'Tidak ada kartu.' }) {
  if (!items.length) return <p className="py-10 text-center text-sm text-slate-400">{empty}</p>;
  return (
    <div className="flex flex-wrap justify-between gap-x-2 gap-y-8 pb-6 pt-2">
      {items.map((it) => (
        <div key={it.id} className={`relative ${SIZE[size]}`}>
          <Card id={it.id} size={size} dim={it.dim} onClick={onPick ? () => onPick(it.id) : () => onInfo?.(it.id)} className="hover:-translate-y-1" />
          {it.badge != null && (
            <span className="absolute -right-1.5 -top-2 z-10 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border border-white/20 bg-[#0d1017] px-1 text-xs font-semibold text-white">
              {it.badge}
            </span>
          )}
          {onInfo && onPick && (
            <button
              onClick={(e) => { e.stopPropagation(); onInfo(it.id); }}
              className="absolute right-[0.6em] top-[2.7em] z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#0d1017]/90 text-white/80 ring-1 ring-white/15 hover:text-white"
              aria-label="Lihat detail"
            >
              <Info size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}