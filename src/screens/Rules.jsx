import Header from '../components/Header.jsx';
import { ELEMENT_LIST, ELEMENTS, relations } from '../data/elements.js';
import { KEYWORDS } from '../data/effects.js';
import { START_LP, SLOTS, START_HAND, HAND_LIMIT, MAX_MANA, DECK_MIN, DECK_MAX } from '../engine/constants.js';

const Section = ({ title, children }) => (
  <section className="panel space-y-2 p-4">
    <h2 className="font-display text-lg font-extrabold text-amber-200">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-slate-200">{children}</div>
  </section>
);

export default function Rules({ onBack }) {
  return (
    <div className="flex h-[100dvh] flex-col">
      <Header title="Cara Main" onBack={onBack} />
      <div className="mx-auto w-full max-w-8xl flex-1 space-y-4 overflow-y-auto p-4 pb-10">
        <Section title="🎯 Tujuan">
          <p>
            Turunkan LP lawan dari <b>{START_LP}</b> sampai 0. Kamu juga menang jika lawan tak bisa menarik kartu (deck habis). Kamu kalah jika LP-mu 0.
          </p>
        </Section>

        <Section title="🔁 Alur Giliran">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Energi (⚡) bertambah 1 tiap giliranmu (maks {MAX_MANA}) dan terisi penuh.</li>
            <li>Tarik 1 kartu. Tangan maksimal {HAND_LIMIT} kartu; kartu berlebih terbuang. Awal duel: {START_HAND} kartu (yang jalan kedua mendapat 1 ekstra).</li>
            <li>Monster yang terbakar menerima damage, monster beku lewat giliran, efek awal giliran berjalan.</li>
            <li>Lakukan aksi sebebasnya: panggil monster, mainkan sihir, pasang relik/jebakan/medan, serang, atau pakai skill — selama energi cukup.</li>
            <li>Tekan <b>Akhiri Giliran</b>. Giliran pertama permainan tidak boleh menyerang.</li>
          </ol>
        </Section>

        <Section title="🃏 Jenis Kartu">
          <ul className="space-y-1.5">
            <li>🐾 <b>Monster</b> — punya ATK, DEF, HP, sifat, dan <b>skill aktif</b>. Maks {SLOTS} di papan. Monster baru butuh 1 giliran sebelum bisa beraksi (kecuali punya <i>Cepat</i>).</li>
            <li>📖 <b>Sihir</b> — efek instan lalu masuk kuburan: damage, penyembuhan, tarik kartu, hancurkan, dll.</li>
            <li>💎 <b>Relik</b> — dipasang ke monstermu, memberi stat/sifat permanen.</li>
            <li>🪤 <b>Jebakan</b> — dipasang tertutup (maks {SLOTS}), aktif otomatis saat lawan menyerang, memanggil monster, atau memainkan sihir.</li>
            <li>🏞️ <b>Medan</b> — aura permanen untuk monster elemen tertentu. Medan baru menggantikan yang lama.</li>
          </ul>
        </Section>

        <Section title="⚔️ Pertarungan">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Monster posisi <b>Serang</b> bisa menyerang 1×/giliran. Monster posisi <b>Bertahan</b> tidak bisa menyerang, tapi DEF-nya mengurangi damage yang masuk. Ganti posisi memakai aksi monster itu.</li>
            <li>Serang monster: target menerima ATK (setelah pengali elemen). Jika target posisi Serang, ia <b>membalas</b> dengan ATK-nya.</li>
            <li>Jika monster hancur dan ada sisa damage, <b>50% sisa</b> mengenai LP lawan (<i>Tembus</i>: 100%).</li>
            <li>Jika lawan tak punya monster, kamu bisa <b>serang langsung</b> ke LP.</li>
            <li>Monster ber-<i>Penjaga</i> wajib diserang lebih dulu.</li>
            <li><b>Skill</b> monster memakai energi dan juga menghabiskan aksi monster itu pada giliran tersebut.</li>
          </ul>
        </Section>

        <Section title="🌈 Elemen & Kelemahan">
          <p>Damage elemen ×1.5 jika kuat, ×0.75 jika lemah. Lingkarannya:</p>
          <p className="rounded-lg bg-black/30 p-2 text-center text-lg">
            🔥 → 🌿 → 🪨 → ⚡ → 🌪️ → 💧 → 🔥
          </p>
          <p className="text-xs text-slate-400">(panah = “kuat melawan”) · ✨ Cahaya dan 🌑 Gelap saling kuat satu sama lain (×1.5 dua arah).</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {ELEMENT_LIST.map((e) => {
              const r = relations(e.id);
              return (
                <div key={e.id} className="rounded-lg bg-black/25 p-2 text-xs">
                  <b style={{ color: e.color }}>{e.icon} {e.name}</b> — {e.desc}
                  <div className="text-slate-400">
                    Kuat: {r.strong.map((x) => ELEMENTS[x].icon).join(' ') || '—'} · Lemah: {r.weak.map((x) => ELEMENTS[x].icon).join(' ') || '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="✨ Sifat Khusus">
          <ul className="space-y-1">
            {Object.values(KEYWORDS).map((k) => (
              <li key={k.name}><b>{k.icon} {k.name}</b> — {k.desc}</li>
            ))}
          </ul>
          <p className="text-xs text-slate-400">Efek lain: ❄️ Beku (lewat 1 giliran), 🔥 Terbakar (damage tiap giliran selama 3 giliran), ✦ menandakan monster punya skill.</p>
        </Section>

        <Section title="🛠️ Deck & Koleksi">
          <ul className="list-disc space-y-1 pl-5">
            <li>Deck berisi {DECK_MIN}–{DECK_MAX} kartu. Batas salinan: Biasa 3, Langka 3, Epik 2, Legenda 1.</li>
            <li>Menang duel memberi koin. Gunakan koin untuk membeli pack di Toko dan memperluas koleksi.</li>
            <li>Kartu <b>Netral</b> boleh dipakai di deck elemen apa pun.</li>
          </ul>
        </Section>

        <Section title="💡 Tips">
          <ul className="list-disc space-y-1 pl-5">
            <li>Ketuk/arahkan kursor ke kartu untuk membaca detailnya. Di HP, ketuk kartu di tangan lalu pilih aksi.</li>
            <li>Pasang jebakan sebelum menyerang — lawan sering menyerang tanpa curiga.</li>
            <li>Lawan elemen yang kamu kalahkan secara elemen = damage lebih besar. Susun deck dua elemen yang saling melengkapi.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
