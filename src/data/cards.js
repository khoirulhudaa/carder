import { fx } from './effects.js';

const { dmg, heal, buff, tbuff, mana, draw, destroy, stun, burn, shield, token, revive, negate, bounce, discard } = fx;

const LIST = [];

// ---------- helper pembuat kartu ----------
// x.foil : 'rainbow' | 'holo' | 'gold' | 'aurora' | 'cosmic' | 'ember' | 'frost' | 'emerald'  (kartu mengkilap)
// x.tag  : 'GX' | 'EX' | ... (pita spesial di kartu)
// x.img  : URL gambar ilustrasi (opsional, menggantikan emoji)
const mon = (id, name, element, rarity, cost, atk, def, hp, icon, race, x = {}, flavor = '') =>
  LIST.push({
    id, type: 'monster', name, element, rarity, cost, atk, def, hp, icon, race,
    kw: x.kw || [], skill: x.skill || null,
    onSummon: x.summon || null, onDeath: x.death || null,
    onStart: x.start || null, onAttack: x.attack || null,
    foil: x.foil || null, tag: x.tag || null, img: x.img || null,
    flavor,
  });

const spell = (id, name, element, rarity, cost, target, effects, icon, flavor = '', extra = {}) =>
  LIST.push({ id, type: 'spell', name, element, rarity, cost, target, fx: effects, icon, flavor, foil: null, tag: null, img: null, ...extra });

const relic = (id, name, element, rarity, cost, bonus, icon, flavor = '', extra = {}) =>
  LIST.push({
    id, type: 'relic', name, element, rarity, cost, target: 'allyMonster',
    atk: bonus.atk || 0, def: bonus.def || 0, hp: bonus.hp || 0, kw: bonus.kw || [], icon, flavor,
    foil: null, tag: null, img: null, ...extra,
  });

const trap = (id, name, element, rarity, cost, trigger, effects, icon, flavor = '', extra = {}) =>
  LIST.push({ id, type: 'trap', name, element, rarity, cost, trigger, fx: effects, icon, flavor, foil: null, tag: null, img: null, ...extra });

const field = (id, name, element, rarity, cost, aura, start, icon, flavor = '', extra = {}) =>
  LIST.push({ id, type: 'field', name, element, rarity, cost, aura, onStart: start, icon, flavor, foil: null, tag: null, img: null, ...extra });

const sk = (name, cost, t, effects) => ({ name, cost, t, fx: effects });

// =====================================================================
//  API 🔥
// =====================================================================
mon('api_kobar', 'Kobar Muda', 'api', 'C', 1, 600, 200, 500, '🦎', 'Naga', { kw: ['haste'] }, 'Api kecil yang tak sabar membakar dunia.');
mon('api_pemanah', 'Pemanah Bara', 'api', 'C', 2, 900, 300, 800, '🏹', 'Pemanah', { skill: sk('Panah Api', 1, 'enemyMonster', [dmg('T', 500)]) }, 'Anak panahnya tak pernah padam.');
mon('api_ksatria', 'Ksatria Magma', 'api', 'R', 3, 1400, 600, 1300, '⚔️', 'Ksatria', { summon: [burn('randEnemy', 200)] }, 'Ditempa di dasar kawah gunung berapi.');
mon('api_penyihir', 'Penyihir Inferno', 'api', 'R', 4, 1500, 500, 1400, '🧙', 'Penyihir', { skill: sk('Bola Inferno', 2, 'enemyMonster', [dmg('T', 1000)]) }, 'Jubahnya selalu berasap.');
mon('api_phoenix', 'Phoenix Fajar', 'api', 'E', 5, 2100, 800, 2000, '🦚', 'Burung Suci', { kw: ['haste'], death: [token('tkn_abu')] }, 'Dari abu ia lahir kembali, setiap fajar.');
mon('api_naga', 'Naga Bara Purba', 'api', 'L', 7, 3200, 1200, 3400, '🐉', 'Naga', { kw: ['pierce'], summon: [dmg('allEnemy', 600)], skill: sk('Nafas Neraka', 3, null, [dmg('allEnemy', 1000)]) }, 'Satu embusan napasnya membakar seluruh lembah.');

// =====================================================================
//  AIR 💧
// =====================================================================
mon('air_ubur', 'Ubur Jernih', 'air', 'C', 1, 400, 400, 800, '🪼', 'Roh Air', { skill: sk('Tetes Penyembuh', 1, 'allyMonster', [heal('T', 500)]) }, 'Menari tenang di arus pasang.');
mon('air_duyung', 'Putri Duyung', 'air', 'C', 2, 800, 500, 1000, '🧜', 'Peri Air', { start: [heal('me', 300)] }, 'Nyanyiannya menyembuhkan luka batin.');
mon('air_kura', 'Kura Cangkang Baja', 'air', 'R', 3, 1000, 1100, 1800, '🐢', 'Hewan', { kw: ['taunt'] }, 'Lambat, tapi tak ada yang mampu menembusnya.');
mon('air_es', 'Penyihir Es', 'air', 'R', 4, 1400, 600, 1500, '🧊', 'Penyihir', { skill: sk('Pembekuan', 2, 'enemyMonster', [dmg('T', 300), stun('T')]) }, 'Napasnya membekukan waktu.');
mon('air_kraken', 'Kraken Palung', 'air', 'E', 5, 2100, 900, 2500, '🐙', 'Monster Laut', { summon: [bounce('randEnemy')] }, 'Tentakelnya menyeret apa pun kembali ke asalnya.');
mon('air_leviathan', 'Leviathan Samudra', 'air', 'L', 7, 2800, 1500, 3800, '🐋', 'Naga Laut', { summon: [heal('me', 1500)], skill: sk('Tsunami', 3, null, [dmg('allEnemy', 700), stun('allEnemy')]) }, 'Samudra sendiri yang bangkit dan berbicara.');

// =====================================================================
//  TANAH 🪨
// =====================================================================
mon('tnh_kerikil', 'Kerikil Hidup', 'tanah', 'C', 1, 300, 700, 900, '🪨', 'Golem', {}, 'Ia hanya ingin diam. Jangan ganggu.');
mon('tnh_kurcaci', 'Kurcaci Penambang', 'tanah', 'C', 2, 800, 600, 1100, '⛏️', 'Kurcaci', { summon: [draw(1)] }, 'Selalu menemukan sesuatu di bawah tanah.');
mon('tnh_golem', 'Golem Granit', 'tanah', 'R', 3, 1200, 1200, 2000, '🗿', 'Golem', { kw: ['taunt'] }, 'Dinding hidup yang berjalan.');
mon('tnh_ksatria', 'Ksatria Bumi', 'tanah', 'R', 4, 1500, 1300, 2200, '🛡️', 'Ksatria', { skill: sk('Dinding Bumi', 2, 'allyMonster', [shield('T')]) }, 'Sumpahnya lebih keras dari baja.');
mon('tnh_beruang', 'Beruang Gunung', 'tanah', 'E', 5, 2300, 1200, 2800, '🐻', 'Hewan Buas', { death: [dmg('allEnemy', 600)] }, 'Saat tumbang, gunung ikut bergemuruh.');
mon('tnh_titan', 'Titan Gunung Tua', 'tanah', 'L', 7, 2800, 2000, 4500, '🏔️', 'Titan', { kw: ['taunt', 'shield'], skill: sk('Hantaman Gempa', 3, null, [dmg('allEnemy', 800)]) }, 'Ia tertidur seribu tahun. Kini ia terjaga.');

// =====================================================================
//  ANGIN 🌪️
// =====================================================================
mon('agn_kolibri', 'Kolibri Cepat', 'angin', 'C', 1, 500, 200, 500, '🐦', 'Burung', { kw: ['haste'] }, 'Sayapnya terlalu cepat untuk dilihat.');
mon('agn_elang', 'Pemburu Elang', 'angin', 'C', 2, 900, 300, 800, '🪶', 'Pemburu', { kw: ['haste'] }, 'Matanya menangkap bayangan di ketinggian.');
mon('agn_ninja', 'Ninja Badai', 'angin', 'R', 3, 1300, 400, 1100, '🥷', 'Ninja', { kw: ['haste'], skill: sk('Tebasan Kilat', 1, 'enemyMonster', [dmg('T', 500)]) }, 'Menghilang sebelum angin berembus.');
mon('agn_topan', 'Penyihir Topan', 'angin', 'R', 4, 1400, 600, 1500, '🌪️', 'Penyihir', { summon: [draw(1)] }, 'Menggulung rahasia dari seluruh penjuru.');
mon('agn_griffin', 'Griffin Langit', 'angin', 'E', 5, 2100, 800, 2100, '🦅', 'Makhluk Langit', { kw: ['haste', 'pierce'] }, 'Cakarnya menembus zirah paling tebal.');
mon('agn_rajawali', 'Roh Badai Kuno', 'angin', 'L', 7, 3000, 1000, 3000, '🌀', 'Roh Angin', { summon: [draw(2)], skill: sk('Topan Penghancur', 3, null, [dmg('allEnemy', 900)]) }, 'Badai pertama di dunia, masih marah.');

// =====================================================================
//  PETIR ⚡
// =====================================================================
mon('ptr_tikus', 'Tikus Listrik', 'petir', 'C', 1, 500, 200, 500, '🐭', 'Hewan', { summon: [dmg('foe', 300)] }, 'Gigitan kecil, setrum besar.');
mon('ptr_robot', 'Robot Kilat', 'petir', 'C', 2, 1000, 400, 700, '🤖', 'Mekanik', { skill: sk('Sengatan', 1, 'enemyMonster', [dmg('T', 400)]) }, 'Dirakit dari sisa menara petir.');
mon('ptr_dukun', 'Dukun Guntur', 'petir', 'R', 3, 1300, 400, 1100, '🌩️', 'Dukun', { skill: sk('Sambaran', 2, 'enemyMonster', [dmg('T', 900)]) }, 'Memanggil langit lewat tarian.');
mon('ptr_serigala', 'Serigala Kilat', 'petir', 'R', 4, 1900, 500, 1500, '🐺', 'Hewan Buas', { kw: ['haste'] }, 'Larinya meninggalkan bekas hangus.');
mon('ptr_valkyrie', 'Valkyrie Petir', 'petir', 'E', 5, 2200, 700, 1900, '👸', 'Valkyrie', { kw: ['pierce'], summon: [dmg('randEnemy', 700)] }, 'Tombaknya adalah petir yang memadat.');
mon('ptr_raja', 'Raja Halilintar', 'petir', 'L', 7, 3300, 900, 3200, '👑', 'Dewa Petir', { skill: sk('Murka Langit', 4, null, [dmg('allEnemy', 1200), dmg('foe', 800)]) }, 'Ketika ia marah, malam menjadi siang.');

// =====================================================================
//  ALAM 🌿
// =====================================================================
mon('alm_tunas', 'Tunas Ceria', 'alam', 'C', 1, 400, 300, 900, '🌱', 'Tumbuhan', { start: [heal('src', 300)] }, 'Tumbuh sedikit lebih kuat tiap pagi.');
mon('alm_peri', 'Peri Hutan', 'alam', 'C', 2, 800, 400, 1000, '🧚', 'Peri', { summon: [heal('me', 500)] }, 'Serbuk sarinya menyembuhkan.');
mon('alm_rusa', 'Rusa Zamrud', 'alam', 'R', 3, 1200, 700, 1600, '🦌', 'Hewan', { skill: sk('Berkah Alam', 1, 'allyMonster', [heal('T', 700)]) }, 'Tanduknya bertunas di setiap musim semi.');
mon('alm_druid', 'Druid Akar', 'alam', 'R', 4, 1400, 800, 1800, '🍃', 'Druid', { summon: [token('tkn_sulur')] }, 'Berbicara dengan akar-akar tua.');
mon('alm_ent', 'Ent Kuno', 'alam', 'E', 5, 2000, 1500, 3000, '🌳', 'Roh Hutan', { kw: ['taunt'], start: [heal('me', 400)] }, 'Berdiri sejak sebelum kerajaan pertama.');
mon('alm_dewi', 'Dewi Hutan Abadi', 'alam', 'L', 7, 2600, 1400, 3800, '🌸', 'Dewi', { summon: [heal('allAlly', 1000)], death: [revive(4)] }, 'Selama ada hutan, ia tak akan benar-benar pergi.');

