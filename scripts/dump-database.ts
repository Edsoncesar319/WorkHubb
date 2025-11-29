#!/usr/bin/env tsx
/**
 * Script para fazer dump do banco de dados Postgres
 * Execute: npx tsx scripts/dump-database.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import postgres from 'postgres';

function loadEnvFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, value] = match;
    if (!(key in process.env)) {
      process.env[key] = value.replace(/^"|"$/g, '');
    }
  }
}

['.env.development.local', '.env.local', '.env'].forEach(loadEnvFile);

// Priorizar URLs que NÃO sejam do Prisma Accelerate
const connectionString =
  [process.env.POSTGRES_URL_NON_POOLING, 
   process.env.WORKHUB_POSTGRES_URL_NON_POOLING,
   process.env.POSTGRES_URL,
   process.env.WORKHUB_POSTGRES_URL,
   process.env.DATABASE_URL,
   process.env.WORKHUB_DATABASE_URL]
    .find(url => url && !url.includes('prisma.io') && !url.includes('prisma-data.net') && !url.startsWith('prisma+')) ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.WORKHUB_POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.WORKHUB_POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.WORKHUB_DATABASE_URL;

if (!connectionString) {
  console.error('❌ Nenhuma URL de conexão do Postgres encontrada.');
  console.error('Configure POSTGRES_URL_NON_POOLING com uma URL direta do Postgres.');
  process.exit(1);
}

const isPrismaUrl = connectionString.includes('prisma.io') || connectionString.includes('prisma-data.net');
if (isPrismaUrl) {
  console.error('❌ Erro: URL do Prisma Accelerate não funciona com pg_dump.');
  console.error('Você precisa de uma URL direta do Postgres (postgres://...)');
  console.error('Obtenha a URL direta no dashboard da Vercel: Storage > Postgres > Settings > Connection String');
  process.exit(1);
}

async function dumpDatabase() {
  console.log('🔄 Conectando ao banco de dados...');
  const sql = postgres(connectionString, { 
    ssl: 'require',
    max: 1 
  });

  try {
    // Testar conexão
    await sql`SELECT 1`;
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Obter lista de tabelas
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    console.log(`\n📊 Tabelas encontradas: ${tables.length}`);
    tables.forEach((table: any) => {
      console.log(`  - ${table.tablename}`);
    });
    
    // Obter schema das tabelas principais
    const schemaQueries = [
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'users' 
       ORDER BY ordinal_position;`,
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'jobs' 
       ORDER BY ordinal_position;`,
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'applications' 
       ORDER BY ordinal_position;`,
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'experiences' 
       ORDER BY ordinal_position;`,
    ];
    
    console.log('\n📋 Schema das tabelas principais:');
    for (const query of schemaQueries) {
      try {
        const result = await sql.unsafe(query);
        if (result.length > 0) {
          const tableName = result[0]?.table_name || 'unknown';
          console.log(`\n  ${tableName}:`);
          result.forEach((col: any) => {
            console.log(`    - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
          });
        }
      } catch (e) {
        // Ignorar se tabela não existir
      }
    }
    
    console.log('\n✅ Informações do banco obtidas com sucesso!');
    console.log('\n💡 Para fazer um dump completo, use o comando pg_dump:');
    console.log('   pg_dump -Fc -v -d <DATABASE_URL> -n public -f db_dump.bak');
    console.log(`\n   Substitua <DATABASE_URL> pela URL direta do Postgres.`);
    
  } catch (error: any) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

dumpDatabase();

