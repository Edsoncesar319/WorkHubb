import { config } from 'dotenv';
import { existsSync } from 'fs';

async function main() {
  for (const f of ['.env.development.local', '.env.local', '.env']) {
    if (existsSync(f)) {
      config({ path: f });
      console.log(`Loaded ${f}`);
    }
  }

  const { ensureDatabaseEnv, getDatabaseConfigStatus } =
    await import('../lib/db/env');
  ensureDatabaseEnv();

  const status = getDatabaseConfigStatus();
  console.log('\nVariáveis:', status.varsPresent.join(', ') || '(nenhuma)');
  console.log('Modo:', status.mode);
  if (status.hint) console.log('Dica:', status.hint);

  if (!status.ok) process.exit(1);

  if (status.mode === 'prisma') {
    const { prisma } = await import('../lib/db/prisma');
    const r = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
    console.log('\n✅ Prisma Postgres OK:', r[0]);
    await prisma.$disconnect();
    return;
  }

  const { getPostgresPoolUrl } = await import('../lib/db/env');
  const pool = getPostgresPoolUrl()!;
  const postgres = (await import('postgres')).default;
  const sql = postgres(pool, { ssl: 'require', max: 1 });
  const r = await sql`SELECT 1 as ok`;
  console.log('\n✅ postgres-js OK:', r[0]);
  await sql.end();
}

main();
