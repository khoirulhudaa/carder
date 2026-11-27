import clsx from 'clsx';
import { Info } from 'lucide-react';
import Card from './Card.jsx';

/* Grid kartu ala "Card Library" TCG Live: bingkai kuning + lencana jumlah putih.
   items: [{ id, badge, dim }]   onPick(id)   onInfo(id) */
export default function CardGrid({ items, onPick, onInfo }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 p-3 pb-6 min-[420px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((it) => (
        <div key={it.id} className="group relative flex justify-center">
          <div className={clsx('tcg-cardframe w-full max-w-[150px] transition', it.dim && 'is-dim', onPick && 'cursor-pointer hover:-translate-y-1')}>
            <div className="[&>*]:!w-full" onClick={() => onPick && onPick(it.id)}>
              <Card id={it.id} size="md" className="!text-[11px] sm:!text-[12px]" />
            </div>
            {it.badge != null && <span className="tcg-count">{it.badge}</span>}
            {onInfo && (
              <button
                onClick={(e) => { e.stopPropagation(); onInfo(it.id); }}
                aria-label="Detail"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition hover:bg-black/80"
              >
                <Info size={13} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}