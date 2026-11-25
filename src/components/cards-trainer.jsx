// =====================================================================
//  🎓 KARTU TRAINER — 5 KARTU BARU
//  Tempel di cards.js (di atas bagian "TOKEN"), setelah Gelombang 4.
//  Dibuat dengan helper spell() yang sudah ada, jadi langsung jalan
//  tanpa perubahan engine. Pita "TRAINER" lewat field tag.
//
//  Desain khusus: tiap kartu punya  skin: 'trainer'  dan  grad: [warna1, warna2, warna3].
//  Di komponen kartu: tambahkan class "card--trainer" bila card.skin === 'trainer',
//  lalu set style="--t1:..;--t2:..;--t3:.." dari card.grad  (lihat trainer-card.css).
//  Trainer tidak memakai foil, supaya tampilannya matte dan kasar.
// =====================================================================
spell('trn_profesor', 'Profesor Elemen', 'netral', 'R', 2, null, [draw(3)], '👨‍🔬', 'Satu kuliah singkat, tiga ilmu baru.', { tag: 'TRAINER', skin: 'trainer', grad: ['#2dd4bf', '#1d4ed8', '#1e1b4b'] });
spell('trn_pelatih', 'Pelatih Tangguh', 'netral', 'R', 2, 'allyMonster', [buff('T', { atk: 500, hp: 500 })], '🧢', 'Latihan keras hari ini, juara esok hari.', { tag: 'TRAINER', skin: 'trainer', grad: ['#bef264', '#65a30d', '#365314'] });
spell('trn_perawat', 'Perawat Klinik Elemen', 'netral', 'E', 3, null, [heal('allAlly', 1200), heal('me', 800)], '👩‍⚕️', 'Semua monster pulih sebelum pertandingan berikutnya.', { tag: 'TRAINER', skin: 'trainer', grad: ['#fda4af', '#e11d48', '#4c0519'] });
spell('trn_rival', 'Rival Berbahaya', 'netral', 'E', 3, 'enemyMonster', [bounce('T'), dmg('foe', 500)], '😤', 'Ia datang menantang, lalu mengusir lawan dari arena.', { tag: 'TRAINER', skin: 'trainer', grad: ['#c4b5fd', '#7c3aed', '#2e1065'] });
spell('trn_juara', 'Juara Liga', 'netral', 'L', 5, null, [buff('allAlly', { atk: 400, def: 300 }), draw(2), mana(1)], '🏅', 'Sabuk juara membangkitkan seluruh pasukan.', { tag: 'TRAINER', skin: 'trainer', grad: ['#fde047', '#d97706', '#451a03'] });