import { useState } from 'react';
import { sha256 } from '../lib/hash';
import { decodeDna } from '@bitmoth/core';

interface Props {
  onSummon: (hash: string) => void;
}

export function SummonScreen({ onSummon }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSummon() {
    if (!input.trim()) return;
    setLoading(true);
    const hash = await sha256(input.trim());
    onSummon(hash);
    setLoading(false);
  }

  return (
    <div className="summon-screen">
      <h1>召喚彼魔</h1>
      <p>輸入任意字串，封印你的彼魔</p>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSummon()}
        placeholder="輸入任意字串..."
        autoFocus
      />
      <button onClick={handleSummon} disabled={loading || !input.trim()}>
        {loading ? '計算中...' : '召喚'}
      </button>
    </div>
  );
}
