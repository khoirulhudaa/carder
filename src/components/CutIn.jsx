import { AnimatePresence, motion } from 'framer-motion';
import { CARDS } from '../data/cards.js';
import { ELEMENTS } from '../data/elements.js';

/* ------------------------------------------------------------------ */
/*  CutIn — karakter di gambar kartu "memuncul" dari pinggir layar.    */
/*  kind 'big'  : summon & skill (karakter besar + pita warna elemen)  */
/*  kind 'peek' : serangan biasa & sihir (karakter kecil mengintip)    */
/*  Pemain muncul dari kiri-bawah, lawan dari kanan-atas.              */
/*  Taruh di: src/components/CutIn.jsx                                 */
/* ------------------------------------------------------------------ */

function Art({ card, size, glow }) {
  if (card.img) {
    return (
      <img
        src={card.img}
        alt=""
        draggable={false}
        style={{ width: size, height: size, objectFit: 'contain', filter: `drop-shadow(0 0 18px ${glow}) drop-shadow(0 6px 10px rgba(0,0,0,.6))` }}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        fontSize: size * 0.82,
        lineHeight: 1,
        filter: `drop-shadow(0 0 18px ${glow}) drop-shadow(0 6px 10px rgba(0,0,0,.6))`,
      }}
    >
      {card.icon || '✦'}
    </span>
  );
}

function One({ item }) {
  const card = CARDS[item.cardId];
  if (!card) return null;
  const el = ELEMENTS[card.element] || ELEMENTS.netral || {};
  const col = el.color || '#a5b4fc';
  const from = el.from || col;
  const to = el.to || col;
  const mine = item.side === 'player';
  const big = item.kind === 'big';
  const dir = mine ? -1 : 1; // arah asal: kiri (-1) / kanan (+1)
  const size = big ? Math.min(Math.round((typeof window !== 'undefined' ? window.innerWidth : 800) * 0.55), 300) : 120;
  const dur = big ? 1.15 : 0.7;
  const times = [0, 0.22, 0.78, 1];

  const place = mine
    ? { left: 0, bottom: big ? '16%' : '24%' }
    : { right: 0, top: big ? '10%' : '16%' };

  return (
    <motion.div
      className="absolute"
      style={{ ...place, width: big ? '100%' : size + 24, display: 'flex', justifyContent: mine ? 'flex-start' : 'flex-end' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: dur, times }}
    >
      {/* pita warna elemen + garis kecepatan (hanya untuk 'big') */}
      {big && (
        <motion.div
          className="absolute inset-x-0"
          style={{
            top: '50%',
            height: size * 0.55,
            marginTop: -(size * 0.275),
            transformOrigin: mine ? 'left center' : 'right center',
            background: `linear-gradient(${mine ? 90 : 270}deg, ${from}f2, ${to}cc 55%, ${to}88)`,
            clipPath: mine ? 'polygon(0 0, 100% 8%, 92% 100%, 0 100%)' : 'polygon(0 8%, 100% 0, 100% 100%, 8% 100%)',
            boxShadow: `0 0 40px ${col}88`,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: [0, 1, 1, 0] }}
          transition={{ duration: dur, times, ease: 'easeOut' }}
        >
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.35,
              background: `repeating-linear-gradient(${mine ? 100 : 80}deg, transparent 0 14px, rgba(255,255,255,.55) 14px 16px, transparent 16px 34px)`,
            }}
          />
        </motion.div>
      )}

      {/* karakter */}
      <motion.div
        className="relative"
        style={{ [mine ? 'marginLeft' : 'marginRight']: big ? '4%' : 0 }}
        initial={{ x: dir * (size + 80), rotate: dir * 14, scale: 0.7 }}
        animate={{
          x: [dir * (size + 80), 0, 0, dir * (size + 80)],
          rotate: [dir * 14, 0, dir * -2, dir * 14],
          scale: big ? [0.7, 1.12, 1, 0.8] : [0.7, 1.05, 1, 0.8],
        }}
        transition={{ duration: dur, times, ease: 'easeOut' }}
      >
        <div style={{ transform: mine ? 'none' : 'scaleX(-1)' }}>
          <Art card={card} size={size} glow={col} />
        </div>
      </motion.div>

      {/* teks (nama kartu / nama skill) */}
      {big && (
        <motion.div
          className="absolute"
          style={{
            // teks di sisi seberang karakter: karakter kiri -> teks kanan (dan sebaliknya)
            [mine ? 'right' : 'left']: 'clamp(28px, 13%, 220px)',
            top: '50%',
            transform: 'translateY(-50%)',
            textAlign: mine ? 'right' : 'left',
            maxWidth: `calc(80% - ${size}px)`,
          }}
          initial={{ x: -dir * 60, opacity: 0 }}
          animate={{ x: [-dir * 60, 0, 0, -dir * 60], opacity: [0, 1, 1, 0] }}
          transition={{ duration: dur, times, delay: 0.05 }}
        >
          {item.label && <p className="text-lg font-extrabold uppercase tracking-wide text-white sm:text-3xl" style={{ textShadow: `0 0 12px ${col}, 0 2px 4px rgba(0,0,0,.7)` }}>{item.label}</p>}
          <p className="text-xs font-semibold text-white/85 sm:text-base" style={{ textShadow: '0 2px 4px rgba(0,0,0,.7)' }}>{card.name}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function CutIns({ items }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[48] overflow-hidden" aria-hidden>
      <AnimatePresence>
        {items.map((it) => (
          <div key={it.id}>
            {/* cahaya di pinggir layar sisi asal karakter */}
            <EdgeGlow item={it} />
            <One item={it} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function EdgeGlow({ item }) {
  const card = CARDS[item.cardId];
  if (!card) return null;
  const el = ELEMENTS[card.element] || ELEMENTS.netral || {};
  const col = el.color || '#a5b4fc';
  const mine = item.side === 'player';
  const big = item.kind === 'big';
  return (
    <motion.div
      className="absolute inset-y-0"
      style={{
        [mine ? 'left' : 'right']: 0,
        width: big ? '38%' : '22%',
        background: `linear-gradient(${mine ? 90 : 270}deg, ${col}${big ? '66' : '40'}, transparent)`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: big ? 1.15 : 0.7, times: [0, 0.2, 0.75, 1] }}
    />
  );
}