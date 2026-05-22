#!/usr/bin/env tsx
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { getDatabaseConfigStatus, ensureDatabaseEnv } from '../lib/db/env';

async function main() {
  for (const f of ['.env.development.local', '.env.local', '.env']) {
    if (existsSync(f)) config({ path: f });
  }

  ensureDatabaseEnv();
  const status = getDatabaseConfigStatus();

  console.log('\n🔍 Diagnóstico do banco\n');
  console.log('Variáveis:', status.varsPresent.join(', ') || '(nenhuma)');
  console.log('Host:', status.host);
  console.log('Origem:', status.source);

  if (status.hint) console.log('\n⚠️ ', status.hint);

  if (!status.ok) {
    console.log('\n❌ DATABASE_URL não resolvida\n');
    process.exit(1);
  }

  if (status.host === 'db.prisma.io') {
    console.log('\n❌ db.prisma.io não é suportado de forma confiável.');
    console.log('   Use Vercel Postgres (Neon): host deve ser *.neon.tech\n');
    process.exit(1);
  }

  const { prisma } = await import('../lib/db/prisma');
  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    console.log('\n✅ Conexão Prisma OK — pronto para deploy\n');
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || String(e);
    console.log('\n❌ Falha:', msg.slice(0, 200));
    if (msg.includes('P6002') || msg.includes('API key')) {
      console.log('\n→ Troque para Vercel Postgres (Neon), não Prisma Postgres (db.prisma.io)\n');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
