#!/usr/bin/env tsx
/**
 * Copia URLs Neon de .env.development.local para a Vercel (Production + Preview).
 * Use após: vercel env pull .env.development.local && npm run prisma:setup-env
 */
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { resolveDatabaseUrls } from '../lib/db/env';

const envFile = join(process.cwd(), '.env.development.local');
if (!existsSync(envFile)) {
  console.error('❌ Crie .env.development.local (vercel env pull + prisma:setup-env)');
  process.exit(1);
}

for (const line of readFileSync(envFile, 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const { databaseUrl, directDatabaseUrl } = resolveDatabaseUrls();
if (!databaseUrl) {
  console.error('❌ Nenhuma URL Postgres em .env.development.local');
  process.exit(1);
}

const direct = directDatabaseUrl || databaseUrl;
const entries: [string, string][] = [
  ['DATABASE_URL', databaseUrl],
  ['POSTGRES_PRISMA_URL', databaseUrl],
  ['POSTGRES_URL', databaseUrl],
  ['POSTGRES_URL_NON_POOLING', direct],
  ['DATABASE_URL_UNPOOLED', direct],
];

const targets = ['production', 'preview'] as const;

for (const envName of targets) {
  console.log(`\n📤 ${envName}`);
  for (const [name, value] of entries) {
    try {
      execSync(`npx vercel env add ${name} ${envName} --force --sensitive`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit'],
        cwd: process.cwd(),
      });
      console.log(`   ✅ ${name}`);
    } catch {
      console.error(`   ❌ ${name}`);
      process.exit(1);
    }
  }
}

console.log('\n✅ Variáveis padrão Neon na Vercel. Rode: npx vercel deploy --prod\n');
