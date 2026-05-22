#!/usr/bin/env tsx
/**
 * Grava `.env` para o Prisma CLI (generate / migrate) na Vercel e local.
 */
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ensureDatabaseEnv, resolveDatabaseUrls } from '../lib/db/env';

ensureDatabaseEnv();

const { databaseUrl, directDatabaseUrl } = resolveDatabaseUrls();

if (!databaseUrl) {
  const onVercel = process.env.VERCEL === '1';
  if (onVercel) {
    console.error(
      '❌ Postgres não configurado. Vercel → Storage → Postgres (Neon) → Connect to Project.'
    );
    process.exit(1);
  }
  console.warn('⚠️  sync-prisma-env: sem DATABASE_URL (ok em dev sem .env)');
  process.exit(0);
}

const direct =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  directDatabaseUrl ||
  databaseUrl;

const lines = [
  `DATABASE_URL="${databaseUrl.replace(/"/g, '\\"')}"`,
  `POSTGRES_URL_NON_POOLING="${direct.replace(/"/g, '\\"')}"`,
  `POSTGRES_PRISMA_URL="${(process.env.POSTGRES_PRISMA_URL || databaseUrl).replace(/"/g, '\\"')}"`,
];

const envPath = join(process.cwd(), '.env');
const preserveLocal =
  !process.env.VERCEL && existsSync(envPath) && existsSync('.env.development.local');

if (!preserveLocal) {
  writeFileSync(envPath, lines.join('\n') + '\n', 'utf-8');
  console.log('✅ .env sincronizado para Prisma');
}
