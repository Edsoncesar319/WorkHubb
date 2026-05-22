#!/usr/bin/env tsx
/**
 * Configura DATABASE_URL para Prisma (Prisma Postgres / Vercel)
 * Execute: npm run prisma:setup-env
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const envFiles = [
  '.env.local',
  '.env.development.local',
  '.env',
  '.env.development',
];

console.log('🔧 Configurando DATABASE_URL para Prisma...\n');

let envFile: string | null = null;
let envContent = '';

for (const file of envFiles) {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    envFile = file;
    envContent = readFileSync(filePath, 'utf-8');
    console.log(`📄 Arquivo: ${file}\n`);
    break;
  }
}

if (!envFile) {
  console.log('⚠️  Nenhum .env encontrado. Criando .env.local...');
  envFile = '.env.local';
  envContent = '';
}

function readEnvValue(content: string, names: string[]): string | undefined {
  for (const name of names) {
    const match = content.match(new RegExp(`^${name}=(.+)$`, 'm'));
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return undefined;
}

// Prisma Postgres: preferir prisma+postgres:// (Accelerate/Data Proxy)
const prismaDatabaseUrl = readEnvValue(envContent, [
  'WORKHUB_PRISMA_DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'DATABASE_URL',
]);

const directUrl = readEnvValue(envContent, [
  'WORKHUB_POSTGRES_URL',
  'POSTGRES_URL',
  'WORKHUB_DATABASE_URL',
]);

if (!prismaDatabaseUrl && !directUrl) {
  console.log('❌ Nenhuma URL de banco encontrada.');
  console.log('\n💡 Execute: vercel env pull .env.development.local\n');
  process.exit(1);
}

const databaseUrl =
  prismaDatabaseUrl?.startsWith('prisma+') ? prismaDatabaseUrl : prismaDatabaseUrl || directUrl;

const postgresUrlNonPooling =
  readEnvValue(envContent, [
    'POSTGRES_URL_NON_POOLING',
    'WORKHUB_POSTGRES_URL_NON_POOLING',
  ]) || directUrl || databaseUrl;

if (/^postgres/.test(databaseUrl || '') && !databaseUrl?.startsWith('prisma+')) {
  console.log('⚠️  URL postgres:// para db.prisma.io detectada.');
  console.log('   Use WORKHUB_PRISMA_DATABASE_URL (prisma+postgres://) no Prisma Dashboard.\n');
}

if (hasDatabaseUrl(envContent)) {
  envContent = envContent.replace(
    /^DATABASE_URL=.*$/m,
    `DATABASE_URL="${databaseUrl}"`
  );
  console.log('✅ DATABASE_URL atualizado');
} else {
  envContent += `\n# Prisma\nDATABASE_URL="${databaseUrl}"\n`;
  console.log('✅ DATABASE_URL adicionado');
}

if (!/^POSTGRES_URL=/m.test(envContent) && directUrl) {
  envContent += `POSTGRES_URL="${directUrl}"\n`;
  console.log('✅ POSTGRES_URL adicionado (directUrl / migrations)');
}

if (!/^POSTGRES_URL_NON_POOLING=/m.test(envContent)) {
  envContent += `POSTGRES_URL_NON_POOLING="${postgresUrlNonPooling}"\n`;
  console.log('✅ POSTGRES_URL_NON_POOLING adicionado');
}

writeFileSync(join(process.cwd(), envFile), envContent, 'utf-8');

console.log(`\n✨ Salvo em ${envFile}`);
console.log('\n📋 Próximos passos:');
console.log('1. Se aparecer erro P6002 (API key inválida):');
console.log('   Vercel → Storage → Prisma Postgres → .env.local → copie WORKHUB_PRISMA_DATABASE_URL');
console.log('2. npm run prisma:generate');
console.log('3. npm run prisma:push');
console.log('4. npm run db:check\n');

function hasDatabaseUrl(content: string): boolean {
  return /^DATABASE_URL=/m.test(content);
}
