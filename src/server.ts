import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const app = createApp();
const server = app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