// =====================================================================
//  CAHAYA ✨
// =====================================================================
mon('chy_anak', 'Anak Malaikat', 'cahaya', 'C', 1, 500, 400, 700, '👼', 'Malaikat', { summon: [heal('me', 400)] }, 'Tawanya menghangatkan medan perang.');
mon('chy_pendeta', 'Pendeta Cahaya', 'cahaya', 'C', 2, 700, 600, 1000, '🕯️', 'Pendeta', { skill: sk('Berkati', 1, 'allyMonster', [buff('T', { atk: 300 })]) }, 'Doanya menyalakan keberanian.');
mon('chy_paladin', 'Paladin Suci', 'cahaya', 'R', 3, 1300, 900, 1700, '🗡️', 'Paladin', { kw: ['shield'] }, 'Cahaya melindunginya dari serangan pertama.');
mon('chy_unicorn', 'Unicorn Murni', 'cahaya', 'R', 4, 1500, 800, 1800, '🦄', 'Hewan Suci', { skill: sk('Penyembuhan Suci', 2, 'allyMonster', [heal('T', 1000), heal('me', 500)]) }, 'Tanduknya menghapus luka apa pun.');
mon('chy_agung', 'Malaikat Agung', 'cahaya', 'E', 5, 2200, 1000, 2300, '😇', 'Malaikat', { kw: ['shield'], summon: [buff('allAlly', { atk: 200 })] }, 'Sayapnya menaungi seluruh pasukan.');
mon('chy_serafim', 'Serafim Surgawi', 'cahaya', 'L', 7, 2900, 1300, 3600, '🌟', 'Serafim', { kw: ['shield'], summon: [heal('me', 2000)], skill: sk('Penghakiman', 4, 'enemyMonster', [destroy('T')]) }, 'Putusannya mutlak, cahayanya tak berampun.');

// =====================================================================
//  GELAP 🌑
// =====================================================================
mon('glp_kelelawar', 'Kelelawar Malam', 'gelap', 'C', 1, 500, 200, 500, '🦇', 'Hewan', { kw: ['lifesteal'] }, 'Menghisap bayangan dan mangsa.');
mon('glp_hantu', 'Hantu Pencuri', 'gelap', 'C', 2, 800, 300, 800, '👻', 'Hantu', { summon: [discard(1)] }, 'Mencuri kartu dari tangan lawan.');
mon('glp_vampir', 'Vampir Bangsawan', 'gelap', 'R', 3, 1300, 500, 1300, '🧛', 'Vampir', { kw: ['lifesteal'] }, 'Elegan, haus, dan abadi.');
mon('glp_maut', 'Ksatria Maut', 'gelap', 'R', 4, 1800, 800, 1700, '💀', 'Undead', { death: [token('tkn_tengkorak')] }, 'Mati sekali tidak cukup baginya.');
mon('glp_iblis', 'Iblis Bayangan', 'gelap', 'E', 5, 2300, 700, 2100, '👹', 'Iblis', { kw: ['lifesteal'], skill: sk('Cakar Bayangan', 2, 'enemyMonster', [dmg('T', 1000)]) }, 'Bayangan yang belajar menggigit.');
mon('glp_raja', 'Raja Kegelapan', 'gelap', 'L', 7, 3200, 1100, 3300, '😈', 'Raja Iblis', { kw: ['lifesteal', 'pierce'], summon: [destroy('randEnemy')] }, 'Kehadirannya saja sudah memadamkan harapan.');

// =====================================================================
//  ★ KARTU BARU — MONSTER ★
// =====================================================================

// ---------- API ----------
mon('api_gladiator', 'Gladiator Arang', 'api', 'R', 3, 1500, 500, 1200, '🪓', 'Prajurit', { kw: ['haste'], summon: [dmg('foe', 300)] }, 'Arena adalah rumahnya, bara adalah teman setianya.');
mon('api_rubah', 'Rubah Ekor Sembilan', 'api', 'E', 5, 2300, 700, 1900, '🦊', 'Roh Rubah', { foil: 'holo', summon: [burn('randEnemy', 300)] }, 'Tiap ekornya menyimpan satu api yang berbeda.');
mon('api_ifrit', 'Ifrit Gurun Bara', 'api', 'L', 8, 3800, 1200, 3600, '🧞', 'Jin Api', {
  foil: 'ember', tag: 'GX', kw: ['pierce'],
  summon: [dmg('allEnemy', 800)],
  skill: sk('Ledakan Matahari', 4, null, [dmg('allEnemy', 1500), burn('randEnemy', 400)]),
}, 'Gurun pun meleleh saat ia terbangun dari lampunya.');

// ---------- AIR ----------
mon('air_siren', 'Siren Karang', 'air', 'R', 3, 1100, 700, 1600, '🐚', 'Peri Air', { summon: [heal('allAlly', 300)] }, 'Lagunya memanggil pasang naik.');
mon('air_hiu', 'Hiu Palung Gelap', 'air', 'E', 5, 2400, 800, 2200, '🦈', 'Monster Laut', { foil: 'holo', kw: ['haste'], summon: [dmg('randEnemy', 600)] }, 'Mencium darah dari seberang samudra.');
mon('air_poseidon', 'Poseidon Penguasa Laut', 'air', 'L', 8, 3200, 1800, 4400, '🔱', 'Dewa Laut', {
  foil: 'frost', tag: 'GX', kw: ['taunt'],
  summon: [heal('allAlly', 800), stun('randEnemy')],
  skill: sk('Pusaran Dunia', 4, null, [dmg('allEnemy', 1100), stun('allEnemy')]),
}, 'Trisulanya membelah lautan menjadi dua.');

// ---------- TANAH ----------
mon('tnh_armadilo', 'Armadilo Berlian', 'tanah', 'R', 3, 900, 1400, 1900, '🦔', 'Hewan', { kw: ['shield'] }, 'Kulitnya berkilau, tak satu pun taring mampu menembus.');
mon('tnh_cacing', 'Cacing Pasir Raksasa', 'tanah', 'E', 5, 2500, 900, 2600, '🪱', 'Monster Pasir', { foil: 'holo', summon: [stun('randEnemy')], death: [dmg('allEnemy', 400)] }, 'Gurun bergetar sebelum ia muncul.');
mon('tnh_atlas', 'Atlas Penopang Dunia', 'tanah', 'L', 8, 3200, 2600, 5200, '🌍', 'Titan', {
  foil: 'gold', tag: 'GX', kw: ['taunt', 'shield'],
  skill: sk('Guncang Dunia', 4, null, [dmg('allEnemy', 1200), stun('allEnemy')]),
}, 'Langit tidak jatuh selama pundaknya masih kuat.');

// ---------- ANGIN ----------
mon('agn_kupu', 'Kupu Badai', 'angin', 'R', 3, 1200, 400, 1100, '🦋', 'Serangga', { kw: ['haste'], skill: sk('Serbuk Angin', 1, 'allyMonster', [buff('T', { atk: 300 })]) }, 'Satu kepak sayap, satu badai di seberang dunia.');
mon('agn_pegasus', 'Pegasus Awan', 'angin', 'E', 5, 2200, 800, 2200, '🐴', 'Makhluk Langit', { foil: 'holo', kw: ['haste'], summon: [buff('allAlly', { atk: 200 })] }, 'Berlari di atas awan, membawa angin bersamanya.');
mon('agn_zephyros', 'Zephyros Penguasa Angin', 'angin', 'L', 8, 3500, 1000, 3400, '🌬️', 'Dewa Angin', {
  foil: 'aurora', tag: 'GX', kw: ['haste', 'pierce'],
  summon: [draw(2), dmg('allEnemy', 500)],
  skill: sk('Hembusan Langit', 3, null, [dmg('allEnemy', 1000), bounce('randEnemy')]),
}, 'Napasnya adalah musim yang berganti.');

// ---------- PETIR ----------
mon('ptr_kumbang', 'Kumbang Voltase', 'petir', 'R', 3, 1300, 600, 1200, '🪲', 'Serangga', { kw: ['haste'], summon: [dmg('foe', 400)] }, 'Sayap logamnya berdengung dengan arus tinggi.');
mon('ptr_tesla', 'Golem Tesla', 'petir', 'E', 5, 2400, 900, 2400, '⚙️', 'Mekanik', { foil: 'holo', kw: ['pierce'], skill: sk('Kumparan Kilat', 2, 'enemyMonster', [dmg('T', 1200)]) }, 'Hasil karya ilmuwan yang tak pernah tidur.');
mon('ptr_zeus', 'Zeus Sang Penggemuruh', 'petir', 'L', 8, 4000, 1000, 3600, '⚡', 'Dewa Petir', {
  foil: 'rainbow', tag: 'GX', kw: ['pierce', 'haste'],
  summon: [dmg('allEnemy', 700)],
  skill: sk('Halilintar Agung', 4, null, [dmg('allEnemy', 1500), dmg('foe', 1000)]),
}, 'Satu lemparan tombak, seluruh langit menyala.');

// ---------- ALAM ----------
mon('alm_jamur', 'Jamur Spora', 'alam', 'R', 3, 1000, 600, 1700, '🍄', 'Tumbuhan', { start: [heal('allAlly', 200)] }, 'Sporanya menyebar kehangatan, bukan racun.');
mon('alm_harimau', 'Harimau Hutan Hijau', 'alam', 'E', 5, 2500, 900, 2300, '🐅', 'Hewan Buas', { foil: 'holo', kw: ['haste'], summon: [dmg('randEnemy', 700)] }, 'Loreng di tubuhnya adalah bayangan daun.');
mon('alm_yggdrasil', 'Yggdrasil Pohon Dunia', 'alam', 'L', 8, 2800, 1800, 5000, '🌲', 'Pohon Dunia', {
  foil: 'emerald', tag: 'GX', kw: ['taunt'],
  summon: [heal('allAlly', 1200), token('tkn_sulur')],
  start: [heal('allAlly', 300)],
  death: [revive(5)],
}, 'Akarnya menyentuh setiap alam yang pernah ada.');

// ---------- CAHAYA ----------
mon('chy_fajar', 'Ksatria Fajar', 'cahaya', 'R', 3, 1400, 800, 1400, '🤺', 'Ksatria', { kw: ['shield'] }, 'Pedangnya menyala tepat saat matahari terbit.');
mon('chy_sphinx', 'Sphinx Emas', 'cahaya', 'E', 5, 2000, 1100, 2400, '🦁', 'Makhluk Suci', { foil: 'holo', summon: [heal('allAlly', 600)], skill: sk('Teka-Teki Maut', 2, 'enemyMonster', [stun('T')]) }, 'Yang gagal menjawab akan membeku di tempat.');
mon('chy_aurelia', 'Aurelia Sang Matahari', 'cahaya', 'L', 8, 3300, 1400, 4000, '🌞', 'Dewi Matahari', {
  foil: 'gold', tag: 'EX', kw: ['shield'],
  summon: [buff('allAlly', { atk: 400 }), heal('allAlly', 800)],
  skill: sk('Sinar Surgawi', 4, 'enemyMonster', [destroy('T'), heal('allAlly', 500)]),
}, 'Di mana ia melangkah, malam tak berani menyusul.');

