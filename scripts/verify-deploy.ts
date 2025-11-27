#!/usr/bin/env tsx
/**
 * Script para verificar se o projeto está pronto para deploy na Vercel
 * Execute: npx tsx scripts/verify-deploy.ts
 */

import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

const checks: Array<{ name: string; check: () => boolean; message: string }> = [];

// Verificar se package.json existe
checks.push({
  name: 'package.json',
  check: () => existsSync('package.json'),
  message: '❌ package.json não encontrado'
});

// Verificar se next.config.mjs existe
checks.push({
  name: 'next.config.mjs',
  check: () => existsSync('next.config.mjs'),
  message: '❌ next.config.mjs não encontrado'
});

// Verificar se vercel.json existe
checks.push({
  name: 'vercel.json',
  check: () => existsSync('vercel.json'),
  message: '❌ vercel.json não encontrado'
});

// Verificar dependências críticas
checks.push({
  name: 'Dependências críticas',
  check: () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const required = ['next', 'react', 'react-dom', '@vercel/postgres', 'drizzle-orm'];
    return required.every(dep => deps[dep]);
  },
  message: '❌ Algumas dependências críticas estão faltando'
});

// Verificar se lib/db/index.ts existe
checks.push({
  name: 'lib/db/index.ts',
  check: () => existsSync('lib/db/index.ts'),
  message: '❌ lib/db/index.ts não encontrado'
});

// Verificar se lib/db/schema-pg.ts existe (necessário para Postgres)
checks.push({
  name: 'lib/db/schema-pg.ts',
  check: () => existsSync('lib/db/schema-pg.ts'),
  message: '❌ lib/db/schema-pg.ts não encontrado (necessário para Postgres)'
});

// Verificar se scripts/create-postgres-tables.sql existe
checks.push({
  name: 'scripts/create-postgres-tables.sql',
  check: () => existsSync('scripts/create-postgres-tables.sql'),
  message: '❌ scripts/create-postgres-tables.sql não encontrado'
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
  console.log('1. Certifique-se de que o Postgres está criado na Vercel');
  console.log('2. Execute o script SQL em scripts/create-postgres-tables.sql no console do Postgres');
  console.log('3. Verifique se POSTGRES_URL está configurada automaticamente');
  console.log('4. Faça o deploy: vercel --prod');
  console.log('\n📖 Consulte DEPLOY_GUIDE.md para instruções detalhadas');
} else {
  console.log('\n❌ Algumas verificações falharam. Corrija os problemas antes de fazer o deploy.');
  process.exit(1);
}

