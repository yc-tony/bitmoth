import { pokedexLookup, pokedexRegister, pokedexList } from './db.js';

const HASH_RE = /^[a-f0-9]{64}$/;

function toShape(row) {
  return {
    hash:          row.hash,
    schemaVersion: row.schema_version,
    raceId:        row.race_id,
    title:         row.title,
    name:          row.name,
    flavor:        row.flavor,
    hp:            row.hp,
    atk:           row.atk,
    def:           row.def_stat,
    spd:           row.spd,
    discoveredAt:  row.discovered_at,
  };
}

const registerSchema = {
  body: {
    type: 'object',
    required: ['hash', 'raceId', 'title', 'name', 'flavor', 'hp', 'atk', 'def', 'spd'],
    properties: {
      hash:          { type: 'string', pattern: '^[a-f0-9]{64}$' },
      schemaVersion: { type: 'integer', default: 1 },
      raceId:        { type: 'integer', minimum: 0, maximum: 8 },
      title:         { type: 'string', maxLength: 20 },
      name:          { type: 'string', maxLength: 50 },
      flavor:        { type: 'string', maxLength: 200 },
      hp:            { type: 'integer', minimum: 100, maximum: 999 },
      atk:           { type: 'integer', minimum: 10,  maximum: 99 },
      def:           { type: 'integer', minimum: 10,  maximum: 99 },
      spd:           { type: 'integer', minimum: 10,  maximum: 99 },
      imageBase64:   { type: 'string' },
    },
    additionalProperties: false,
  },
};

export async function pokedexRoutes(fastify) {
  fastify.get('/api/pokedex/:hash', async (req, reply) => {
    const { hash } = req.params;
    if (!HASH_RE.test(hash)) return reply.code(400).send({ error: 'invalid hash' });

    const row = await pokedexLookup(hash);
    if (!row) return reply.code(404).send({ error: 'not found' });
    return toShape(row);
  });

  fastify.post('/api/pokedex', { schema: registerSchema }, async (req, reply) => {
    const existed = await pokedexLookup(req.body.hash);
    const row = await pokedexRegister({
      hash:          req.body.hash,
      schemaVersion: req.body.schemaVersion ?? 1,
      raceId:        req.body.raceId,
      title:         req.body.title,
      name:          req.body.name,
      flavor:        req.body.flavor,
      hp:            req.body.hp,
      atk:           req.body.atk,
      def:           req.body.def,
      spd:           req.body.spd,
      imageBase64:   req.body.imageBase64,
    });
    return reply.code(existed ? 200 : 201).send({ ...toShape(row), registered: !existed });
  });

  fastify.get('/api/pokedex', async () => {
    const rows = await pokedexList(50);
    return rows.map(toShape);
  });
}
