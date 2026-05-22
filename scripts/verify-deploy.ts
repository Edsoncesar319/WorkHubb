#!/usr/bin/env tsx
import { existsSync, readFileSync } from 'fs';

const checks: Array<{ name: string; check: () => boolean; message: string }> = [
  {
    name: 'package.json',
    check: () => existsSync('package.json'),
    message: '❌ package.json',
  },
  {
    name: 'vercel.json + vercel-build',
    check: () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      return (
        existsSync('vercel.json') &&
        pkg.scripts?.['vercel-build']?.includes('migrate deploy')
      );
    },
    message: '❌ vercel-build deve incluir prisma migrate deploy',
  },
  {
    name: 'prisma/schema.prisma',
    check: () => existsSync('prisma/schema.prisma'),
    message: '❌ prisma/schema.prisma',
  },
  {
    name: 'prisma/migrations',
    check: () => existsSync('prisma/migrations/20250522000000_init/migration.sql'),
    message: '❌ migration inicial',
  },
  {
    name: 'lib/db/queries.ts (Prisma)',
    check: () => {
      const q = readFileSync('lib/db/queries.ts', 'utf-8');
      return q.includes("from './prisma'") && !q.includes('drizzle-orm');
    },
    message: '❌ queries deve usar Prisma',
  },
  {
    name: '@prisma/client',
    check: () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
      return !!pkg.dependencies?.['@prisma/client'];
    },
    message: '❌ @prisma/client',
  },
];

console.log('🔍 Verificação deploy Vercel\n');
let ok = true;
for (const c of checks) {
  if (c.check()) console.log(`✅ ${c.name}`);
  else {
    console.log(c.message);
    ok = false;
  }
}
console.log(ok ? '\n✅ Pronto para deploy\n' : '\n❌ Corrija antes do deploy\n');
process.exit(ok ? 0 : 1);