// ---------- GELAP ----------
mon('glp_penyihir', 'Penyihir Bayangan', 'gelap', 'R', 3, 1500, 400, 1200, '🧙‍♂️', 'Penyihir', { skill: sk('Kutukan', 2, 'enemyMonster', [dmg('T', 700), stun('T')]) }, 'Setiap mantranya meninggalkan noda hitam.');
mon('glp_wraith', 'Wraith Pemburu Jiwa', 'gelap', 'E', 5, 2400, 700, 2000, '🧟', 'Undead', { foil: 'holo', kw: ['lifesteal'], summon: [discard(1)], death: [token('tkn_bayangan')] }, 'Ia tak pernah berhenti memburu jiwa terakhirnya.');
mon('glp_nyx', 'Nyx Ratu Malam Abadi', 'gelap', 'L', 8, 3700, 1200, 3500, '🌑', 'Dewi Malam', {
  foil: 'cosmic', tag: 'GX', kw: ['lifesteal', 'pierce'],
  summon: [destroy('randEnemy'), discard(1)],
  skill: sk('Gerhana Total', 4, null, [dmg('allEnemy', 1100), heal('me', 1000)]),
}, 'Saat ia membuka mata, bintang-bintang padam.');

// ---------- NETRAL ----------
mon('ntr_boneka', 'Boneka Kayu', 'netral', 'C', 1, 400, 500, 900, '🪆', 'Boneka', { kw: ['taunt'] }, 'Tak punya hati, tapi sangat setia.');
mon('ntr_penjaga', 'Penjaga Gerbang', 'netral', 'R', 3, 1200, 1000, 1700, '💂', 'Penjaga', { kw: ['taunt'] }, 'Tak ada yang lewat tanpa izinnya.');
mon('ntr_alkemis', 'Alkemis Gila', 'netral', 'R', 4, 1300, 500, 1500, '⚗️', 'Alkemis', { summon: [draw(1)], skill: sk('Ramuan Ajaib', 1, 'allyMonster', [heal('T', 600)]) }, 'Setengah genius, setengah bahaya.');
mon('ntr_prisma', 'Naga Pelangi Prisma', 'netral', 'L', 8, 3600, 1500, 4000, '🌈', 'Naga Prisma', {
  foil: 'rainbow', tag: 'GX', kw: ['pierce'],
  summon: [dmg('allEnemy', 500), heal('allAlly', 500)],
  skill: sk('Prisma Pemusnah', 4, null, [dmg('allEnemy', 1300), heal('allAlly', 800)]),
}, 'Tujuh warna, tujuh kehancuran.');

// =====================================================================
//  SIHIR
// =====================================================================
spell('sp_bolaapi', 'Bola Api', 'api', 'C', 2, 'enemyMonster', [dmg('T', 1000)], '☄️', 'Sederhana, panas, efektif.');
spell('sp_hujan', 'Hujan Penyembuh', 'air', 'C', 2, null, [heal('allAlly', 700)], '🌧️', 'Setiap tetes membawa kehidupan.');
spell('sp_gempa', 'Gempa Bumi', 'tanah', 'R', 4, null, [dmg('allEnemy', 800)], '🌋', 'Tanah pun murka.');
spell('sp_badai', 'Badai Pengusir', 'angin', 'R', 3, 'enemyMonster', [bounce('T'), draw(1)], '🌬️', 'Mengusir musuh dan membawa pengetahuan.');
spell('sp_petir', 'Petir Penghancur', 'petir', 'R', 3, 'enemyMonster', [dmg('T', 1400), dmg('foe', 400)], '🌩️', 'Satu sambaran, dua korban.');
spell('sp_pelukan', 'Pelukan Alam', 'alam', 'C', 2, null, [heal('me', 1000), heal('allAlly', 500)], '🌼', 'Hutan memeluk anak-anaknya.');
spell('sp_cahaya', 'Cahaya Penghukum', 'cahaya', 'E', 4, 'enemyMonster', [destroy('T')], '☀️', 'Tak ada bayangan yang bisa bersembunyi.');
spell('sp_jiwa', 'Pencuri Jiwa', 'gelap', 'R', 3, 'enemyMonster', [dmg('T', 900), heal('me', 900)], '🧿', 'Nyawa berpindah tangan.');
spell('sp_bangkit', 'Kebangkitan', 'netral', 'E', 4, null, [revive(5)], '⚰️', 'Yang gugur dipanggil kembali.');
spell('sp_ilmu', 'Pengetahuan Kuno', 'netral', 'C', 2, null, [draw(2)], '📜', 'Gulungan debu penuh rahasia.');
spell('sp_perisai', 'Perisai Ajaib', 'netral', 'C', 1, 'allyMonster', [shield('T')], '🔰', 'Cahaya tipis yang menolak satu pukulan.');

// ★ sihir baru
spell('sp_ledakan', 'Ledakan Magma', 'api', 'R', 4, null, [dmg('allEnemy', 1000), burn('randEnemy', 300)], '💥', 'Tanah retak, lahar menyembur.');
spell('sp_pasang', 'Gelombang Pasang', 'air', 'C', 3, 'enemyMonster', [dmg('T', 700), stun('T')], '🌊', 'Satu hantaman air, satu momen terhenti.');
spell('sp_longsor', 'Longsor Batu', 'tanah', 'C', 3, 'enemyMonster', [dmg('T', 1200)], '🪨', 'Gunung melepaskan sebagian bebannya.');
spell('sp_semangat', 'Angin Semangat', 'angin', 'C', 2, 'allyMonster', [buff('T', { atk: 400 }), draw(1)], '🍃', 'Angin dari belakang selalu menguntungkan.');
spell('sp_rantai', 'Badai Rantai Petir', 'petir', 'E', 5, null, [dmg('allEnemy', 1100), dmg('foe', 600)], '⛈️', 'Satu sambaran melompat ke semua.', { foil: 'holo' });
spell('sp_panen', 'Panen Raya', 'alam', 'R', 3, null, [heal('allAlly', 900), draw(1)], '🌾', 'Hasil bumi untuk semua yang setia.');
spell('sp_berkah', 'Berkah Dewa', 'cahaya', 'R', 3, 'allyMonster', [heal('T', 1500), shield('T')], '🙏', 'Doa yang terjawab.');
spell('sp_kutukan', 'Kutukan Kematian', 'gelap', 'E', 5, 'enemyMonster', [destroy('T'), dmg('foe', 700)], '💀', 'Sebut namanya, dan ia pun lenyap.', { foil: 'cosmic' });
spell('sp_supernova', 'Supernova', 'netral', 'L', 6, null, [dmg('allEnemy', 1500), heal('allAlly', 700)], '🌠', 'Bintang mati demi menerangi pasukannya.', { foil: 'rainbow', tag: 'GX' });

// =====================================================================
//  RELIK
// =====================================================================
relic('rl_pedang', 'Pedang Berapi', 'api', 'R', 2, { atk: 500 }, '🗡️');
relic('rl_mutiara', 'Mutiara Pasang', 'air', 'C', 2, { hp: 700, def: 200 }, '🦪');
relic('rl_perisai', 'Perisai Batu', 'tanah', 'C', 2, { def: 400, hp: 400 }, '🪖');
relic('rl_sepatu', 'Sepatu Angin', 'angin', 'R', 2, { atk: 300, kw: ['haste'] }, '👟');
relic('rl_cincin', 'Cincin Halilintar', 'petir', 'E', 3, { atk: 700, kw: ['pierce'] }, '💍');
relic('rl_akar', 'Akar Kehidupan', 'alam', 'C', 2, { hp: 600, atk: 200 }, '🪴');
relic('rl_jimat', 'Jimat Suci', 'cahaya', 'R', 2, { atk: 300, def: 300, kw: ['shield'] }, '📿');
relic('rl_taring', 'Taring Vampir', 'gelap', 'E', 3, { atk: 500, kw: ['lifesteal'] }, '🦷');

// ★ relik baru
relic('rl_mahkota', 'Mahkota Naga', 'api', 'E', 3, { atk: 600, hp: 400 }, '👑', 'Dipakai raja yang tak pernah kalah.', { foil: 'ember' });
relic('rl_zirah', 'Zirah Samudra', 'air', 'R', 2, { def: 500, hp: 600 }, '🥋', 'Sisiknya dari ikan purba.');
relic('rl_jubah', 'Jubah Hutan', 'alam', 'R', 2, { hp: 800, atk: 200, kw: ['taunt'] }, '🧣', 'Dianyam dari lumut dan sinar bulan.');
relic('rl_kristal', 'Kristal Bintang', 'netral', 'L', 4, { atk: 600, def: 400, hp: 600, kw: ['shield'] }, '💠', 'Pecahan dari bintang yang jatuh.', { foil: 'gold', tag: 'EX' });

// =====================================================================
//  JEBAKAN
// =====================================================================
trap('tr_api', 'Jebakan Api', 'api', 'C', 2, 'attack', [negate(), burn('trig', 400)], '🔥', 'Membakar siapa pun yang berani menyerang.');
trap('tr_air', 'Dinding Air', 'air', 'C', 2, 'attack', [negate(), stun('trig')], '🌊', 'Arus deras menghentikan serbuan.');
trap('tr_tanah', 'Jurang Pasir', 'tanah', 'C', 2, 'summon', [dmg('trig', 600), stun('trig')], '🕳️', 'Tanah runtuh di bawah kaki penyerbu.');
trap('tr_alam', 'Perangkap Duri', 'alam', 'R', 3, 'summon', [dmg('trig', 1000), stun('trig')], '🪤', 'Sulur berduri menyambut tamu tak diundang.');
trap('tr_petir', 'Pusaran Petir', 'petir', 'R', 3, 'summon', [dmg('trig', 1500)], '🌀', 'Tersembunyi, lalu menyambar.');
trap('tr_cahaya', 'Segel Suci', 'cahaya', 'R', 3, 'attack', [negate(), heal('me', 800)], '🔆', 'Serangan menjadi berkah bagi pemiliknya.');
trap('tr_cermin', 'Cermin Penolak', 'netral', 'E', 3, 'attack', [negate(), dmg('trig', 1500)], '🪞', 'Kekuatan penyerang berbalik padanya.');
trap('tr_segel', 'Segel Sihir', 'netral', 'R', 2, 'spell', [negate()], '🔮', 'Mantra lawan lenyap tanpa bekas.');
trap('tr_lubang', 'Lubang Hitam', 'gelap', 'E', 4, 'attack', [negate(), destroy('trig')], '🌌', 'Menelan penyerang tanpa sisa.');

// ★ jebakan baru
trap('tr_ranjau', 'Ranjau Magma', 'api', 'R', 3, 'summon', [dmg('trig', 1200), burn('trig', 300)], '💣', 'Meledak tepat di bawah kaki.');
trap('tr_gelombang', 'Gelombang Balik', 'air', 'R', 3, 'attack', [negate(), dmg('trig', 700)], '🫧', 'Serangan terpental bersama ombak.');
trap('tr_pantulan', 'Pantulan Surgawi', 'cahaya', 'E', 4, 'spell', [negate(), heal('me', 1000)], '💫', 'Sihir lawan menjadi penyembuh bagimu.', { foil: 'aurora' });
trap('tr_bayangan', 'Perangkap Bayangan', 'gelap', 'E', 4, 'summon', [destroy('trig')], '🕸️', 'Yang masuk tak pernah keluar.', { foil: 'cosmic' });

