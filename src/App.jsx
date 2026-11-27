import { useEffect, useState } from 'react';
import { useStore } from './store/useStore.js';
import { setMuted } from './lib/sfx.js';
import { bgm } from './lib/bgm.js';
import StarterPick from './screens/StarterPick.jsx';
import Menu from './screens/Menu.jsx';
import DuelSetup from './screens/DuelSetup.jsx';
import Duel from './screens/Duel.jsx';
import DeckBuilder from './screens/DeckBuilder.jsx';
import Collection from './screens/Collection.jsx';
import Shop from './screens/Shop.jsx';
import Rules from './screens/Rules.jsx';
import { buildEnemyDeck } from './data/opponents.js';
import Fusion from './screens/Fushion.jsx';
import Gacha from './screens/Gacha.jsx';

export default function App() {
  const started = useStore((s) => s.started);
  const muted = useStore((s) => s.muted);
  const [screen, setScreen] = useState('menu');
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    setMuted(muted);
    bgm.setMuted(muted);
  }, [muted]);

  // musik latar: tegang di layar duel, tenang di semua layar lain
  useEffect(() => {
    bgm.setBase(screen === 'duel' ? 'tense' : 'menu');
  }, [screen]);

  if (!started) return <StarterPick />;

  const back = () => setScreen('menu');

  switch (screen) {
    case 'setup':
      return <DuelSetup onBack={back} onStart={(c) => { setCfg(c); setScreen('duel'); }} />;
    case 'duel':
      return (
        <Duel
          key={cfg.nonce || 'duel'}
          config={cfg}
          onExit={back}
          onRematch={() => {
            // lawan yang sama, deck lawan diacak ulang, game baru
            setCfg({ ...cfg, enemyDeck: buildEnemyDeck(cfg.enemy, cfg.difficulty), nonce: Math.random() });
          }}
        />
      );
    case 'deck':
      return <DeckBuilder onBack={back} />;
    case 'collection':
      return <Collection onBack={back} />;
    case 'shop':
      return <Shop onBack={back} />;
    case 'rules':
      return <Rules onBack={back} />;
    case 'gacha':
      return <Gacha onBack={back} />;
    case 'fusion':
      return <Fusion onBack={back} />;
    default:
      return <Menu go={setScreen} />;
  }
}