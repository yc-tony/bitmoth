const BASE = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3000';

export interface PokedexEntry {
  hash: string;
  schemaVersion: number;
  raceId: number;
  title: string;
  name: string;
  flavor: string;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  discoveredAt: string;
}

export async function lookupPokedex(hash: string): Promise<PokedexEntry | null> {
  const res = await fetch(`${BASE}/api/pokedex/${hash}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Pokedex lookup failed: ${res.status}`);
  return res.json();
}

export async function registerPokedex(entry: Omit<PokedexEntry, 'discoveredAt'> & { imageBase64?: string }): Promise<{ entry: PokedexEntry; registered: boolean }> {
  const res = await fetch(`${BASE}/api/pokedex`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`Pokedex register failed: ${res.status}`);
  const { registered, ...data } = await res.json();
  return { entry: data, registered };
}

export async function fetchStats(hash: string): Promise<Omit<PokedexEntry, 'hash' | 'schemaVersion' | 'discoveredAt'>> {
  const res = await fetch(`${BASE}/api/bitmoth/${hash}`);
  if (!res.ok) throw new Error(`Bitmoth API failed: ${res.status}`);
  return res.json();
}
