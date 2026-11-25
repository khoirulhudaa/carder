import { ArrowLeft, Coins } from 'lucide-react';
import { useStore } from '../store/useStore.js';

export default function Header({ title, onBack, children, compact }) {
  const gold = useStore((s) => s.gold);
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#08090d]/80 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur">
      <button className="btn btn-sm !px-2" onClick={onBack} aria-label="Kembali">
        <ArrowLeft size={16} />
      </button>
      <h1 className="whitespace-nowrap text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        {children}
        <span className={`chip ${compact ? 'hidden sm:inline-flex' : ''}`}>
          <Coins size={13} className="text-slate-400" />
          <span className="tabular-nums text-white">{gold}</span>
        </span>
      </div>
    </header>
  );
}