// =====================================================================
//  MEDAN
// =====================================================================
field('fd_api', 'Gunung Berapi', 'api', 'R', 2, { el: 'api', atk: 300, def: 0 }, null, '🌋', 'Monster Api +300 ATK.');
field('fd_air', 'Samudra Dalam', 'air', 'R', 2, { el: 'air', atk: 0, def: 300 }, [heal('me', 200)], '🌊', 'Monster Air +300 DEF.');
field('fd_tanah', 'Lembah Batu', 'tanah', 'R', 2, { el: 'tanah', atk: 100, def: 400 }, null, '⛰️', 'Monster Tanah kokoh.');
field('fd_angin', 'Langit Terbuka', 'angin', 'R', 2, { el: 'angin', atk: 300, def: 0 }, null, '☁️', 'Monster Angin +300 ATK.');
field('fd_petir', 'Badai Petir', 'petir', 'R', 2, { el: 'petir', atk: 300, def: 0 }, null, '⛈️', 'Monster Petir +300 ATK.');
field('fd_alam', 'Hutan Purba', 'alam', 'R', 2, { el: 'alam', atk: 200, def: 200 }, null, '🌲', 'Monster Alam tumbuh kuat.');
field('fd_cahaya', 'Kuil Suci', 'cahaya', 'R', 2, { el: 'cahaya', atk: 200, def: 200 }, [heal('me', 200)], '⛩️', 'Monster Cahaya diberkati.');
field('fd_gelap', 'Pemakaman Terkutuk', 'gelap', 'R', 2, { el: 'gelap', atk: 300, def: 0 }, null, '🪦', 'Monster Gelap +300 ATK.');

// ★ medan baru
field('fd_kawah', 'Kawah Bara Abadi', 'api', 'E', 3, { el: 'api', atk: 500, def: 0 }, null, '🌄', 'Monster Api +500 ATK.', { foil: 'ember' });
field('fd_bulan', 'Altar Bulan Merah', 'gelap', 'E', 3, { el: 'gelap', atk: 400, def: 200 }, null, '🌕', 'Monster Gelap +400 ATK, +200 DEF.', { foil: 'cosmic' });

// =====================================================================
//  ★★ GELOMBANG 2 — 20 KARTU BARU ★★
// =====================================================================

// ---------- MONSTER ----------
mon('api_bom', 'Bom Hidup', 'api', 'C', 2, 1100, 100, 600, '🧨', 'Elemental', { death: [dmg('allEnemy', 400)] }, 'Rapuh, tapi meledak saat dipecahkan.');
mon('api_panglima', 'Panglima Lahar', 'api', 'E', 5, 2300, 900, 2200, '⚒️', 'Panglima', { kw: ['haste'], skill: sk('Seruan Perang', 2, null, [buff('allAlly', { atk: 300 })]) }, 'Teriakannya menyalakan api di setiap prajurit.');
mon('air_embun', 'Peri Embun', 'air', 'C', 1, 300, 300, 700, '💦', 'Peri Air', { start: [heal('allAlly', 150)] }, 'Setiap pagi ia menitipkan setetes embun untuk sahabatnya.');
mon('air_salju', 'Ratu Salju', 'air', 'R', 4, 1300, 800, 1800, '❄️', 'Penyihir', { summon: [stun('randEnemy')] }, 'Senyumnya indah, sentuhannya membekukan.');
mon('tnh_pemahat', 'Pemahat Batu', 'tanah', 'C', 2, 600, 900, 1300, '🔨', 'Kurcaci', { kw: ['shield'] }, 'Ia memahat perisai sebelum memahat apa pun.');
mon('tnh_wyvern', 'Wyvern Batu', 'tanah', 'E', 5, 2200, 1400, 2700, '🦖', 'Naga', { kw: ['taunt'], death: [dmg('foe', 800)] }, 'Saat jatuh, serpihan tubuhnya menghantam lawan.');
mon('agn_pemandu', 'Pemandu Awan', 'angin', 'R', 3, 1000, 500, 1500, '☁️', 'Roh Angin', { summon: [mana(1)] }, 'Menunjukkan jalan pintas lewat langit.');
mon('ptr_belut', 'Belut Listrik', 'petir', 'C', 2, 900, 300, 800, '🐍', 'Hewan', { skill: sk('Kejut Listrik', 2, 'enemyMonster', [stun('T')]) }, 'Satu sentuhan, seluruh tubuh lawan kaku.');
mon('alm_lebah', 'Ratu Lebah', 'alam', 'R', 4, 1300, 700, 1700, '🐝', 'Serangga', { summon: [token('tkn_lebah')] }, 'Dengung sayapnya memanggil pasukan kecil.');
mon('chy_pelindung', 'Pelindung Fajar', 'cahaya', 'C', 2, 600, 700, 1100, '⛑️', 'Pelindung', { skill: sk('Cahaya Pelindung', 2, 'allyMonster', [shield('T')]) }, 'Berdiri di depan agar yang lain tak terluka.');
mon('glp_necro', 'Necromancer Tulang', 'gelap', 'R', 4, 1400, 600, 1500, '🦴', 'Necromancer', { summon: [token('tkn_tengkorak')], skill: sk('Bangkitkan', 3, null, [revive(3)]) }, 'Bagi dia, kuburan hanyalah gudang.');

// legendaris spesial (mengkilap)
mon('glp_fenrir', 'Fenrir Serigala Akhir Zaman', 'gelap', 'L', 7, 3500, 800, 3000, '🐕', 'Serigala Raksasa', {
  foil: 'cosmic', tag: 'EX', kw: ['lifesteal', 'haste'],
  summon: [dmg('foe', 800)],
}, 'Ia melolong sekali, dan bulan pun retak.');
mon('api_phoenix_abadi', 'Phoenix Abadi', 'api', 'L', 7, 3000, 1000, 3200, '🕊️', 'Burung Suci', {
  foil: 'ember', tag: 'EX', kw: ['haste'],
  summon: [burn('randEnemy', 300)],
  death: [token('tkn_abu'), heal('me', 1500)],
}, 'Setiap kematian hanyalah awal dari api berikutnya.');
mon('ntr_archon', 'Archon Kristal', 'netral', 'L', 7, 2800, 2200, 4200, '🔷', 'Archon', {
  foil: 'frost', tag: 'EX', kw: ['shield', 'taunt'],
  skill: sk('Prisma Pelindung', 3, null, [shield('allAlly')]),
}, 'Tubuhnya memantulkan cahaya, hatinya memantulkan serangan.');

// ---------- SIHIR ----------
spell('sp_aliran', 'Aliran Energi', 'netral', 'R', 1, null, [mana(2)], '🔋', 'Satu tarikan napas, dua kali tenaga.');
spell('sp_meteor', 'Hujan Meteor', 'api', 'E', 5, null, [dmg('allEnemy', 1300)], '🪐', 'Langit runtuh sepotong demi sepotong.', { foil: 'ember' });
spell('sp_tarian', 'Tarian Perang', 'api', 'C', 2, 'allyMonster', [tbuff('T', 800)], '🥁', 'Genderang berbunyi, darah mendidih, hanya untuk satu giliran.');

// ---------- RELIK ----------
relic('rl_sayap', 'Sayap Malaikat', 'cahaya', 'E', 3, { atk: 300, hp: 500, kw: ['haste'] }, '🪽', 'Ringan, hangat, dan sangat cepat.', { foil: 'aurora' });

// ---------- JEBAKAN ----------
trap('tr_beku', 'Perangkap Beku', 'air', 'R', 3, 'summon', [dmg('trig', 500), stun('trig')], '🥶', 'Lantai berubah menjadi es sebelum kakinya menyentuh.');

// ---------- MEDAN ----------
field('fd_bunga', 'Padang Bunga Abadi', 'alam', 'E', 3, { el: 'alam', atk: 200, def: 200 }, [heal('me', 300)], '💐', 'Monster Alam +200 ATK/DEF dan memulihkan LP-mu tiap giliran.', { foil: 'emerald' });

// =====================================================================
//  ★★★ GELOMBANG 3 — 49 KARTU BARU (menggenapkan jadi 200) ★★★
// =====================================================================

// ---------- ANGIN ----------
mon('agn_layang', 'Layang-layang Hidup', 'angin', 'C', 1, 400, 200, 500, '🪁', 'Roh Angin', { summon: [draw(1)] }, 'Terbang tinggi, membawa kabar baru.');
mon('agn_penari', 'Penari Angin', 'angin', 'R', 3, 1100, 500, 1300, '💃', 'Penari', { kw: ['haste'], skill: sk('Tarian Pusaran', 1, 'allyMonster', [tbuff('T', 500)]) }, 'Setiap langkahnya mengajak angin menari.');
mon('agn_penjelajah', 'Penjelajah Langit', 'angin', 'R', 4, 1400, 600, 1500, '🧭', 'Penjelajah', { summon: [draw(1)], skill: sk('Tiupan Tajam', 2, 'enemyMonster', [bounce('T')]) }, 'Peta di tangannya selalu menunjuk ke atas.');
mon('agn_hantu', 'Burung Hantu Badai', 'angin', 'E', 5, 2200, 800, 2000, '🦉', 'Makhluk Langit', { foil: 'holo', kw: ['haste'], summon: [dmg('randEnemy', 600), draw(1)] }, 'Matanya melihat badai sebelum awan terbentuk.');
mon('agn_garuda', 'Garuda Penguasa Langit', 'angin', 'L', 7, 3300, 1000, 3200, '🦅', 'Burung Dewa', {
  foil: 'aurora', tag: 'EX', kw: ['haste', 'pierce'],
  summon: [draw(1)],
  skill: sk('Cakar Langit', 3, 'enemyMonster', [dmg('T', 1500)]),
}, 'Sayapnya menutupi matahari, cakarnya membelah gunung.');
spell('sp_pembalik', 'Angin Pembalik', 'angin', 'C', 2, 'enemyMonster', [bounce('T')], '🌀', 'Yang datang, dipaksa pulang.');
trap('tr_pusaran', 'Pusaran Penolak', 'angin', 'C', 2, 'attack', [negate(), dmg('trig', 500)], '🌪️', 'Angin memutar serangan kembali pada penyerangnya.');

// ---------- PETIR ----------
mon('ptr_tupai', 'Tupai Listrik', 'petir', 'C', 1, 600, 100, 500, '🐿️', 'Hewan', { summon: [dmg('foe', 200)] }, 'Ekornya menyimpan lebih banyak setrum daripada yang terlihat.');
mon('ptr_penangkal', 'Penangkal Petir', 'petir', 'C', 2, 400, 800, 1000, '🗼', 'Mekanik', { kw: ['taunt'], death: [dmg('allEnemy', 300)] }, 'Menarik semua sambaran, lalu membalasnya.');
mon('ptr_elektro', 'Penyihir Elektro', 'petir', 'R', 4, 1400, 500, 1400, '🧙‍♀️', 'Penyihir', { skill: sk('Rantai Petir', 3, null, [dmg('allEnemy', 700)]) }, 'Rambutnya berdiri setiap kali ia merapal.');
mon('ptr_naga', 'Naga Badai Petir', 'petir', 'E', 5, 2300, 800, 2200, '🐲', 'Naga', { foil: 'holo', kw: ['pierce'], summon: [dmg('allEnemy', 400)] }, 'Raungannya diikuti kilat.');
spell('sp_beruntun', 'Sambaran Beruntun', 'petir', 'R', 3, 'enemyMonster', [dmg('T', 900), stun('T')], '🌩️', 'Sambaran pertama melukai, yang kedua melumpuhkan.');
relic('rl_tombak', 'Tombak Kilat', 'petir', 'R', 2, { atk: 500, hp: 300 }, '🔱', 'Dilempar, lalu kembali ke tangan.');

