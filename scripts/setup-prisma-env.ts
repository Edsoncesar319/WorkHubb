#!/usr/bin/env tsx
/**
 * Sincroniza DATABASE_URL e DIRECT_DATABASE_URL para desenvolvimento local.
 * Execute após: vercel env pull .env.development.local
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { resolveDatabaseUrls } from '../lib/db/env';

const envFiles = ['.env.development.local', '.env.local', '.env'];

let envFile: string | null = null;
let envContent = '';

for (const file of envFiles) {
  const path = join(process.cwd(), file);
  if (existsSync(path)) {
    envFile = file;
    envContent = readFileSync(path, 'utf-8');
    console.log(`📄 ${file}\n`);
    break;
  }
}

if (!envFile) {
  console.log('❌ Nenhum .env encontrado. Execute: vercel env pull .env.development.local');
  process.exit(1);
}

// Carregar no process.env para resolveDatabaseUrls
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) {
    const val = m[2].trim().replace(/^["']|["']$/g, '');
    process.env[m[1]] = val;
  }
}

const { databaseUrl, directDatabaseUrl, source, directSource } =
  resolveDatabaseUrls();

if (!databaseUrl) {
  console.log('❌ Nenhuma URL Postgres encontrada.');
  console.log('\nNa Vercel: Storage → Postgres (Neon) → Connect to Project');
  console.log('Depois: vercel env pull .env.development.local\n');
  process.exit(1);
}

function setOrAdd(name: string, value: string) {
  const re = new RegExp(`^${name}=.*$`, 'm');
  const line = `${name}="${value}"`;
  if (re.test(envContent)) {
    envContent = envContent.replace(re, line);
  } else {
    envContent += `\n${line}\n`;
  }
}

setOrAdd('DATABASE_URL', databaseUrl);
if (directDatabaseUrl) setOrAdd('DIRECT_DATABASE_URL', directDatabaseUrl);

writeFileSync(join(process.cwd(), envFile), envContent, 'utf-8');

console.log(`✅ DATABASE_URL ← ${source}`);
if (directDatabaseUrl)
  console.log(`✅ DIRECT_DATABASE_URL ← ${directSource}`);

try {
  const host = new URL(databaseUrl.replace(/^prisma\+/, '')).hostname;
  if (host === 'db.prisma.io' || databaseUrl.startsWith('prisma+')) {
    console.log('\n⚠️  ATENÇÃO: URL legada Prisma Postgres detectada.');
    console.log('   Para produção na Vercel, crie Storage → Postgres (Neon), não db.prisma.io.');
    console.log('   Depois: vercel env pull && npm run prisma:setup-env\n');
  }
} catch {
  /* ignore */
}

console.log(`\n💾 Salvo em ${envFile}`);
console.log('\nPróximo: npm run db:validate && npm run dev\n');
