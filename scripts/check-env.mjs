import { config } from 'dotenv';
import { existsSync } from 'fs';

for (const f of ['.env.development.local', '.env.local', '.env']) {
  if (existsSync(f)) config({ path: f });
}

await import('../lib/db/env.ts');

const { getPostgresPoolUrl } = await import('../lib/db/env.ts');

const keys = Object.keys(process.env).filter((k) =>
  /POSTGRES|DATABASE|WORKHUB/i.test(k)
);

console.log('Env keys found:');
for (const k of keys.sort()) {
  const v = process.env[k] || '';
  const kind = v.startsWith('postgresql')
    ? 'postgresql'
    : v.startsWith('postgres')
      ? 'postgres'
      : v.startsWith('prisma')
        ? 'prisma'
        : v ? 'other' : 'empty';
  console.log(`  ${k}: ${kind} (len=${v.length})`);
}

const pool = getPostgresPoolUrl();
console.log('\ngetPostgresPoolUrl():', pool ? `${pool.slice(0, 40)}...` : 'UNDEFINED');
console.log('POSTGRES_URL set:', !!process.env.POSTGRES_URL);