// ---------- TANAH ----------
mon('tnh_tikus', 'Tikus Tanah', 'tanah', 'C', 1, 500, 400, 800, '🐀', 'Hewan', { summon: [heal('me', 300)] }, 'Menggali, dan selalu menemukan makanan.');
mon('tnh_prajurit', 'Prajurit Cadas', 'tanah', 'R', 3, 1300, 1000, 1700, '🧱', 'Prajurit', {}, 'Baju zirahnya dari batu tebing.');
mon('tnh_pasir', 'Penyihir Pasir', 'tanah', 'R', 4, 1400, 900, 1700, '🏜️', 'Penyihir', { summon: [stun('randEnemy')] }, 'Badai pasirnya membuat musuh buta arah.');
mon('tnh_mamut', 'Mamut Purba', 'tanah', 'E', 5, 2500, 1300, 3000, '🦣', 'Hewan Buas', { kw: ['taunt'], death: [dmg('allEnemy', 500)] }, 'Langkahnya menggetarkan tanah, tumbangnya lebih lagi.');
field('fd_gurun', 'Gurun Pasir Luas', 'tanah', 'E', 3, { el: 'tanah', atk: 200, def: 300 }, null, '🏜️', 'Monster Tanah +200 ATK, +300 DEF.', { foil: 'gold' });
trap('tr_arca', 'Arca Penjebak', 'tanah', 'R', 3, 'attack', [negate(), stun('trig')], '🏺', 'Arca tua itu bergerak saat disentuh.');

// ---------- AIR ----------
mon('air_penyelam', 'Penyelam Mutiara', 'air', 'R', 3, 1000, 600, 1400, '🤿', 'Penyelam', { summon: [draw(1)] }, 'Selalu kembali dari dasar laut dengan sesuatu.');
mon('air_kutub', 'Beruang Kutub', 'air', 'R', 4, 1500, 900, 1900, '🐻‍❄️', 'Hewan Buas', { kw: ['taunt'] }, 'Tak ada badai salju yang bisa menggesernya.');
mon('air_buaya', 'Buaya Muara', 'air', 'E', 5, 2400, 1000, 2500, '🐊', 'Hewan Buas', { summon: [dmg('randEnemy', 500)] }, 'Diam di air keruh, menunggu giliran.');
spell('sp_esbadai', 'Badai Es', 'air', 'E', 4, null, [dmg('allEnemy', 600), stun('allEnemy')], '🌨️', 'Semua yang bergerak, membeku.', { foil: 'frost' });
relic('rl_cangkang', 'Cangkang Karang', 'air', 'C', 2, { def: 500, hp: 200 }, '🐚', 'Sekeras karang, seringan buih.');

// ---------- ALAM ----------
mon('alm_madu', 'Beruang Madu', 'alam', 'C', 2, 900, 500, 1200, '🍯', 'Hewan Buas', { summon: [heal('me', 500)] }, 'Ia berbagi madunya, kalau kamu sopan.');
mon('alm_dryad', 'Dryad Bunga', 'alam', 'R', 3, 1100, 700, 1500, '🌺', 'Dryad', { summon: [heal('allAlly', 400)] }, 'Setiap langkahnya meninggalkan bunga.');
mon('alm_treant', 'Treant Penjaga', 'alam', 'R', 4, 1300, 1200, 2200, '🌴', 'Roh Hutan', { kw: ['taunt'] }, 'Akarnya menahan apa pun yang melewatinya.');
mon('alm_keramat', 'Harimau Keramat Rimba', 'alam', 'L', 7, 3200, 1100, 3400, '🐅', 'Roh Hutan', {
  foil: 'emerald', tag: 'EX', kw: ['haste', 'pierce'],
  summon: [dmg('randEnemy', 900)],
  death: [token('tkn_sulur')],
}, 'Penjaga rimba yang namanya dibisikkan dengan hormat.');
spell('sp_tumbuh', 'Tumbuh Cepat', 'alam', 'C', 2, 'allyMonster', [heal('T', 700), buff('T', { atk: 200 })], '🌿', 'Satu musim dipadatkan jadi satu detik.');

// ---------- CAHAYA ----------
mon('chy_biarawati', 'Biarawati Cahaya', 'cahaya', 'R', 3, 1000, 800, 1600, '🧕', 'Pendeta', { skill: sk('Doa Penyembuh', 2, 'allyMonster', [heal('T', 900)]) }, 'Doanya lebih ampuh dari obat apa pun.');
mon('chy_pegasus', 'Pegasus Suci', 'cahaya', 'R', 4, 1500, 800, 1800, '🐎', 'Hewan Suci', { kw: ['haste'] }, 'Berlari di atas pelangi.');
mon('chy_bintang', 'Pemanah Bintang', 'cahaya', 'E', 5, 2300, 800, 2000, '🏹', 'Pemanah', { foil: 'holo', kw: ['pierce'], summon: [dmg('randEnemy', 700)] }, 'Panahnya adalah cahaya bintang yang jatuh.');
spell('sp_mukjizat', 'Mukjizat', 'cahaya', 'R', 4, null, [heal('allAlly', 1200), heal('me', 800)], '🌅', 'Tak ada yang menyangka, tapi semua pulih.');
trap('tr_penjara', 'Penjara Cahaya', 'cahaya', 'R', 3, 'summon', [stun('trig'), heal('me', 500)], '🔒', 'Kurungan sinar yang tak terlihat.');

// ---------- GELAP ----------
mon('glp_ghoul', 'Ghoul Rakus', 'gelap', 'R', 3, 1400, 500, 1200, '🧟‍♂️', 'Undead', { kw: ['lifesteal'] }, 'Selalu lapar, tak pernah kenyang.');
mon('glp_succubus', 'Succubus Bayangan', 'gelap', 'E', 5, 2300, 700, 2000, '🦹', 'Iblis', { foil: 'holo', kw: ['lifesteal'], summon: [dmg('randEnemy', 600), heal('me', 600)] }, 'Senyumannya mencuri lebih dari sekadar nyawa.');
spell('sp_korban', 'Pengorbanan Gelap', 'gelap', 'R', 2, 'allyMonster', [destroy('T'), draw(2)], '🩸', 'Satu kehilangan, dua pengetahuan.');
relic('rl_jubahbayang', 'Jubah Bayangan', 'gelap', 'R', 2, { hp: 500, def: 300, kw: ['lifesteal'] }, '🧥', 'Menelan cahaya, dan juga luka.');

// ---------- API ----------
mon('api_penyembur', 'Penyembur Api', 'api', 'C', 2, 1000, 300, 800, '🧯', 'Prajurit', { skill: sk('Semburan', 1, 'enemyMonster', [dmg('T', 400)]) }, 'Napasnya berbau belerang.');
mon('api_pendekar', 'Pendekar Bara', 'api', 'R', 3, 1600, 500, 1100, '🦸', 'Pendekar', { kw: ['haste'] }, 'Pedangnya selalu membara sebelum ditarik.');
trap('tr_dinding', 'Dinding Api', 'api', 'C', 2, 'summon', [dmg('trig', 500), burn('trig', 300)], '🔥', 'Api tiba-tiba menyala di jalan masuk.');

// ---------- NETRAL ----------
mon('ntr_kucing', 'Kucing Pengembara', 'netral', 'C', 1, 500, 300, 700, '🐈', 'Hewan', { kw: ['haste'] }, 'Ia pergi ke mana pun ia mau.');
mon('ntr_tukang', 'Tukang Reparasi', 'netral', 'C', 2, 600, 600, 1000, '🧰', 'Pengrajin', { skill: sk('Perbaiki', 1, 'allyMonster', [heal('T', 500)]) }, 'Semua bisa diperbaiki, katanya.');
mon('ntr_ksatria', 'Ksatria Berkelana', 'netral', 'R', 3, 1300, 800, 1500, '🛡️', 'Ksatria', {}, 'Tak punya rumah, tak punya raja, tak pernah kalah.');
mon('ntr_golembesi', 'Golem Besi', 'netral', 'R', 4, 1400, 1500, 2200, '🦾', 'Golem', { kw: ['taunt'] }, 'Ditempa tanpa nama, dirakit tanpa hati.');
mon('ntr_penyihir_agung', 'Penyihir Agung', 'netral', 'E', 5, 2000, 900, 2100, '🪄', 'Penyihir', { summon: [draw(1), mana(1)] }, 'Ia tahu mantra dari semua aliran.');
mon('ntr_naga_perak', 'Naga Perak Kuno', 'netral', 'L', 7, 3300, 1500, 3700, '🐲', 'Naga', {
  foil: 'holo', tag: 'EX', kw: ['pierce'],
  summon: [dmg('allEnemy', 600)],
  skill: sk('Napas Perak', 3, null, [dmg('allEnemy', 900), heal('me', 700)]),
}, 'Ia lebih tua dari nama elemen mana pun.');
spell('sp_ramuan', 'Ramuan Pemulih', 'netral', 'C', 1, 'allyMonster', [heal('T', 800)], '🧪', 'Pahit, tapi manjur.');
relic('rl_kalung', 'Kalung Pelindung', 'netral', 'C', 2, { def: 300, hp: 500 }, '🔗', 'Rantai tipis yang menolak maut.');

// =====================================================================
//  ★★★★ GELOMBANG 4 — 103 KARTU BARU (mayoritas kartu GRADIENT / foil) ★★★★
//  Tempel blok ini di cards.js, SETELAH kartu Gelombang 3 (tepat di atas
//  bagian "TOKEN (tidak masuk deck)"). Memakai helper & fx yang sudah ada.
// =====================================================================

// ---------- API 🔥 ----------
mon('api_kalajengking', 'Kalajengking Bara', 'api', 'C', 1, 600, 200, 500, '🦂', 'Serangga', { summon: [burn('randEnemy', 200)] }, 'Sengatnya meninggalkan bara yang tak mau padam.');
mon('api_samurai', 'Samurai Bara Merah', 'api', 'R', 3, 1500, 600, 1300, '🎎', 'Samurai', { foil: 'ember', kw: ['haste'] }, 'Bilahnya terhunus lebih cepat dari kedipan mata.');
mon('api_dukun', 'Dukun Api Suci', 'api', 'R', 4, 1400, 700, 1600, '🪔', 'Dukun', { skill: sk('Api Suci', 2, 'allyMonster', [heal('T', 800), buff('T', { atk: 200 })]) }, 'Apinya menghangatkan kawan, bukan membakar.');
mon('api_singa', 'Singa Mentari Gurun', 'api', 'E', 5, 2400, 800, 2200, '🦁', 'Hewan Buas', { foil: 'holo', kw: ['haste'], summon: [dmg('randEnemy', 700)] }, 'Surainya menyala seperti matahari tengah hari.');
mon('api_salamander', 'Salamander Kawah', 'api', 'E', 5, 2200, 1000, 2400, '🦎', 'Naga', { foil: 'ember', summon: [burn('randEnemy', 300)] }, 'Berenang di lahar seperti ikan di sungai.');
mon('api_agni', 'Agni Dewa Pembakar', 'api', 'L', 7, 3300, 1000, 3200, '🔥', 'Dewa Api', { foil: 'rainbow', tag: 'EX', kw: ['haste'], summon: [burn('randEnemy', 400)], death: [token('tkn_abu')] }, 'Persembahan pertama manusia adalah api miliknya.');
mon('api_surtr', 'Surtr Raja Api Raksasa', 'api', 'L', 8, 4000, 1200, 3800, '🌋', 'Raksasa Api', {
  foil: 'ember', tag: 'GX', kw: ['pierce'],
  summon: [dmg('allEnemy', 900)],
  skill: sk('Pedang Api Akhir Zaman', 4, null, [dmg('allEnemy', 1400), burn('randEnemy', 400)]),
}, 'Pedangnya yang menyala menutup zaman terakhir.');

