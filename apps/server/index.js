import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDb } from './src/db/index.js';
import { bitmothRoutes } from './src/routes/bitmoth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.SERVER_PORT || '3000');

const fastify = Fastify({ logger: { level: 'warn' } });

await fastify.register(cors, { origin: true });
await fastify.register(staticFiles, {
  root: join(__dirname, 'public'),
  prefix: '/',
});
await fastify.register(bitmothRoutes);

try {
  await initDb();
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`\n🦋  Bitmoth 彼魔  →  http://localhost:${PORT}\n`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
