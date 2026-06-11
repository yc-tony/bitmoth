import { useEffect, useRef, useState } from 'react';
import { decodeDna, EGG_SPRITES } from '@bitmoth/core';
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

// 搖晃動畫：將蛋上半部（rows 0-5）左移或右移 1 格
function tiltFrame(frame: number[][], dir: -1 | 0 | 1): number[][] {
  return frame.map((row, r) => {
    if (dir === 0 || r >= 6) return row;
    if (dir === -1) return [...row.slice(1), 0];       // 向左搖
    return [0, ...row.slice(0, row.length - 1)];        // 向右搖
  });
}

export function EggScreen({ hash, onBack, onHatched }: Props) {
  const [phase, setPhase] = useState<Phase>('identifying');
  const [hatched, setHatched] = useState<HatchedData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const dna = decodeDna(hash);
  const egg = EGG_SPRITES[dna.raceId];

  // hash 變更時重置
  useEffect(() => {
    setPhase('identifying');
    setHatched(null);
    identify();
    return () => cancelAnimationFrame(rafRef.current);
  }, [hash]);

  // phase 變更時切換動畫
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (phase === 'identifying') animateEgg(600, false);
    else if (phase === 'identified') animateEgg(250, true);
    else if (phase === 'hatching') animateEgg(100, true);
    else if (phase === 'hatched' && hatched?.frames?.length) animateSprite(hatched.frames);
  }, [phase, hatched]);

  // ── 蛋動畫：搖晃循環 center→left→center→right ──────────────────────
  function animateEgg(interval: number, glow: boolean) {
    const { frame, shellColor, markColor, glowColor } = egg;
    const shell = glow ? glowColor : shellColor;
    const rockSeq: Array<-1 | 0 | 1> = [0, -1, 0, 1];
    const frames = rockSeq.map(d => tiltFrame(frame, d));
    let idx = 0, last = 0;

    function tick(ts: number) {
      if (ts - last >= interval) {
        drawGrid(frames[idx % frames.length], shell, markColor);
        idx++;
        last = ts;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    drawGrid(frames[0], shell, markColor);
    rafRef.current = requestAnimationFrame(tick);
  }

  // ── 孵化後怪獸點陣動畫（雙色：1=primaryColor, 2=secondaryColor）──────
  function animateSprite(spriteFrames: number[][][]) {
    let idx = 0, last = 0;
    function tick(ts: number) {
      if (ts - last >= 600) {
        drawGrid(spriteFrames[idx % spriteFrames.length], dna.primaryColor, dna.secondaryColor);
        idx++;
        last = ts;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    drawGrid(spriteFrames[0], dna.primaryColor, dna.secondaryColor);
    rafRef.current = requestAnimationFrame(tick);
  }

  // ── Canvas 繪圖（0=透明, 1=c1, 2=c2）────────────────────────────────
  function drawGrid(grid: number[][], c1: string, c2: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const rows = grid.length, cols = grid[0]?.length ?? 0;
    const ox = Math.floor((canvas.width  - cols * CELL) / 2);
    const oy = Math.floor((canvas.height - rows * CELL) / 2);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = grid[r][c];
        if (!v) continue;
        ctx.fillStyle = v === 2 ? c2 : c1;
        ctx.fillRect(ox + c * CELL, oy + r * CELL, CELL - 1, CELL - 1);
      }
    }
  }

  // ── 識別流程 ─────────────────────────────────────────────────────────
  async function identify() {
    setPhase('identifying');
    try {
      // ─── PoC：跳過 DB 圖鑑查詢，直接呼叫 Ollama 生成 ───────────────
      // const entry = await lookupPokedex(hash);
      // if (!entry) {
      //   const stats = await fetchStats(hash);
      //   const result = await registerPokedex({
      //     hash, schemaVersion: dna.schemaVersion, raceId: dna.raceId,
      //     title: stats.title, name: stats.name, flavor: stats.flavor,
      //     hp: stats.hp, atk: stats.atk, def: stats.def, spd: stats.spd,
      //   });
      //   entry = result.entry;
      // }
      // ─────────────────────────────────────────────────────────────────
      const stats = await fetchStats(hash);

      setPhase('identified');
      setTimeout(() => {
        setPhase('hatching');
        setTimeout(() => {
          const data: HatchedData = {
            hash,
            title:  stats.title,
            name:   stats.name,
            flavor: stats.flavor,
            hp:     stats.hp,
            atk:    stats.atk,
            def:    stats.def,
            spd:    stats.spd,
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