// ---------- AIR 💧 ----------
mon('air_kepiting', 'Kepiting Karang', 'air', 'C', 1, 400, 600, 900, '🦀', 'Hewan', { kw: ['taunt'] }, 'Capitnya kecil, nyalinya besar.');
mon('air_pelaut', 'Pelaut Badai', 'air', 'R', 3, 1200, 600, 1500, '⚓', 'Pelaut', { summon: [draw(1)] }, 'Setiap badai membawakannya cerita baru.');
mon('air_dayang', 'Dayang Samudra', 'air', 'R', 4, 1400, 800, 1700, '🧜‍♂️', 'Peri Air', { foil: 'frost', skill: sk('Arus Penyembuh', 2, null, [heal('allAlly', 500)]) }, 'Arus yang ia panggil menyembuhkan seluruh pasukan.');
mon('air_paus', 'Paus Biru Purba', 'air', 'E', 5, 2300, 1000, 3000, '🐳', 'Monster Laut', { foil: 'holo', summon: [heal('allAlly', 500)] }, 'Nyanyiannya terdengar sampai ke dasar palung.');
mon('air_glasial', 'Golem Glasial', 'air', 'E', 5, 2000, 1400, 2600, '🧊', 'Golem', { foil: 'frost', kw: ['taunt'], summon: [stun('randEnemy')] }, 'Es abadi yang berjalan dan tak pernah mencair.');
mon('air_njord', 'Njord Penguasa Pasang', 'air', 'L', 7, 3000, 1300, 3800, '🌊', 'Dewa Laut', { foil: 'frost', tag: 'EX', kw: ['taunt'], summon: [stun('randEnemy')], death: [heal('allAlly', 800)] }, 'Pasang dan surut mengikuti hembusan napasnya.');
mon('air_tiamat', 'Tiamat Ibu Samudra', 'air', 'L', 8, 3400, 1500, 4300, '🐉', 'Naga Laut', {
  foil: 'aurora', tag: 'GX', kw: ['pierce'],
  summon: [heal('allAlly', 700), dmg('allEnemy', 500)],
  skill: sk('Gelombang Purba', 4, null, [dmg('allEnemy', 1200), stun('allEnemy')]),
}, 'Dari tubuhnya lahir lautan pertama.');

// ---------- TANAH 🪨 ----------
mon('tnh_semut', 'Semut Penggali', 'tanah', 'C', 1, 500, 400, 700, '🐜', 'Serangga', { summon: [draw(1)] }, 'Kecil, rajin, dan selalu membawa sesuatu pulang.');
mon('tnh_pengawal', 'Pengawal Gua', 'tanah', 'R', 3, 1100, 1200, 1800, '🛡️', 'Prajurit', { kw: ['shield'] }, 'Tak seorang pun menembus gerbang guanya.');
mon('tnh_kristal', 'Penyihir Kristal', 'tanah', 'R', 4, 1400, 900, 1800, '🔮', 'Penyihir', { foil: 'gold', skill: sk('Pecahan Kristal', 2, 'enemyMonster', [dmg('T', 900)]) }, 'Mantranya memantul di seribu permukaan permata.');
mon('tnh_banteng', 'Banteng Batu Merah', 'tanah', 'E', 5, 2500, 1100, 2700, '🐂', 'Hewan Buas', { foil: 'holo', kw: ['haste'], summon: [dmg('randEnemy', 600)] }, 'Tanduknya meretakkan tebing.');
mon('tnh_raksasa', 'Raksasa Tambang Emas', 'tanah', 'E', 5, 2300, 1300, 2800, '💎', 'Raksasa', { foil: 'gold', kw: ['taunt'], death: [dmg('allEnemy', 500)] }, 'Setiap langkahnya menjatuhkan serpihan emas.');
mon('tnh_ptah', 'Ptah Sang Pemahat Dunia', 'tanah', 'L', 7, 3100, 1900, 4200, '🏛️', 'Dewa Pengrajin', { foil: 'gold', tag: 'EX', kw: ['taunt'], skill: sk('Pahatan Maut', 3, 'enemyMonster', [dmg('T', 1500), stun('T')]) }, 'Ia memahat gunung seperti orang memahat kayu.');
mon('tnh_gaia', 'Gaia Ibu Bumi', 'tanah', 'L', 8, 3000, 2400, 5000, '🌏', 'Dewi Bumi', {
  foil: 'emerald', tag: 'GX', kw: ['taunt', 'shield'],
  summon: [heal('allAlly', 900)],
  skill: sk('Pelukan Bumi', 4, null, [heal('allAlly', 1000), shield('allAlly')]),
}, 'Semua yang hidup berpijak di punggungnya.');

// ---------- ANGIN 🌪️ ----------
mon('agn_capung', 'Capung Pelayang', 'angin', 'C', 1, 500, 200, 600, '🦟', 'Serangga', { kw: ['haste'] }, 'Menari di atas permukaan air tanpa membasahi sayap.');
mon('agn_pendekar', 'Pendekar Awan', 'angin', 'R', 3, 1400, 400, 1200, '🎐', 'Pendekar', { kw: ['haste'], summon: [dmg('foe', 300)] }, 'Jurusnya ringan seperti awan, tajam seperti badai.');
mon('agn_penyair', 'Penyair Angin', 'angin', 'R', 4, 1300, 600, 1600, '🎻', 'Penyair', { foil: 'aurora', summon: [draw(1)], skill: sk('Syair Semangat', 2, null, [buff('allAlly', { atk: 200 })]) }, 'Bait-baitnya dibawa angin ke seluruh medan.');
mon('agn_naga_awan', 'Naga Awan Putih', 'angin', 'E', 5, 2300, 800, 2200, '🐲', 'Naga', { foil: 'holo', kw: ['haste', 'pierce'] }, 'Meliuk di antara awan tanpa meninggalkan jejak.');
mon('agn_roc', 'Roc Raksasa', 'angin', 'E', 5, 2400, 700, 2300, '🦤', 'Burung Dewa', { foil: 'aurora', kw: ['haste'], summon: [dmg('allEnemy', 400)] }, 'Bayangannya menutupi seluruh kota.');
mon('agn_quetzal', 'Quetzalcoatl Ular Berbulu', 'angin', 'L', 7, 3200, 1000, 3300, '🦜', 'Naga Langit', { foil: 'rainbow', tag: 'EX', kw: ['haste'], summon: [draw(1), mana(1)] }, 'Bulunya menyimpan tujuh warna fajar.');
mon('agn_aeolus', 'Aeolus Penjaga Kantung Angin', 'angin', 'L', 8, 3400, 1100, 3500, '💨', 'Dewa Angin', {
  foil: 'aurora', tag: 'GX', kw: ['haste', 'pierce'],
  summon: [draw(2), bounce('randEnemy')],
  skill: sk('Badai Penghancur Dunia', 4, null, [dmg('allEnemy', 1200), bounce('randEnemy')]),
}, 'Sekali ia melepas tali kantungnya, dunia pun berputar.');

// ---------- PETIR ⚡ ----------
mon('ptr_kodok', 'Kodok Setrum', 'petir', 'C', 1, 500, 300, 600, '🐸', 'Hewan', { summon: [dmg('foe', 300)] }, 'Bernyanyi saat hujan, menyetrum saat diganggu.');
mon('ptr_ksatria', 'Ksatria Kilat', 'petir', 'R', 3, 1400, 600, 1300, '🏇', 'Ksatria', { kw: ['haste'] }, 'Tungganginya lebih cepat dari gema guntur.');
mon('ptr_dinamo', 'Dinamo Hidup', 'petir', 'R', 4, 1300, 800, 1600, '🔌', 'Mekanik', { foil: 'gold', skill: sk('Pelepasan Daya', 2, null, [mana(1), dmg('foe', 500)]) }, 'Menyimpan badai di dalam dadanya.');
mon('ptr_rubah', 'Rubah Petir Biru', 'petir', 'E', 5, 2300, 700, 2000, '🦊', 'Roh Rubah', { foil: 'holo', kw: ['haste'], summon: [dmg('randEnemy', 700)] }, 'Ekornya menyalakan langit malam.');
mon('ptr_titan', 'Titan Kumparan', 'petir', 'E', 5, 2500, 1200, 2500, '🏗️', 'Mekanik', { foil: 'rainbow', kw: ['pierce'], skill: sk('Ledakan Kumparan', 3, null, [dmg('allEnemy', 800)]) }, 'Raksasa baja yang menelan petir untuk sarapan.');
mon('ptr_thor', 'Thor Pemegang Palu Badai', 'petir', 'L', 7, 3400, 1200, 3400, '🔨', 'Dewa Petir', { foil: 'holo', tag: 'EX', kw: ['pierce'], summon: [dmg('foe', 900)] }, 'Setiap ayunan palunya adalah guntur.');
mon('ptr_indra', 'Indra Raja Para Dewa', 'petir', 'L', 8, 3900, 1100, 3700, '👁️', 'Dewa Petir', {
  foil: 'rainbow', tag: 'GX', kw: ['pierce', 'haste'],
  summon: [dmg('allEnemy', 800)],
  skill: sk('Vajra Pemusnah', 4, null, [dmg('allEnemy', 1400), stun('randEnemy')]),
}, 'Vajra di tangannya membelah langit tujuh lapis.');

// ---------- ALAM 🌿 ----------
mon('alm_kelinci', 'Kelinci Semanggi', 'alam', 'C', 1, 400, 300, 800, '🐇', 'Hewan', { start: [heal('src', 200)] }, 'Keberuntungan tumbuh di mana pun ia melompat.');
mon('alm_pemburu', 'Pemburu Rimba', 'alam', 'R', 3, 1300, 600, 1400, '🏹', 'Pemburu', { kw: ['haste'], summon: [dmg('randEnemy', 400)] }, 'Ia hapal setiap jejak di dalam hutan.');
mon('alm_tabib', 'Tabib Akar', 'alam', 'R', 4, 1100, 800, 1800, '🌿', 'Tabib', { foil: 'emerald', skill: sk('Ramuan Akar', 1, 'allyMonster', [heal('T', 800)]) }, 'Obatnya diracik dari akar yang sudah berusia ratusan tahun.');
mon('alm_gajah', 'Gajah Hutan Perkasa', 'alam', 'E', 5, 2300, 1300, 3000, '🐘', 'Hewan Buas', { foil: 'holo', kw: ['taunt'], summon: [heal('me', 600)] }, 'Ingatannya sepanjang usia hutan.');
mon('alm_ular', 'Ular Lumut Raksasa', 'alam', 'E', 5, 2400, 900, 2300, '🐍', 'Hewan Buas', { foil: 'emerald', summon: [stun('randEnemy'), token('tkn_sulur')] }, 'Kulitnya ditumbuhi lumut dan rahasia.');
mon('alm_demeter', 'Demeter Ibu Panen', 'alam', 'L', 7, 2800, 1400, 3800, '🌾', 'Dewi', { foil: 'rainbow', tag: 'EX', summon: [heal('allAlly', 1000), draw(1)] }, 'Di mana ia lewat, ladang berbuah.');
mon('alm_cernunnos', 'Cernunnos Dewa Rimba', 'alam', 'L', 8, 3100, 1700, 4500, '🦌', 'Dewa Rimba', {
  foil: 'emerald', tag: 'GX', kw: ['taunt'],
  summon: [heal('allAlly', 900), token('tkn_sulur')],
  start: [heal('allAlly', 250)],
  death: [revive(4)],
}, 'Tanduknya adalah cabang dari pohon pertama.');

