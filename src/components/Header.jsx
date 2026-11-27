import { ArrowLeft, Coins, Gem } from 'lucide-react';
import { useStore } from '../store/useStore.js';

/* Bar atas merah ala TCG Live: tombol kembali, judul, koin di kanan.
   Props sama seperti sebelumnya: title, onBack, compact, children (tab/aksi tambahan). */
export default function Header({ title, onBack, compact = false, children }) {
  const gold = useStore((s) => s.gold);
  return (
    <header className={`tcg-nav shrink-0 ${compact ? '' : 'sm:min-h-[52px]'} pt-[max(0px,env(safe-area-inset-top))]`}>
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Kembali"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-700 shadow transition hover:bg-white active:scale-95"
        >
          <ArrowLeft size={18} strokeWidth={3} />
        </button>
      )}
      <h1 className="tcg-tab tcg-tab-on !py-3 text-sm">{title}</h1>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      <span className="tcg-currency">
        <Coins size={14} className="text-yellow-300" />
        {gold.toLocaleString()}
      </span>
    </header>
  );
}