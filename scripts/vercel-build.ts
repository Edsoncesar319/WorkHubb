#!/usr/bin/env tsx
/**
 * Build na Vercel: normaliza env Neon e executa Prisma + Next no mesmo processo.
 */
import { execSync } from 'child_process';
import { resolveDatabaseUrls } from '../lib/db/env';

execSync('npx tsx scripts/sync-prisma-env.ts', { stdio: 'inherit' });

const { databaseUrl, directDatabaseUrl } = resolveDatabaseUrls();

if (!databaseUrl) {
  console.error(
    '❌ Build: nenhuma URL Postgres. Vercel → Storage → Postgres (Neon) → Connect to Project.'
  );
  process.exit(1);
}

const direct =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  directDatabaseUrl ||
  databaseUrl;

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || databaseUrl,
  POSTGRES_URL_NON_POOLING: direct,
};

const run = (cmd: string) => {
  console.log(`\n▶ ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', env });
};

run('npx prisma generate');
run('npx prisma migrate deploy');
run('npx next build');
