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
  const isPostinstall = process.env.npm_lifecycle_event === 'postinstall';

  // postinstall: só precisa gerar o client — placeholder evita falha no npm install
  if (onVercel && isPostinstall) {
    const placeholder =
      'postgresql://build:build@127.0.0.1:5432/build?schema=public';
    writeFileSync(
      join(process.cwd(), '.env'),
      `DATABASE_URL="${placeholder}"\nPOSTGRES_URL_NON_POOLING="${placeholder}"\n`,
      'utf-8'
    );
    console.warn(
      '⚠️  postinstall: Postgres não ligado ao projeto — placeholder para prisma generate.'
    );
    console.warn(
      '   Vercel → Storage → Postgres (Neon) → Connect to Project → Production.'
    );
    process.exit(0);
  }

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
