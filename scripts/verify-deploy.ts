#!/usr/bin/env tsx
/**
 * Verifica se o projeto está pronto para deploy na Vercel
 * Execute: npx tsx scripts/verify-deploy.ts
 */

import { existsSync, readFileSync } from 'fs';

const checks: Array<{ name: string; check: () => boolean; message: string }> =
  [];

checks.push({
  name: 'package.json',
  check: () => existsSync('package.json'),
  message: '❌ package.json não encontrado',
});

checks.push({
  name: 'next.config.mjs',
  check: () => existsSync('next.config.mjs'),
  message: '❌ next.config.mjs não encontrado',
});

checks.push({
  name: 'vercel.json',
  check: () => existsSync('vercel.json'),
  message: '❌ vercel.json não encontrado',
});

checks.push({
  name: 'prisma/schema.prisma',
  check: () => existsSync('prisma/schema.prisma'),
  message: '❌ prisma/schema.prisma não encontrado',
});

checks.push({
  name: 'lib/db/env.ts',
  check: () => existsSync('lib/db/env.ts'),
  message: '❌ lib/db/env.ts não encontrado (aliases Vercel Postgres)',
});

checks.push({
  name: 'Dependências críticas',
  check: () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const required = [
      'next',
      'react',
      'react-dom',
      '@vercel/postgres',
      '@prisma/client',
      'prisma',
      'drizzle-orm',
    ];
    return required.every((dep) => deps[dep]);
  },
  message: '❌ Algumas dependências críticas estão faltando',
});

checks.push({
  name: 'Scripts de build Vercel',
  check: () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    return (
      pkg.scripts?.postinstall?.includes('prisma generate') &&
      (pkg.scripts?.['vercel-build']?.includes('prisma generate') ||
        pkg.scripts?.build?.includes('prisma generate'))
    );
  },
  message:
    '❌ postinstall/vercel-build devem incluir prisma generate',
});

checks.push({
  name: 'lib/db/index.ts',
  check: () => existsSync('lib/db/index.ts'),
  message: '❌ lib/db/index.ts não encontrado',
});

checks.push({
  name: 'scripts/create-postgres-tables.sql',
  check: () => existsSync('scripts/create-postgres-tables.sql'),
  message: '❌ scripts/create-postgres-tables.sql não encontrado',
});

console.log('🔍 Verificando configuração para deploy na Vercel...\n');

let allPassed = true;

for (const { name, check, message } of checks) {
  const passed = check();
  if (passed) {
    console.log(`✅ ${name}`);
  } else {
    console.log(message);
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('\n✅ Todas as verificações passaram!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Crie/conecte Vercel Postgres ao projeto');
  console.log('2. Execute scripts/create-postgres-tables.sql (ou npm run prisma:push)');
  console.log('3. (Opcional) Conecte Vercel Blob para uploads');
  console.log('4. Deploy: vercel --prod ou push no Git');
  console.log('\n📖 Consulte VERCEL_SETUP.md');
} else {
  console.log(
    '\n❌ Algumas verificações falharam. Corrija antes do deploy.'
  );
  process.exit(1);
}
