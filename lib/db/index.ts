import { drizzle as drizzleWithVercel, type VercelPgDatabase } from 'drizzle-orm/vercel-postgres';
import { drizzle as drizzleWithPostgresJs, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql as vercelSql } from '@vercel/postgres';
import postgres from 'postgres';
import * as schema from './schema';

type Database = VercelPgDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __workhubbDb?: Database;
  __workhubbPgClient?: ReturnType<typeof postgres>;
};

// Priorizar URLs não-pooling para desenvolvimento local
// URLs do Prisma Accelerate (db.prisma.io) não funcionam com postgres-js diretamente
// Verificar variáveis padrão e com prefixo WORKHUB_
const connectionString =
  // Priorizar URLs que NÃO sejam do Prisma Accelerate
  [process.env.POSTGRES_URL_NON_POOLING, 
   process.env.WORKHUB_POSTGRES_URL_NON_POOLING,
   process.env.POSTGRES_URL,
   process.env.WORKHUB_POSTGRES_URL,
   process.env.DATABASE_URL,
   process.env.WORKHUB_DATABASE_URL]
    .find(url => url && !url.includes('prisma.io') && !url.includes('prisma-data.net') && !url.startsWith('prisma+')) ||
  // Se não encontrou URL direta, usar qualquer uma (mas vai dar erro depois)
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.WORKHUB_POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.WORKHUB_POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.WORKHUB_DATABASE_URL;

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;

// Detectar se estamos usando URLs do Prisma Accelerate
const isPrismaAccelerateUrl = connectionString ? (
  connectionString.includes('prisma.io') || 
  connectionString.includes('prisma-data.net') ||
  connectionString.startsWith('prisma+')
) : false;

function createDb(): Database {
  if (globalForDb.__workhubbDb) {
    return globalForDb.__workhubbDb;
  }

  // Usar @vercel/postgres em produção OU quando detectar URLs do Prisma Accelerate
  // porque @vercel/postgres funciona com essas URLs, mas postgres-js não
  if (isVercel || isPrismaAccelerateUrl) {
    if (isPrismaAccelerateUrl && !isVercel) {
      console.log('Using @vercel/postgres (compatible with Prisma Accelerate URLs)');
    } else {
      console.log('Using Vercel Postgres (serverless mode)');
    }
    const database = drizzleWithVercel(vercelSql, { schema });
    globalForDb.__workhubbDb = database;
    return database;
  }

  if (!connectionString) {
    throw new Error(
      'Postgres não configurado. Defina POSTGRES_URL (ou DATABASE_URL/POSTGRES_URL_NON_POOLING) no ambiente local.'
    );
  }

  // Log da configuração (sem expor a senha)
  const maskedUrl = connectionString.replace(/:[^:@]+@/, ':****@');
  
  console.log('Connecting to Postgres (direct connection):', {
    url: maskedUrl,
    hasPostgresUrl: !!(process.env.POSTGRES_URL || process.env.WORKHUB_POSTGRES_URL),
    hasPostgresUrlNonPooling: !!(process.env.POSTGRES_URL_NON_POOLING || process.env.WORKHUB_POSTGRES_URL_NON_POOLING),
    hasDatabaseUrl: !!(process.env.DATABASE_URL || process.env.WORKHUB_DATABASE_URL),
  });

  const disableSSL = process.env.POSTGRES_DISABLE_SSL === '1';
  const maxConnections = Number.parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '5', 10);

  try {
    const client = postgres(connectionString, {
      ssl: disableSSL ? false : 'require',
      max: Number.isNaN(maxConnections) ? 5 : maxConnections,
      onnotice: () => {}, // Silenciar avisos do Postgres
    });

    globalForDb.__workhubbPgClient = client;
    const database = drizzleWithPostgresJs(client, { schema });
    globalForDb.__workhubbDb = database;
    console.log('Postgres connection established successfully (direct)');
    return database;
  } catch (error: any) {
    console.error('Failed to create Postgres connection:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      cause: error?.cause?.message,
    });
    
    const errorMsg = error?.cause?.message || error?.message || 'Erro desconhecido';
    throw new Error(
      `Erro ao conectar ao Postgres: ${errorMsg}. Verifique se a URL de conexão está correta.`
    );
  }
}

const dbInstance = createDb();

export async function ensureDbInitialized(): Promise<Database> {
  return dbInstance;
}

export async function closeDb() {
  if (globalForDb.__workhubbPgClient) {
    await globalForDb.__workhubbPgClient.end({ timeout: 5 });
    globalForDb.__workhubbPgClient = undefined;
    globalForDb.__workhubbDb = undefined;
  }
}

export const db = dbInstance;

export * from './schema';
