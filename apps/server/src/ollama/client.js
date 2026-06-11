import { RACES } from '@bitmoth/core';

const STAT_PROFILES = [
  { hp: 0.70, atk: 0.85, def: 0.80, spd: 0.50 }, // 龍族
  { hp: 0.30, atk: 0.55, def: 0.40, spd: 0.92 }, // 妖精族
  { hp: 0.60, atk: 0.82, def: 0.60, spd: 0.68 }, // 惡魔族
  { hp: 0.85, atk: 0.80, def: 0.60, spd: 0.50 }, // 野獸族
  { hp: 0.60, atk: 0.50, def: 0.85, spd: 0.80 }, // 水族
  { hp: 0.40, atk: 0.60, def: 0.40, spd: 0.99 }, // 鳥族
  { hp: 0.60, atk: 0.65, def: 0.65, spd: 0.65 }, // 元素族
  { hp: 0.60, atk: 0.50, def: 0.92, spd: 0.30 }, // 構裝族
  { hp: 0.50, atk: 0.88, def: 0.30, spd: 0.62 }, // 亡靈族
];

const RACE_FLAVORS = [
  '熔岩鑄就，吞噬一切的龍裔之王。',
  '誕生於永恆星光，輕盈而致命。',
  '來自深淵的扭曲存在，散發無盡黑暗。',
  '荒野中的頂點掠食者，爪牙鋒利如刀。',
  '深海統治者，鱗片堅如精鋼。',
  '最快的天際之翼，如閃電無跡可尋。',
  '元素的具現，力量源自自然本身。',
  '機械構造的守護者，堅不可摧。',
  '死亡的使者，超越時間的亡靈。',
];

// 通用 fallback sprite：簡單生物輪廓 + 上下呼吸動畫（12×12）
const BASE_FRAME = [
  [0,0,0,1,1,1,1,1,0,0,0,0],
  [0,0,1,0,0,0,0,0,1,0,0,0],
  [0,1,0,1,0,1,0,1,0,1,0,0],
  [0,1,0,0,0,1,0,0,0,1,0,0],
  [0,1,0,0,0,0,0,0,0,1,0,0],
  [0,0,1,0,0,0,0,0,1,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0,0],
  [0,0,1,0,0,0,0,0,1,0,0,0],
  [0,1,0,0,0,0,0,0,0,1,0,0],
  [0,1,0,0,0,0,0,0,0,1,0,0],
  [0,0,1,0,0,0,0,0,1,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0,0],
];
const BOB_FRAME = [new Array(12).fill(0), ...BASE_FRAME.slice(0, 11)];
const FALLBACK_FRAMES = [BASE_FRAME, BOB_FRAME, BASE_FRAME];

function isValidFrames(frames) {
  if (!Array.isArray(frames) || frames.length < 2) return false;
  const rows = frames[0]?.length;
  const cols = frames[0]?.[0]?.length;
  if (!rows || !cols) return false;
  for (const frame of frames) {
    if (!Array.isArray(frame) || frame.length !== rows) return false;
    for (const row of frame) {
      if (!Array.isArray(row) || row.length !== cols) return false;
      if (!row.every(v => v === 0 || v === 1)) return false;
    }
  }
  return true;
}

export async function generateStats(prompt) {
  const url = (process.env.OLLAMA_URL || 'http://localhost:11434') + '/api/generate';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      prompt,
      format: 'json',
      stream: false,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.response);
  if (!parsed.title || !parsed.name || !parsed.flavor || parsed.hp == null) {
    throw new Error('Unexpected Ollama response shape');
  }
  const frames = isValidFrames(parsed.frames) ? parsed.frames : FALLBACK_FRAMES;
  return { ...parsed, frames };
}

export function generateFallbackStats(dna) {
  const seed = parseInt(dna.entropyHex.slice(0, 8), 16);
  const p = STAT_PROFILES[dna.raceId];

  let atk = Math.round(10 + p.atk * 80 + ((seed >> 16) & 0xF));
  let def = Math.round(10 + p.def * 70 + ((seed >> 20) & 0xF));
  let spd = Math.round(10 + p.spd * 70 + ((seed >> 24) & 0xF));
  const total = atk + def + spd;
  if (total > 200) {
    const s = 200 / total;
    atk = Math.round(atk * s);
    def = Math.round(def * s);
    spd = Math.round(spd * s);
  }

  return {
    title:  '',
    name:   RACES[dna.raceId],
    flavor: RACE_FLAVORS[dna.raceId],
    hp:  Math.min(999, Math.max(100, Math.round(100 + p.hp * 800 + (seed & 0xFF)))),
    atk, def, spd,
    frames: FALLBACK_FRAMES,
  };
}
