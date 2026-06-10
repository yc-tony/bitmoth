import { useState } from 'react';
import { SummonScreen } from './screens/SummonScreen';
import { EggScreen } from './screens/EggScreen';
import { CollectionScreen } from './screens/CollectionScreen';
import './App.css';

type View = 'summon' | 'egg' | 'collection';

interface BitmothRecord {
  hash: string;
  title: string;
  name: string;
  flavor: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  hatchedAt: string;
}

export default function App() {
  const [view, setView] = useState<View>('summon');
  const [activeHash, setActiveHash] = useState<string | null>(null);
  const [collection, setCollection] = useState<BitmothRecord[]>([]);

  function handleSummon(hash: string) {
    setActiveHash(hash);
    setView('egg');
  }

  function handleHatched(data: Omit<BitmothRecord, 'hatchedAt'>) {
    const record: BitmothRecord = { ...data, hatchedAt: new Date().toISOString() };
    setCollection(prev => {
      const exists = prev.find(b => b.hash === record.hash);
      return exists ? prev : [record, ...prev];
    });
  }

  return (
    <div className="app">
      <nav>
        <button onClick={() => setView('summon')} className={view === 'summon' ? 'active' : ''}>召喚</button>
        <button onClick={() => setView('collection')} className={view === 'collection' ? 'active' : ''}>
          收藏 {collection.length > 0 && `(${collection.length})`}
        </button>
      </nav>

      {view === 'summon' && <SummonScreen onSummon={handleSummon} />}
      {view === 'egg' && activeHash && (
        <EggScreen
          hash={activeHash}
          onBack={() => setView('summon')}
          onHatched={handleHatched}
        />
      )}
      {view === 'collection' && (
        <CollectionScreen collection={collection} onSummon={() => setView('summon')} />
      )}
    </div>
  );
}
