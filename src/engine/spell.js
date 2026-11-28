// Penyelesai sihir baru. Mengembalikan { g, events }.
import { defOf, patchMon } from './util.js';
import { applyElementHit, hurt } from './reactions.js';
import { cleanse } from './keywords.js';

export function resolveSpell(g, side, cardId, targetSlot, REG) {
  const def = REG[cardId];
  const e = def.effect;
  const foe = side === 'player' ? 'enemy' : 'player';
  const events = [{ type: 'cast', side, id: cardId }];
  let ng = g;
  switch (e.op) {
    case 'elementHit': {
      ng = hurt(ng, foe, targetSlot, e.damage, events);
      if (ng.players[foe].monsters[targetSlot]) {
        const r = applyElementHit(ng, foe, targetSlot, e.element);
        ng = r.g; events.push(...r.events);
      }
      break;
    }
    case 'cleanse':
      ng = cleanse(ng, side, targetSlot);
      break;
    case 'seal':
      // Segel: mematikan Bangkit dan Ultimate target secara permanen.
      ng = patchMon(ng, foe, targetSlot, (m) => ({ ...m, revived: true, ultUsed: true, silence: Math.max(m.silence || 0, 2) }));
      break;
    default:
      break;
  }
  return { g: ng, events };
}

export { defOf };