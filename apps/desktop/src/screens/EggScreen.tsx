import { useEffect, useRef, useState } from 'react';
import { decodeDna } from '@bitmoth/core';
// import { lookupPokedex, registerPokedex, fetchStats } from '../lib/pokedex';
import { fetchStats } from '../lib/pokedex';

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
  frames?: number[][][];
}

interface Props {
  hash: string;
  onBack: () => void;
  onHatched: (data: HatchedData) => void;
}

const CELL = 14;

export function EggScreen({ hash, onBack, onHatched }: Props) {
  const [phase, setPhase] = useState<Phase>('identifying');
  const [hatched, setHatched] = useState<HatchedData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const dna = decodeDna(hash);

  useEffect(() => {
    renderEgg();
    identify();
    return () => cancelAnimationFrame(rafRef.current);
  }, [hash]);

  // 孵化後啟動 pixel sprite 動畫
  useEffect(() => {
    if (phase !== 'hatched' || !hatched?.frames?.length) return;
    const frames = hatched.frames;
    const color = dna.primaryColor;
    let idx = 0;
    let last = 0;
    const INTERVAL = 600;

    function tick(ts: number) {
      if (ts - last >= INTERVAL) {
        renderSprite(frames[idx], color);
        idx = (idx + 1) % frames.length;
        last = ts;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    renderSprite(frames[0], color);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, hatched]);

  function renderEgg() {
    cancelAnimationFrame(rafRef.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = dna.primaryColor;
    ctx.beginPath();
    ctx.ellipse(112, 140, 70, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dna.secondaryColor;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  function renderSprite(grid: number[][], color: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const rows = grid.length;
    const cols = grid[0]?.length ?? 0;
    const ox = Math.floor((canvas.width - cols * CELL) / 2);
    const oy = Math.floor((canvas.height - rows * CELL) / 2);

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c]) {
          ctx.fillRect(ox + c * CELL, oy + r * CELL, CELL - 1, CELL - 1);
        }
      }
    }
  }

  async function identify() {
    setPhase('identifying');
    try {
      // ─── PoC：跳過 DB 圖鑑查詢，直接呼叫 Ollama 生成 ───────────────
      // const entry = await lookupPokedex(hash);
      // if (!entry) {
      //   const stats = await fetchStats(hash);
      //   const result = await registerPokedex({
      //     hash,
      //     schemaVersion: dna.schemaVersion,
      //     raceId: dna.raceId,
      //     title: stats.title,
      //     name: stats.name,
      //     flavor: stats.flavor,
      //     hp: stats.hp,
      //     atk: stats.atk,
      //     def: stats.def,
      //     spd: stats.spd,
      //   });
      //   entry = result.entry;
      // }
      // ─────────────────────────────────────────────────────────────────
      const stats = await fetchStats(hash);

      setPhase('identified');
      // 發光效果：2 秒後開始孵化
      setTimeout(() => {
        setPhase('hatching');
        setTimeout(() => {
          const data: HatchedData = {
            hash,
            title: stats.title,
            name: stats.name,
            flavor: stats.flavor,
            hp: stats.hp,
            atk: stats.atk,
            def: stats.def,
            spd: stats.spd,
            frames: stats.frames,
          };
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
