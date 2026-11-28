// Keyword baru. Tiap keyword punya penangkal supaya tidak ada kartu yang selalu menang.
export const KEYWORDS_EXTRA = {
  tembus:  { name: 'Tembus',  desc: 'Mengabaikan perisai dan posisi bertahan target. Ditangkal: Dinding.' },
  pancing: { name: 'Pancing', desc: 'Lawan wajib menyerang monster ini lebih dulu. Ditangkal: Bungkam, Tembus.' },
  sedot:   { name: 'Sedot',   desc: 'Memulihkan HP sebesar damage yang diberikan. Ditangkal: Racun.' },
  duri:    { name: 'Duri',    desc: 'Memantulkan 2 damage ke penyerang. Ditangkal: skill dan efek tak langsung.' },
  sergap:  { name: 'Sergap',  desc: 'Boleh menyerang pada giliran dipanggil. Ditangkal: Jebakan.' },
  racun:   { name: 'Racun',   desc: 'Memberi racun bertumpuk (1 damage per tumpuk tiap giliran, menahan penyembuhan).' },
  bangkit: { name: 'Bangkit', desc: 'Sekali per duel, hidup lagi dengan separuh HP. Ditangkal: Segel.' },
  bungkam: { name: 'Bungkam', desc: 'Serangannya membungkam target 1 giliran (skill dan keyword mati).' },
  dinding: { name: 'Dinding', desc: 'Serangan Tembus terhadap monster ini kehilangan efek tembusnya.' },
};