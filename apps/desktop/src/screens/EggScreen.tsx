import { useEffect, useRef, useState } from 'react';
import { decodeDna } from '@bitmoth/core';
import { lookupPokedex, registerPokedex, fetchStats } from '../lib/pokedex';

type Phase = 'identifying' | 'identified' | 'hatching' | 'hatched' | 'offline';

interface HatchedData {
  hash: string;
  title: string;
  name: string;
  flavor: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

interface Props {
  hash: string;
  onBack: () => void;
  onHatched: (data: HatchedData) => void;
}

export function EggScreen({ hash, onBack, onHatched }: Props) {
  const [phase, setPhase] = useState<Phase>('identifying');
  const [hatched, setHatched] = useState<HatchedData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dna = decodeDna(hash);

  useEffect(() => {
    renderEgg();
    identify();
  }, [hash]);

  function renderEgg() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    // 用 DNA 主色畫一顆蛋的輪廓
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = dna.primaryColor;
    ctx.beginPath();
    ctx.ellipse(112, 140, 70, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dna.secondaryColor;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  async function identify() {
    setPhase('identifying');
    try {
      let entry = await lookupPokedex(hash);

      if (!entry) {
        // 新怪獸：請 server 用 Ollama 生成
        const stats = await fetchStats(hash);
        // 登記到圖鑑
        const result = await registerPokedex({
          hash,
          schemaVersion: dna.schemaVersion,
          raceId: dna.raceId,
          title: stats.title,
          name: stats.name,
          flavor: stats.flavor,
          hp: stats.hp,
          atk: stats.atk,
          def: stats.def,
          spd: stats.spd,
        });
        entry = result.entry;
      }

      setPhase('identified');
      // 發光效果：2 秒後開始孵化
      setTimeout(() => {
        setPhase('hatching');
        setTimeout(() => {
          const data: HatchedData = { hash, ...entry! };
          setHatched(data);
          setPhase('hatched');
          onHatched(data);
        }, 2000);
      }, 2000);
    } catch {
      setPhase('offline');
    }
  }

  return (
    <div className="egg-screen">
      <button onClick={onBack}>← 返回</button>
      <canvas
        ref={canvasRef}
        width={224}
        height={336}
        className={`egg-canvas ${phase === 'identified' || phase === 'hatching' ? 'glow' : ''}`}
      />
      <div className="egg-status">
        {phase === 'identifying' && <p>🔍 識別中…</p>}
        {phase === 'identified'  && <p>✨ 識別完成，準備孵化！</p>}
        {phase === 'hatching'    && <p>🥚 孵化中…</p>}
        {phase === 'hatched'     && hatched && (
          <div>
            <h2>{hatched.title} {hatched.name}</h2>
            <p>{hatched.flavor}</p>
            <p>HP {hatched.hp} / ATK {hatched.atk} / DEF {hatched.def} / SPD {hatched.spd}</p>
          </div>
        )}
        {phase === 'offline' && (
          <div>
            <p>⚠️ 無法連線圖鑑伺服器</p>
            <p>需要網路才能識別彼魔，請確認連線後重試。</p>
            <button onClick={identify}>重試</button>
          </div>
        )}
      </div>
    </div>
  );
}
