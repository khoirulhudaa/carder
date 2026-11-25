import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

const KIND = {
  aksi: { label: 'Aksi', cls: 'text-white' },
  lp: { label: 'LP', cls: 'text-rose-300' },
  hp: { label: 'Monster', cls: 'text-orange-300' },
  energi: { label: 'Energi', cls: 'text-indigo-300' },
  status: { label: 'Status', cls: 'text-violet-300' },
  kartu: { label: 'Kartu', cls: 'text-sky-300' },
};

function Detail({ items }) {
  return items.map((it) =>
    it.kind === 'giliran' ? (
      <div key={it.id} className="my-1.5 flex items-center gap-2 text-[10px] font-medium text-slate-500">
        <i className="h-px flex-1 bg-white/10" />
        <span className="shrink-0">{it.text}</span>
        <i className="h-px flex-1 bg-white/10" />
      </div>
    ) : (
      <div key={it.id} className={clsx('border-l-2 py-0.5 pl-2', it.side === 'player' ? 'border-sky-400/50' : 'border-rose-400/50')}>
        <p className="leading-snug text-slate-200">
          <b className={clsx('mr-1 text-[10px] font-semibold', KIND[it.kind]?.cls)}>{KIND[it.kind]?.label}</b>
          {it.text}
        </p>
        {it.cause && <p className="text-[10px] leading-snug text-slate-500">Karena: {it.cause}</p>}
      </div>
    ),
  );
}

// Tab "Rincian" (apa yang terjadi + penyebabnya) dan "Catatan" (log ringkas dari engine).
export default function DuelLog({ g, detail, className }) {
  const [tab, setTab] = useState('rincian');
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [detail.length, g.log.length, tab]);

  return (
    <div className={clsx('flex min-h-0 flex-col', className)}>
      <div className="mb-1.5 flex shrink-0 gap-1">
        {[['rincian', 'Rincian'], ['catatan', 'Catatan']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={clsx('chip !px-2.5 !py-0.5 text-[11px]', tab === id && 'chip-on')}>
            {label}
          </button>
        ))}
      </div>
      <div ref={ref} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto rounded-lg border border-white/[0.07] bg-white/[0.03] p-2 text-[11px]">
        {tab === 'rincian' ? (
          <Detail items={detail} />
        ) : (
          g.log.map((l) => (
            <p key={l.id} className={l.side === 'player' ? 'text-sky-200' : 'text-rose-200'}>{l.text}</p>
          ))
        )}
      </div>
    </div>
  );
}