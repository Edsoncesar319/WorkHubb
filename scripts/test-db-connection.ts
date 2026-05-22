#!/usr/bin/env tsx
/**
 * Script para testar conexão com o banco de dados
 * Execute: tsx scripts/test-db-connection.ts
 */

import { existsSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente antes de lib/db/env
['.env.development.local', '.env.local', '.env'].forEach((file) => {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    dotenv.config({ path: filePath });
    console.log(`✅ Carregado: ${file}`);
  }
});

import { getPostgresPoolUrl } from '../lib/db/env';

console.log('\n🔍 Diagnóstico de Conexão do Banco de Dados\n');

// Verificar variáveis
const vars = {
  DATABASE_URL: process.env.DATABASE_URL,
  POSTGRES_URL: process.env.POSTGRES_URL,
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
  WORKHUB_POSTGRES_URL: process.env.WORKHUB_POSTGRES_URL,
  WORKHUB_DATABASE_URL: process.env.WORKHUB_DATABASE_URL,
};

console.log('📋 Variáveis de Ambiente:');
Object.entries(vars).forEach(([key, value]) => {
  if (value) {
    const masked = value.replace(/:[^:@]+@/, ':****@');
    const isPrismaAccelerate = value.includes('db.prisma.io') || value.includes('prisma-data.net');
    console.log(`  ${key}: ${masked} ${isPrismaAccelerate ? '⚠️ (Prisma Accelerate)' : '✅'}`);
  } else {
    console.log(`  ${key}: ❌ não definida`);
  }
});

// Detectar tipo de URL (após normalização em lib/db/env)
const connectionString = getPostgresPoolUrl();

if (!connectionString) {
  console.log('\n❌ ERRO: Nenhuma variável de conexão encontrada!');
  console.log('\n💡 Solução:');
  console.log('1. Execute: vercel env pull .env.development.local');
  console.log('2. Ou defina manualmente DATABASE_URL no .env');
  process.exit(1);
}

const isPrismaAccelerate = 
  connectionString.includes('db.prisma.io') || 
  connectionString.includes('prisma-data.net') ||
  connectionString.startsWith('prisma+');

console.log('\n🔧 Tipo de Conexão:');
if (isPrismaAccelerate) {
  console.log('  ⚠️  URL do Prisma Accelerate detectada');
  console.log('  💡 Recomendação: Use uma URL direta do Vercel Postgres para melhor compatibilidade');
} else {
  console.log('  ✅ URL direta do Postgres');
}

// Testar conexão com @vercel/postgres
console.log('\n🧪 Testando conexão com @vercel/postgres...');
try {
  const { createPool } = await import('@vercel/postgres');
  const pool = createPool({ connectionString: connectionString! });
  const result = await pool.sql`SELECT NOW() as current_time`;
  console.log('  ✅ Conexão bem-sucedida!');
  console.log(`  ⏰ Hora do servidor: ${result.rows[0]?.current_time}`);
} catch (error: any) {
  console.log('  ❌ Falha na conexão:');
  console.log(`     ${error?.message || error}`);
  console.log('\n💡 Possíveis soluções:');
  console.log('  1. Configure POSTGRES_URL explicitamente');
  console.log('  2. Use uma URL direta do Vercel Postgres (não Prisma Accelerate)');
  console.log('  3. Considere usar Prisma Client diretamente');
}

// Testar conexão com Prisma (se disponível)
console.log('\n🧪 Testando conexão com Prisma...');
try {
  const { prisma } = await import('../lib/db/prisma');
  const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
  console.log('  ✅ Conexão bem-sucedida!');
  if (result && Array.isArray(result) && result[0]) {
    console.log(`  ⏰ Hora do servidor: ${(result[0] as any).current_time}`);
  }
  await prisma.$disconnect();
} catch (error: any) {
  console.log('  ❌ Falha na conexão:');
  console.log(`     ${error?.message || error}`);
  console.log('\n💡 Verifique:');
  console.log('  1. Se o Prisma Client foi gerado: npm run prisma:generate');
  console.log('  2. Se DATABASE_URL está configurada corretamente');
}

console.log('\n✅ Diagnóstico concluído!\n');

