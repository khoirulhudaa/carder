// Simulasi AI vs AI untuk menguji engine: `npm run simulate [jumlah-game]`
import { createGame, reduce, opp } from '../src/engine/engine.js';
import { chooseAction } from '../src/engine/ai.js';
import { autoDeck, validateDeck } from '../src/engine/deck.js';
import { ELEMENT_LIST } from '../src/data/elements.js';
import { CARDS } from '../src/data/cards.js';
import { HAND_LIMIT, SLOTS } from '../src/engine/constants.js';

const N = Number(process.argv[2]) || 200;
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

function check(s, where) {
  for (const side of ['player', 'enemy']) {
    const p = s.players[side];
    if (!Number.isFinite(p.lp) || p.lp < 0) throw new Error(`${where}: LP invalid ${p.lp}`);
    if (p.mana < 0) throw new Error(`${where}: mana negatif`);
    if (p.hand.length > HAND_LIMIT) throw new Error(`${where}: tangan > limit`);
    if (p.monsters.length !== SLOTS) throw new Error(`${where}: slot monster rusak`);
    p.monsters.forEach((m) => {
      if (m && m.hp <= 0) throw new Error(`${where}: monster hp<=0 masih di papan`);
      if (m && !CARDS[m.id]) throw new Error(`${where}: id monster tak dikenal`);
    });
  }
}

const turnsArr = [];
let turns = 0, actions = 0, wins = { player: 0, enemy: 0 }, reasons = {}, timeouts = 0, errors = 0;
const diffs = ['normal', 'sulit', 'mudah'];
const t0 = Date.now();

// validasi semua deck otomatis
for (const e of ELEMENT_LIST) {
  const v = validateDeck(autoDeck([e.id]));
  if (!v.ok) { console.error('Deck auto invalid', e.id, v.errors); process.exit(1); }
}

for (let g = 0; g < N; g++) {
  const e1 = rnd(ELEMENT_LIST).id, e2 = rnd(ELEMENT_LIST).id;
  let s = createGame({ playerDeck: autoDeck([e1]), enemyDeck: autoDeck([e2, rnd(ELEMENT_LIST).id]) });
  const dP = rnd(diffs), dE = rnd(diffs);
  let guard = 0;
  try {
    while (!s.winner && s.turn < 80 && guard++ < 2000) {
      const side = s.active;
      const a = chooseAction(s, side, side === 'player' ? dP : dE);
      s = reduce(s, a);
      actions++;
      check(s, `game ${g}`);
    }
  } catch (err) {
    errors++;
    console.error('ERROR di game', g, err.stack);
    if (errors > 3) process.exit(1);
    continue;
  }
  if (!s.winner) timeouts++;
  else { wins[s.winner]++; reasons[s.reason] = (reasons[s.reason] || 0) + 1; }
  turns += s.turn;
  turnsArr.push(s.turn);
}

console.log(`\n=== Hasil ${N} game (${((Date.now() - t0) / 1000).toFixed(1)}s) ===`);
turnsArr.sort((a, b) => a - b);
console.log('Median giliran:', turnsArr[Math.floor(turnsArr.length / 2)], '| p90:', turnsArr[Math.floor(turnsArr.length * 0.9)]);
console.log('Rata-rata giliran:', (turns / N).toFixed(1), '| aksi/game:', (actions / N).toFixed(0));
console.log('Menang  player:', wins.player, ' enemy:', wins.enemy, '| timeout:', timeouts, '| error:', errors);
console.log('Alasan:', reasons);
if (errors || timeouts > N * 0.05) process.exit(1);
