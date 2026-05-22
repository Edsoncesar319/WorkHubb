#!/usr/bin/env tsx
/**
 * Script para configurar DATABASE_URL para Prisma baseado em POSTGRES_URL
 * Execute: tsx scripts/setup-prisma-env.ts
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

// Encontrar arquivo .env existente
for (const file of envFiles) {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    envFile = file;
    envContent = readFileSync(filePath, 'utf-8');
    console.log(`📄 Arquivo encontrado: ${file}\n`);
    break;
  }
}

if (!envFile) {
  console.log('⚠️  Nenhum arquivo .env encontrado.');
  console.log('📝 Criando .env.local...\n');
  envFile = '.env.local';
  envContent = '';
}

// Verificar se POSTGRES_URL existe
const postgresUrlMatch = envContent.match(/^POSTGRES_URL=(.+)$/m);
const postgresUrlNonPoolingMatch = envContent.match(
  /^POSTGRES_URL_NON_POOLING=(.+)$/m
);

if (!postgresUrlMatch) {
  console.log(
    '❌ POSTGRES_URL não encontrado no arquivo .env'
  );
  console.log('\n💡 Execute primeiro: vercel env pull .env.development.local\n');
  process.exit(1);
}

const postgresUrl = postgresUrlMatch[1].trim().replace(/^["']|["']$/g, '');
const postgresUrlNonPooling =
  postgresUrlNonPoolingMatch?.[1]
    .trim()
    .replace(/^["']|["']$/g, '') || postgresUrl;

// Verificar se DATABASE_URL já existe
const hasDatabaseUrl = /^DATABASE_URL=/m.test(envContent);

if (hasDatabaseUrl) {
  // Atualizar DATABASE_URL existente
  envContent = envContent.replace(
    /^DATABASE_URL=.*$/m,
    `DATABASE_URL="${postgresUrl}"`
  );
  console.log('✅ DATABASE_URL atualizado');
} else {
  // Adicionar DATABASE_URL
  envContent += `\n# Prisma Database URL\nDATABASE_URL="${postgresUrl}"\n`;
  console.log('✅ DATABASE_URL adicionado');
}

// Verificar POSTGRES_URL_NON_POOLING
if (!postgresUrlNonPoolingMatch) {
  envContent += `POSTGRES_URL_NON_POOLING="${postgresUrlNonPooling}"\n`;
  console.log('✅ POSTGRES_URL_NON_POOLING adicionado');
}

// Salvar arquivo
const filePath = join(process.cwd(), envFile);
writeFileSync(filePath, envContent, 'utf-8');

console.log(`\n✨ Configuração concluída em ${envFile}`);
console.log('\n📋 Próximos passos:');
console.log('1. Execute: npm run prisma:generate');
console.log('2. Execute: npm run prisma:push (ou prisma:migrate)');
console.log('\n');

