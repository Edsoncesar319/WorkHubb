#!/usr/bin/env tsx
/**
 * Valida WORKHUB_PRISMA_DATABASE_URL e testa conexão.
 * Execute: npm run db:validate
 */
import { config } from 'dotenv';
import { existsSync } from 'fs';

async function main() {
  for (const f of ['.env.development.local', '.env.local', '.env']) {
    if (existsSync(f)) config({ path: f });
  }

  const prismaUrl = process.env.WORKHUB_PRISMA_DATABASE_URL?.replace(
    /^["']|["']$/g,
    ''
  );
  const databaseUrl = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '');

  console.log('\n🔍 Validação Prisma Postgres\n');

  if (!prismaUrl) {
    console.log('❌ WORKHUB_PRISMA_DATABASE_URL não encontrada');
    console.log('\n📋 Como corrigir:');
    console.log('1. vercel.com → projeto → Storage → Prisma Postgres');
    console.log('2. Connect to Project');
    console.log('3. vercel env pull .env.development.local');
    console.log('4. npm run prisma:setup-env\n');
    process.exit(1);
  }

  console.log(
    'WORKHUB_PRISMA_DATABASE_URL:',
    prismaUrl.startsWith('prisma+') ? 'prisma+ ✅' : '⚠️  deveria ser prisma+postgres://'
  );
  console.log(
    'DATABASE_URL:',
    databaseUrl?.startsWith('prisma+')
      ? 'prisma+ ✅'
      : databaseUrl
        ? '⚠️  diferente de prisma+'
        : '❌ ausente'
  );

  if (!databaseUrl?.startsWith('prisma+')) {
    console.log('\n💡 Execute: npm run prisma:setup-env\n');
  }

  process.env.DATABASE_URL = prismaUrl;

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    console.log('\n✅ Conexão OK — API key válida\n');
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || String(e);
    console.log('\n❌ Conexão falhou\n');
    if (msg.includes('P6002') || msg.includes('API key')) {
      console.log('Causa: API key do Prisma Postgres EXPIRADA ou INVÁLIDA.\n');
      console.log('Correção (obrigatória):');
      console.log('1. Vercel → Storage → Prisma Postgres → reconecte ao projeto');
      console.log('2. vercel env pull .env.development.local');
      console.log('3. npm run prisma:setup-env');
      console.log('4. Reinicie: npm run dev\n');
    } else {
      console.log(msg.slice(0, 300));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
