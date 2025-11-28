import postgres from 'postgres';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Simple env loader so scripts run via tsx can read .env.* files
 */
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

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Nenhuma variável POSTGRES_URL/POSTGRES_URL_NON_POOLING/DATABASE_URL encontrada.');
  console.error('Execute `vercel env pull` ou defina manualmente antes de rodar este script.');
  process.exit(1);
}

const sqlFilePath = path.resolve(process.cwd(), 'scripts/create-postgres-tables.sql');
if (!existsSync(sqlFilePath)) {
  console.error('❌ Arquivo scripts/create-postgres-tables.sql não encontrado.');
  process.exit(1);
}

const fileContent = readFileSync(sqlFilePath, 'utf-8');
const sanitizedContent = fileContent
  .split(/\r?\n/)
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

const statements = sanitizedContent
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

async function main() {
  const sql = postgres(connectionString, { ssl: 'require' });
  let executed = 0;

  try {
    for (const statement of statements) {
      await sql.unsafe(statement);
      executed += 1;
    }
    console.log(`✅ Sincronização concluída. ${executed} statements executados.`);
  } catch (error) {
    console.error('❌ Erro ao sincronizar o schema do Postgres:', error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();

