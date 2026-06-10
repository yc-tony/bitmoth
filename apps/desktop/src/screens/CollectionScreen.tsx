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

interface Props {
  collection: BitmothRecord[];
  onSummon: () => void;
}

export function CollectionScreen({ collection, onSummon }: Props) {
  if (collection.length === 0) {
    return (
      <div className="collection-screen empty">
        <p>還沒有任何彼魔</p>
        <button onClick={onSummon}>召喚第一隻</button>
      </div>
    );
  }

  return (
    <div className="collection-screen">
      <h2>我的圖鑑（{collection.length}）</h2>
      <div className="collection-grid">
        {collection.map(b => (
          <div key={b.hash} className="bitmoth-card">
            <div className="card-name">{b.title} {b.name}</div>
            <div className="card-stats">
              HP {b.hp} / ATK {b.atk} / DEF {b.def} / SPD {b.spd}
            </div>
            <div className="card-flavor">{b.flavor}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