// ---------- CAHAYA ✨ ----------
mon('chy_lilin', 'Lilin Penuntun', 'cahaya', 'C', 1, 400, 500, 800, '🕯️', 'Roh Cahaya', { summon: [heal('me', 300)] }, 'Nyalanya kecil, tapi cukup untuk menuntun pulang.');
mon('chy_kesatria', 'Kesatria Lencana Emas', 'cahaya', 'R', 3, 1300, 1000, 1600, '⚜️', 'Ksatria', { kw: ['shield'] }, 'Lencananya memantulkan serangan pertama.');
mon('chy_oracle', 'Peramal Cahaya', 'cahaya', 'R', 4, 1300, 700, 1600, '🔭', 'Peramal', { foil: 'gold', summon: [draw(1)], skill: sk('Ramalan', 2, 'allyMonster', [buff('T', { atk: 300 }), shield('T')]) }, 'Ia melihat serangan lawan sebelum dilancarkan.');
mon('chy_griffin', 'Griffin Emas', 'cahaya', 'E', 5, 2300, 900, 2300, '🦅', 'Makhluk Suci', { foil: 'gold', kw: ['haste', 'shield'] }, 'Bulunya berkilau seperti koin di bawah sinar matahari.');
mon('chy_valkyrie', 'Valkyrie Fajar', 'cahaya', 'E', 5, 2400, 900, 2200, '🛡️', 'Valkyrie', { foil: 'aurora', kw: ['pierce'], summon: [buff('allAlly', { atk: 200 })] }, 'Terbang menyambut yang gugur dengan cahaya pagi.');
mon('chy_michael', 'Archangel Pemimpin Pasukan', 'cahaya', 'L', 7, 3200, 1500, 3700, '🪬', 'Malaikat', { foil: 'rainbow', tag: 'EX', kw: ['shield'], summon: [buff('allAlly', { atk: 300 }), heal('allAlly', 500)] }, 'Terompetnya memanggil seluruh langit.');
mon('chy_helios', 'Helios Kereta Matahari', 'cahaya', 'L', 8, 3500, 1300, 3900, '☀️', 'Dewa Matahari', {
  foil: 'gold', tag: 'GX', kw: ['haste', 'shield'],
  summon: [dmg('allEnemy', 700), heal('allAlly', 700)],
  skill: sk('Cahaya Penghakiman', 4, 'enemyMonster', [destroy('T'), buff('allAlly', { atk: 300 })]),
}, 'Tiap pagi ia menarik matahari melintasi cakrawala.');

// ---------- GELAP 🌑 ----------
mon('glp_tikus', 'Tikus Selokan Malam', 'gelap', 'C', 1, 500, 200, 500, '🐁', 'Hewan', { kw: ['lifesteal'] }, 'Menggerogoti apa saja yang lengah.');
mon('glp_assassin', 'Pembunuh Bayangan', 'gelap', 'R', 3, 1500, 400, 1100, '🗡️', 'Pembunuh', { kw: ['haste', 'lifesteal'] }, 'Tak ada yang mendengar langkahnya.');
mon('glp_darah', 'Penyihir Darah', 'gelap', 'R', 4, 1400, 600, 1500, '🩸', 'Penyihir', { foil: 'cosmic', skill: sk('Hisap Darah', 2, 'enemyMonster', [dmg('T', 900), heal('me', 600)]) }, 'Mantranya berbayar dengan darah, milik siapa saja.');
mon('glp_naga', 'Naga Tulang Hitam', 'gelap', 'E', 5, 2400, 900, 2300, '🦕', 'Undead', { foil: 'holo', kw: ['lifesteal'], summon: [dmg('allEnemy', 400)], death: [token('tkn_tengkorak')] }, 'Bangkit dari kuburan naga yang terlupakan.');
mon('glp_reaper', 'Pencabut Nyawa', 'gelap', 'E', 5, 2500, 700, 2000, '🪦', 'Undead', { foil: 'cosmic', kw: ['pierce'], summon: [discard(1)], skill: sk('Sabit Maut', 3, 'enemyMonster', [dmg('T', 1400)]) }, 'Sabitnya tak pernah meleset dari jadwal.');
mon('glp_lilith', 'Lilith Bunda Kegelapan', 'gelap', 'L', 7, 3300, 900, 3200, '🦇', 'Dewi Malam', { foil: 'holo', tag: 'EX', kw: ['lifesteal'], summon: [discard(1), dmg('randEnemy', 800)], death: [token('tkn_bayangan')] }, 'Anak-anak malam memanggilnya dengan hormat.');
mon('glp_hades', 'Hades Penguasa Dunia Bawah', 'gelap', 'L', 8, 3600, 1300, 3800, '🔱', 'Dewa Kematian', {
  foil: 'cosmic', tag: 'GX', kw: ['lifesteal', 'pierce'],
  summon: [destroy('randEnemy'), token('tkn_tengkorak')],
  skill: sk('Gerbang Akhirat', 4, null, [dmg('allEnemy', 1000), revive(3)]),
}, 'Semua jiwa pada akhirnya menjadi rakyatnya.');

// ---------- NETRAL ⚪ ----------
mon('ntr_hamster', 'Hamster Roda Emas', 'netral', 'C', 2, 500, 500, 900, '🐹', 'Hewan', { summon: [mana(1)] }, 'Berlari sepanjang hari, menghasilkan tenaga untuk semua.');
mon('ntr_pemburu', 'Pemburu Hadiah', 'netral', 'C', 2, 900, 400, 900, '🎯', 'Pemburu', { summon: [draw(1)] }, 'Selalu pulang dengan kantong penuh.');
mon('ntr_bard', 'Bard Pengembara', 'netral', 'R', 3, 1100, 600, 1500, '🎸', 'Bard', { summon: [buff('allAlly', { atk: 200 })] }, 'Lagunya membangkitkan semangat siapa saja yang mendengar.');
mon('ntr_golemperunggu', 'Golem Perunggu', 'netral', 'R', 4, 1400, 1400, 2100, '🗿', 'Golem', { foil: 'gold', kw: ['taunt'] }, 'Berkilau keemasan, sekeras tekadnya.');
mon('ntr_monk', 'Biksu Seribu Tangan', 'netral', 'R', 3, 1300, 800, 1500, '🧘', 'Biksu', { foil: 'holo', skill: sk('Pukulan Seribu', 1, 'enemyMonster', [dmg('T', 400)]) }, 'Satu tubuh, seribu pukulan.');
mon('ntr_kimera', 'Kimera Tiga Kepala', 'netral', 'E', 5, 2400, 900, 2400, '🐐', 'Monster Campuran', { foil: 'holo', kw: ['pierce'], summon: [dmg('randEnemy', 700)] }, 'Tiga kepala, tiga amarah, satu lapar.');
mon('ntr_jam', 'Jam Waktu Hidup', 'netral', 'E', 5, 2000, 1000, 2300, '⏳', 'Mekanik', { foil: 'frost', summon: [draw(1), mana(1)], skill: sk('Putar Waktu', 3, null, [heal('allAlly', 700)]) }, 'Detiknya bisa ia putar sesuka hati.');
mon('ntr_pelangi', 'Burung Pelangi Agung', 'netral', 'L', 7, 3200, 1100, 3200, '🦩', 'Burung Dewa', { foil: 'rainbow', tag: 'EX', kw: ['haste'], summon: [draw(1), heal('allAlly', 500)] }, 'Satu kepak, tujuh warna menyebar di langit.');
mon('ntr_kosmos', 'Kosmos Penjaga Bintang', 'netral', 'L', 8, 3500, 1600, 4200, '🌌', 'Penjaga Kosmos', {
  foil: 'cosmic', tag: 'GX', kw: ['pierce', 'shield'],
  summon: [dmg('allEnemy', 600), heal('allAlly', 600)],
  skill: sk('Ledakan Galaksi', 4, null, [dmg('allEnemy', 1300), heal('allAlly', 700)]),
}, 'Setiap bintang di langit adalah mata miliknya.');
mon('ntr_penguasa', 'Raja Segala Elemen', 'netral', 'L', 8, 3800, 1500, 4000, '🏆', 'Raja Elemen', {
  foil: 'rainbow', tag: 'GX', kw: ['pierce', 'taunt'],
  summon: [dmg('allEnemy', 700), draw(1)],
  skill: sk('Murka Semua Elemen', 4, null, [dmg('allEnemy', 1400), heal('allAlly', 600)]),
}, 'Delapan elemen tunduk di bawah satu mahkota.');

// =====================================================================
//  SIHIR (gelombang 4)
// =====================================================================
spell('sp_lahar', 'Tombak Lahar', 'api', 'R', 3, 'enemyMonster', [dmg('T', 1500)], '🌋', 'Sekali lempar, satu musuh meleleh.', { foil: 'ember' });
spell('sp_inferno', 'Inferno Penghabisan', 'api', 'L', 6, null, [dmg('allEnemy', 1600), burn('randEnemy', 400)], '☄️', 'Semua yang tersisa, dibakar habis.', { foil: 'ember', tag: 'GX' });
spell('sp_embun', 'Embun Kehidupan', 'air', 'R', 2, 'allyMonster', [heal('T', 900), shield('T')], '💧', 'Setetes embun, sejuta harapan.');
spell('sp_tsunami', 'Tsunami Besar', 'air', 'E', 5, null, [dmg('allEnemy', 1000), stun('allEnemy')], '🌊', 'Dinding air setinggi menara menyapu semuanya.', { foil: 'frost' });
spell('sp_pilar', 'Pilar Batu', 'tanah', 'C', 2, 'allyMonster', [buff('T', { def: 500, hp: 300 })], '🗿', 'Tanah menjulang menjadi benteng.');
spell('sp_bencana', 'Bencana Tanah', 'tanah', 'E', 5, null, [dmg('allEnemy', 1200), stun('randEnemy')], '🌍', 'Bumi bergoyang, dunia berhenti sejenak.', { foil: 'gold' });
spell('sp_tornado', 'Tornado Penyapu', 'angin', 'R', 4, null, [bounce('randEnemy'), dmg('allEnemy', 700)], '🌪️', 'Menyapu bersih lapangan dalam sekejap.', { foil: 'aurora' });
spell('sp_anginsurga', 'Angin Surgawi', 'angin', 'E', 4, null, [draw(2), buff('allAlly', { atk: 200 })], '🍃', 'Berembus dari tempat yang tak bisa dijangkau.', { foil: 'holo' });
spell('sp_sambar', 'Sambaran Dewa', 'petir', 'E', 5, 'enemyMonster', [dmg('T', 2000), dmg('foe', 700)], '⚡', 'Langit murka, hanya satu yang tersambar.', { foil: 'rainbow' });
spell('sp_isi', 'Pengisian Daya', 'petir', 'C', 1, 'allyMonster', [tbuff('T', 600)], '🔋', 'Satu giliran penuh kekuatan.');
spell('sp_semi', 'Musim Semi Abadi', 'alam', 'E', 5, null, [heal('allAlly', 1100), buff('allAlly', { atk: 200 })], '🌸', 'Seluruh medan mekar dalam satu helaan napas.', { foil: 'emerald' });
spell('sp_duri', 'Hujan Duri', 'alam', 'R', 3, 'enemyMonster', [dmg('T', 1100), stun('T')], '🌵', 'Ribuan duri jatuh dari langit.');
spell('sp_fajar', 'Fajar Penebus', 'cahaya', 'L', 6, null, [heal('allAlly', 1500), buff('allAlly', { atk: 300 })], '🌄', 'Pagi yang menghapus semua malam.', { foil: 'gold', tag: 'EX' });
spell('sp_lindung', 'Cahaya Perlindungan', 'cahaya', 'C', 2, 'allyMonster', [shield('T'), heal('T', 500)], '🔆', 'Selimut cahaya bagi yang terluka.');
spell('sp_gerhana', 'Gerhana Pemusnah', 'gelap', 'L', 6, 'enemyMonster', [destroy('T'), dmg('allEnemy', 800)], '🌑', 'Saat matahari tertutup, tak ada yang selamat.', { foil: 'cosmic', tag: 'GX' });
spell('sp_bisikan', 'Bisikan Kematian', 'gelap', 'R', 3, 'enemyMonster', [dmg('T', 1000), discard(1)], '🗣️', 'Kata terakhir yang akan kau dengar.', { foil: 'holo' });

