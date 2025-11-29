#!/usr/bin/env tsx
/**
 * Script para verificar a configuração do Postgres
 * Execute: npx tsx scripts/check-postgres-config.ts
 */

import { existsSync, readFileSync } from 'fs';
import path from 'path';

function loadEnvFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, value] = match;
    if (!(key in process.env)) {
      process.env[key] = value.replace(/^"|"$/g, '');
    }
  }
}

['.env.development.local', '.env.local', '.env'].forEach(loadEnvFile);

console.log('🔍 Verificando configuração do Postgres...\n');

const allUrls = {
  'POSTGRES_URL_NON_POOLING': process.env.POSTGRES_URL_NON_POOLING,
  'WORKHUB_POSTGRES_URL_NON_POOLING': process.env.WORKHUB_POSTGRES_URL_NON_POOLING,
  'POSTGRES_URL': process.env.POSTGRES_URL,
  'WORKHUB_POSTGRES_URL': process.env.WORKHUB_POSTGRES_URL,
  'DATABASE_URL': process.env.DATABASE_URL,
  'WORKHUB_DATABASE_URL': process.env.WORKHUB_DATABASE_URL,
  'POSTGRES_PRISMA_URL': process.env.POSTGRES_PRISMA_URL,
  'WORKHUB_PRISMA_DATABASE_URL': process.env.WORKHUB_PRISMA_DATABASE_URL,
};

const directPostgresUrls: string[] = [];
const prismaAccelerateUrls: string[] = [];

for (const [key, url] of Object.entries(allUrls)) {
  if (!url) continue;
  
  const maskedUrl = url.replace(/:[^:@]+@/, ':****@');
  
  if (url.includes('prisma.io') || url.includes('prisma-data.net') || url.startsWith('prisma+')) {
    prismaAccelerateUrls.push(`${key}: ${maskedUrl}`);
  } else if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    directPostgresUrls.push(`${key}: ${maskedUrl}`);
  }
}

console.log('✅ URLs diretas do Postgres encontradas:');
if (directPostgresUrls.length > 0) {
  directPostgresUrls.forEach(url => console.log(`  - ${url}`));
} else {
  console.log('  ❌ Nenhuma URL direta do Postgres encontrada!');
}

console.log('\n⚠️  URLs do Prisma Accelerate (não compatíveis com postgres-js):');
if (prismaAccelerateUrls.length > 0) {
  prismaAccelerateUrls.forEach(url => console.log(`  - ${url}`));
} else {
  console.log('  ✓ Nenhuma');
}

console.log('\n📋 Recomendações:');
if (directPostgresUrls.length === 0) {
  console.log('❌ Você precisa configurar uma URL direta do Postgres.');
  console.log('\n1. Acesse: https://vercel.com/dashboard');
  console.log('2. Vá em Storage > Create Database > Postgres');
  console.log('3. Crie um banco e conecte ao seu projeto');
  console.log('4. Execute: vercel env pull .env.development.local');
  console.log('\nOu configure manualmente POSTGRES_URL_NON_POOLING com uma URL direta do Postgres.');
} else {
  console.log('✅ Você tem URLs diretas do Postgres configuradas!');
  console.log('O sistema deve funcionar corretamente.');
}

