import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDb } from './src/db/index.js';
import { initPokedex } from './src/pokedex/db.js';
import { bitmothRoutes } from './src/routes/bitmoth.js';
import { pokedexRoutes } from './src/pokedex/routes.js';

const PORT = parseInt(process.env.SERVER_PORT || '3000');

const fastify = Fastify({ logger: { level: 'warn' } });

await fastify.register(cors, { origin: true });
await fastify.register(bitmothRoutes);
await fastify.register(pokedexRoutes);

try {
  await initDb();
  await initPokedex();
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`\n🦋  Bitmoth Server  →  http://localhost:${PORT}\n`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