// =====================================================================
//  RELIK (gelombang 4)
// =====================================================================
relic('rl_cambuk', 'Cambuk Lahar', 'api', 'R', 2, { atk: 500, kw: ['haste'] }, '🪢', 'Setiap lecutan meninggalkan jejak bara.', { foil: 'ember' });
relic('rl_trisula', 'Trisula Samudra', 'air', 'E', 3, { atk: 500, hp: 500 }, '🔱', 'Ditempa dari karang di dasar palung.', { foil: 'frost' });
relic('rl_gada', 'Gada Gunung', 'tanah', 'E', 3, { atk: 500, def: 500, kw: ['taunt'] }, '🏏', 'Beratnya setara dengan satu bukit.', { foil: 'gold' });
relic('rl_jubahawan', 'Jubah Awan', 'angin', 'E', 3, { atk: 400, hp: 400, kw: ['haste'] }, '☁️', 'Ringan seperti napas, cepat seperti badai.', { foil: 'aurora' });
relic('rl_palu', 'Palu Petir', 'petir', 'E', 3, { atk: 800, kw: ['pierce'] }, '🔨', 'Gagangnya masih berdengung.', { foil: 'rainbow' });
relic('rl_benih', 'Benih Dunia', 'alam', 'E', 3, { hp: 900, atk: 300, kw: ['taunt'] }, '🌰', 'Dari benih ini seluruh hutan bermula.', { foil: 'emerald' });
relic('rl_halo', 'Halo Suci', 'cahaya', 'E', 3, { atk: 400, def: 400, hp: 400, kw: ['shield'] }, '⭕', 'Lingkaran cahaya yang menolak bahaya.', { foil: 'gold' });
relic('rl_sabit', 'Sabit Kegelapan', 'gelap', 'E', 3, { atk: 700, kw: ['lifesteal'] }, '🌙', 'Mengambil nyawa, memberi nyawa.', { foil: 'cosmic' });
relic('rl_kompas', 'Kompas Semesta', 'netral', 'L', 4, { atk: 500, def: 500, hp: 500, kw: ['pierce'] }, '🧭', 'Jarumnya selalu menunjuk ke arah kemenangan.', { foil: 'rainbow', tag: 'EX' });

// =====================================================================
//  JEBAKAN (gelombang 4)
// =====================================================================
trap('tr_letusan', 'Letusan Tersembunyi', 'api', 'E', 4, 'summon', [dmg('trig', 1500), burn('trig', 400)], '🌋', 'Tanah di bawah kakinya tiba-tiba memuntahkan api.', { foil: 'ember' });
trap('tr_arus', 'Arus Penghisap', 'air', 'R', 3, 'attack', [negate(), bounce('trig')], '🌀', 'Penyerang terseret kembali ke tangan pemiliknya.', { foil: 'frost' });
trap('tr_retakan', 'Retakan Bumi', 'tanah', 'E', 4, 'summon', [destroy('trig')], '⛏️', 'Bumi terbuka, lalu menutup kembali.', { foil: 'gold' });
trap('tr_angin_balas', 'Badai Pembalas', 'angin', 'R', 3, 'spell', [negate(), draw(1)], '🌬️', 'Mantra lawan dilahap angin, lalu menjadi pengetahuan.', { foil: 'aurora' });
trap('tr_jerat', 'Jerat Listrik', 'petir', 'R', 3, 'summon', [dmg('trig', 900), stun('trig')], '🪢', 'Kabel tak terlihat menyetrum siapa pun yang melangkah.', { foil: 'rainbow' });
trap('tr_akar', 'Akar Penjerat', 'alam', 'R', 3, 'summon', [stun('trig'), heal('me', 600)], '🌱', 'Akar tua menarik penyusup ke dalam tanah.', { foil: 'emerald' });
trap('tr_pembalas', 'Pembalasan Ilahi', 'cahaya', 'E', 4, 'attack', [negate(), dmg('trig', 1800)], '⚖️', 'Timbangan langit menjatuhkan hukuman seketika.', { foil: 'gold' });
trap('tr_kutuk', 'Kutukan Balasan', 'gelap', 'R', 3, 'spell', [negate(), dmg('foe', 800)], '🕯️', 'Kutukan yang kau lempar kembali menghantuimu.', { foil: 'cosmic' });

// =====================================================================
//  MEDAN (gelombang 4)
// =====================================================================
field('fd_kutub', 'Tundra Beku', 'air', 'E', 3, { el: 'air', atk: 200, def: 400 }, null, '🏔️', 'Monster Air +200 ATK, +400 DEF.', { foil: 'frost' });
field('fd_langit', 'Singgasana Awan', 'angin', 'E', 3, { el: 'angin', atk: 400, def: 100 }, null, '🌤️', 'Monster Angin +400 ATK, +100 DEF.', { foil: 'aurora' });
field('fd_menara', 'Menara Petir Raksasa', 'petir', 'E', 3, { el: 'petir', atk: 500, def: 0 }, null, '🗼', 'Monster Petir +500 ATK.', { foil: 'rainbow' });
field('fd_surga', 'Taman Surgawi', 'cahaya', 'L', 4, { el: 'cahaya', atk: 300, def: 300 }, [heal('me', 400)], '🏛️', 'Monster Cahaya +300 ATK/DEF dan memulihkan LP-mu tiap giliran.', { foil: 'gold' });

// =====================================================================
//  🎓 KARTU TRAINER — 5 KARTU BARU
//  Tempel di cards.js (di atas bagian "TOKEN"), setelah Gelombang 4.
//  Dibuat dengan helper spell() yang sudah ada, jadi langsung jalan
//  tanpa perubahan engine. Pita "TRAINER" lewat field tag.
//
//  Desain khusus: tiap kartu punya  skin: 'trainer'  dan  grad: [warna gelap 1, warna gelap 2].
//  Dibaca oleh Card.jsx -> style di card-trainer.css. Tanpa foil agar tampilan matte & kasar.
// =====================================================================
spell('trn_profesor', 'Profesor Elemen', 'netral', 'R', 2, null, [draw(3)], '👨‍🔬', 'Satu kuliah singkat, tiga ilmu baru.', { tag: 'TRAINER', skin: 'trainer', grad: ['#0f3d4a', '#1e1b4b'] });
spell('trn_pelatih', 'Pelatih Tangguh', 'netral', 'R', 2, 'allyMonster', [buff('T', { atk: 500, hp: 500 })], '🧢', 'Latihan keras hari ini, juara esok hari.', { tag: 'TRAINER', skin: 'trainer', grad: ['#2f4a14', '#14210a'] });
spell('trn_perawat', 'Perawat Klinik Elemen', 'netral', 'E', 3, null, [heal('allAlly', 1200), heal('me', 800)], '👩‍⚕️', 'Semua monster pulih sebelum pertandingan berikutnya.', { tag: 'TRAINER', skin: 'trainer', grad: ['#7f1d3a', '#3b0a1c'] });
spell('trn_rival', 'Rival Berbahaya', 'netral', 'E', 3, 'enemyMonster', [bounce('T'), dmg('foe', 500)], '😤', 'Ia datang menantang, lalu mengusir lawan dari arena.', { tag: 'TRAINER', skin: 'trainer', grad: ['#4c1d95', '#1e0a3c'] });
spell('trn_juara', 'Juara Liga', 'netral', 'L', 5, null, [buff('allAlly', { atk: 400, def: 300 }), draw(2), mana(1)], '🏅', 'Sabuk juara membangkitkan seluruh pasukan.', { tag: 'TRAINER', skin: 'trainer', grad: ['#7c4a0a', '#2b1705'] });

// =====================================================================
//  TOKEN (tidak masuk deck)
// =====================================================================
const tok = (id, name, element, atk, def, hp, icon, race, kw = []) => ({
  id, type: 'monster', token: true, name, element, rarity: 'C', cost: 0, atk, def, hp, icon, race,
  kw, skill: null, onSummon: null, onDeath: null, onStart: null, onAttack: null, flavor: 'Token',
  foil: null, tag: null, img: null,
});

export const TOKENS = {
  tkn_abu: tok('tkn_abu', 'Abu Phoenix', 'api', 1000, 400, 1000, '🔥', 'Abu'),
  tkn_sulur: tok('tkn_sulur', 'Sulur Hidup', 'alam', 600, 600, 900, '🌿', 'Tumbuhan', ['taunt']),
  tkn_tengkorak: tok('tkn_tengkorak', 'Tengkorak', 'gelap', 600, 300, 600, '☠️', 'Undead'),
  tkn_bayangan: tok('tkn_bayangan', 'Bayangan Haus', 'gelap', 700, 200, 600, '👥', 'Bayangan', ['lifesteal']),
  tkn_lebah: tok('tkn_lebah', 'Lebah Pekerja', 'alam', 500, 200, 400, '🐝', 'Serangga', ['haste']),
};

// =====================================================================
//  MINIMUM TIAP KARTU — hanya mengisi yang masih kosong (kartu yang sudah
//  punya pasif/efek buatan tangan TIDAK diubah).
//   - Monster : >= 1 PASIF (kata kunci / efek awal giliran / efek saat mati)
//               dan >= 1 EFEK (efek saat dipanggil atau skill).
//   - Relik   : >= 1 PASIF (kata kunci) selain bonus statnya.
//   - Medan   : aura (pasif) + efek awal giliran.
//  Nilainya naik mengikuti kelangkaan: C < R < E < L.
// =====================================================================
const TIER = { C: 0, R: 1, E: 2, L: 3 };
const byTier = (r, arr) => arr[TIER[r] ?? 0];

const AUTO_PASSIVE = {
  api: () => ({ kw: ['haste'] }),
  angin: () => ({ kw: ['haste'] }),
  petir: () => ({ kw: ['pierce'] }),
  gelap: () => ({ kw: ['lifesteal'] }),
  tanah: () => ({ kw: ['shield'] }),
  netral: () => ({ kw: ['taunt'] }),
  air: (r) => ({ onStart: [heal('me', byTier(r, [150, 250, 350, 500]))] }),
  alam: (r) => ({ onStart: [heal('src', byTier(r, [200, 300, 400, 600]))] }),
  cahaya: (r) => ({ onStart: [heal('allAlly', byTier(r, [100, 150, 200, 300]))] }),
};

const AUTO_EFFECT = {
  api: (r) => [burn('randEnemy', byTier(r, [200, 300, 400, 500]))],
  air: (r) => [heal('me', byTier(r, [300, 500, 800, 1200]))],
  tanah: (r) => [buff('allAlly', { def: byTier(r, [100, 150, 200, 300]) })],
  angin: () => [draw(1)],
  petir: (r) => [dmg('allEnemy', byTier(r, [100, 200, 300, 500]))],
  alam: (r) => [heal('allAlly', byTier(r, [200, 300, 400, 600]))],
  cahaya: (r) => [buff('allAlly', { atk: byTier(r, [100, 150, 200, 300]) })],
  gelap: () => [discard(1)],
  netral: (r) => byTier(r, [[draw(1)], [mana(1)], [draw(1)], [draw(1), mana(1)]]),
};

const RELIC_KW = {
  api: 'haste', air: 'shield', tanah: 'taunt', angin: 'haste', petir: 'pierce',
  alam: 'taunt', cahaya: 'shield', gelap: 'lifesteal', netral: 'shield',
};

LIST.forEach((c) => {
  if (c.type === 'monster') {
    const hasPassive = (c.kw && c.kw.length) || c.onStart || c.onDeath || c.onAttack;
    if (!hasPassive) Object.assign(c, (AUTO_PASSIVE[c.element] || AUTO_PASSIVE.netral)(c.rarity));
    if (!c.skill && !c.onSummon) c.onSummon = (AUTO_EFFECT[c.element] || AUTO_EFFECT.netral)(c.rarity);
  } else if (c.type === 'relic') {
    if (!c.kw || !c.kw.length) c.kw = [RELIC_KW[c.element] || 'shield'];
  } else if (c.type === 'field') {
    if (!c.onStart) c.onStart = [heal('me', byTier(c.rarity, [100, 150, 250, 400]))];
  }
});

export const ALL_CARDS = LIST;
export const CARDS = Object.fromEntries([...LIST, ...Object.values(TOKENS)].map((c) => [c.id, c]));
export const getCard = (id) => CARDS[id];