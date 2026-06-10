import { decodeDna, DNA_SCHEMA_VERSION } from '@bitmoth/core';
import { getCached, insertCache, getAll } from '../db/index.js';
import { buildPrompt } from '../ollama/prompt.js';
import { generateStats, generateFallbackStats } from '../ollama/client.js';

const HASH_RE = /^[a-f0-9]{64}$/;

function toApiShape(row) {
  return {
    hash:   row.hash,
    title:  row.title,
    name:   row.name,
    flavor: row.flavor,
    hp:  row.hp,
    atk: row.atk,
    def: row.def_stat,
    spd: row.spd,
    race: row.race,
  };
}

export async function bitmothRoutes(fastify) {
  fastify.get('/api/bitmoth/:hash', async (req, reply) => {
    const { hash } = req.params;
    if (!HASH_RE.test(hash)) {
      return reply.code(400).send({ error: 'Invalid hash format' });
    }

    const dna = decodeDna(hash);
    const cached = await getCached(hash);
    if (cached) {
      return { ...toApiShape(cached), dna, cached: true };
    }

    let generated;
    try {
      generated = await generateStats(buildPrompt(dna));
    } catch (err) {
      fastify.log.warn(`Ollama unavailable (${err.message}) — using fallback`);
      generated = generateFallbackStats(dna);
    }

    await insertCache({
      hash,
      schemaVersion: DNA_SCHEMA_VERSION,
      race: dna.raceId,
      ...generated,
    });

    return { ...generated, hash, dna, cached: false };
  });

  fastify.get('/api/gallery', async () => {
    const rows = await getAll(50);
    return rows.map(r => ({ ...toApiShape(r), dna: decodeDna(r.hash) }));
  });
}
