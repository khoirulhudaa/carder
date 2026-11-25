# ELEMENTRA — Duel Kartu Elemental

Game kartu strategi bergaya **Pokémon TCG × Yu-Gi-Oh!**, dibuat dengan **React + Tailwind CSS + Vite**,
Zustand (state & simpan progres), Framer Motion (animasi), dan Lucide (ikon).
Responsif untuk **PC dan HP**, bisa dimainkan offline melawan AI.

## Cara menjalankan

Butuh **Node.js 18+** (cek: `node -v`).

```bash
npm install        # sekali saja
npm run dev        # buka http://localhost:5173
```

Perintah lain:

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Mode pengembangan (hot reload) |
| `npm run build` | Build produksi ke folder `dist/` |
| `npm run preview` | Menjalankan hasil build di `http://localhost:4173` |
| `npm run simulate 200` | Simulasi 200 duel AI vs AI untuk menguji aturan |

**Main di HP:** jalankan `npm run dev`, lihat alamat `Network:` di terminal
(mis. `http://192.168.1.10:5173`), lalu buka di HP yang terhubung ke WiFi yang sama.

## Isi game

- **83 kartu** · 8 elemen (🔥 Api, 💧 Air, 🪨 Tanah, 🌪️ Angin, ⚡ Petir, 🌿 Alam, ✨ Cahaya, 🌑 Gelap) + Netral
- **5 jenis kartu:** Monster, Sihir, Relik, Jebakan, Medan
- **4 kelangkaan:** Biasa, Langka, Epik, Legenda (kartu holografik)
- **Stat monster:** ATK, DEF, HP, biaya energi, sifat (Cepat, Tembus, Penjaga, Hisap, Perisai), dan **skill aktif**
- **Sistem elemen:** lingkaran Api → Alam → Tanah → Petir → Angin → Air → Api (×1.5 / ×0.75), Cahaya ⇄ Gelap saling kuat
- **Duel vs AI:** 8 juara elemen + lawan acak, 3 tingkat kesulitan
- **Deck Builder** (30–40 kartu, batas salinan per kelangkaan, isi otomatis, kurva energi)
- **Toko Pack:** buka pack dengan animasi balik kartu, pack per elemen, jual kartu kelebihan
- **Koleksi & progres tersimpan** otomatis di browser (localStorage)

## Cara bermain singkat

1. Mulai dengan LP 6000. Energi ⚡ naik 1 tiap giliran (maks 10).
2. Panggil monster, mainkan sihir, pasang relik/jebakan/medan.
3. Ketuk kartu (HP) atau arahkan kursor (PC) untuk melihat detail; pilih aksi di panel.
4. Monster posisi **Serang** menyerang 1×/giliran dan dibalas bila target posisi Serang. Posisi **Bertahan** memakai DEF.
5. Habiskan LP lawan, atau buat deck lawan habis.

Aturan lengkap ada di menu **Cara Main** di dalam game.

## Struktur proyek

```
src/
  data/       cards.js (semua kartu), elements.js, effects.js, describe.js, opponents.js
  engine/     engine.js (aturan duel, murni JS), ai.js (lawan), deck.js, constants.js
  store/      useStore.js (koin, koleksi, deck, statistik — tersimpan)
  components/ Card, MonsterTile, CardModal, CardGrid, Filters, Header
  screens/    Menu, DuelSetup, Duel, DeckBuilder, Collection, Shop, Rules, StarterPick
scripts/      simulate.mjs
```

## Menambah kartu sendiri

Buka `src/data/cards.js` dan tambahkan satu baris, contoh monster:

```js
mon('api_contoh', 'Nama Kartu', 'api', 'R', 3, 1400, 600, 1300, '🔥', 'Ras',
  { kw: ['haste'], summon: [dmg('randEnemy', 500)],
    skill: sk('Nama Skill', 2, 'enemyMonster', [dmg('T', 800)]) },
  'Teks cerita kartu.');
```

Efek yang tersedia (`src/data/effects.js`): `dmg`, `heal`, `buff`, `draw`, `destroy`, `stun`, `burn`,
`shield`, `token`, `revive`, `negate`, `bounce`, `discard`. Deskripsi di kartu dibuat otomatis.
Setelah menambah kartu, jalankan `npm run simulate` untuk memastikan engine tetap stabil.

## Reset progres

Menu utama → **Reset progres** (bawah layar).
