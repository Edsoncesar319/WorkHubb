import { config } from 'dotenv';
import { existsSync } from 'fs';

async function main() {
  for (const f of ['.env.development.local', '.env.local', '.env']) {
    if (existsSync(f)) {
      config({ path: f });
      console.log(`Loaded ${f}`);
    }
  }

  const { getDatabaseConfigStatus, ensureDatabaseEnv } = await import('../lib/db/env');
  ensureDatabaseEnv();
  const status = getDatabaseConfigStatus();

  console.log('\nStatus:', JSON.stringify(status, null, 2));
  if (!status.ok) process.exit(1);

  const { prisma } = await import('../lib/db/prisma');
  await prisma.$queryRaw`SELECT 1`;
  console.log('\n✅ OK');
  await prisma.$disconnect();
}

main();
