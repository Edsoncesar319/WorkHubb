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

function createDb(): Database {
  if (globalForDb.__workhubbDb) {
    return globalForDb.__workhubbDb;
  }

  if (isVercel) {
    console.log('Using Vercel Postgres (serverless mode)');
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
  const isPrismaUrl = connectionString.includes('prisma.io') || connectionString.includes('prisma-data.net');
  
  if (isPrismaUrl) {
    console.warn('⚠️  ATENÇÃO: Usando URL do Prisma Accelerate. URLs do Prisma Accelerate podem não funcionar diretamente com postgres-js.');
    console.warn('⚠️  Recomenda-se usar POSTGRES_URL_NON_POOLING que aponta diretamente para o Vercel Postgres.');
  }
  
  console.log('Connecting to Postgres:', {
    url: maskedUrl,
    isPrismaUrl,
    hasPostgresUrl: !!(process.env.POSTGRES_URL || process.env.WORKHUB_POSTGRES_URL),
    hasPostgresUrlNonPooling: !!(process.env.POSTGRES_URL_NON_POOLING || process.env.WORKHUB_POSTGRES_URL_NON_POOLING),
    hasDatabaseUrl: !!(process.env.DATABASE_URL || process.env.WORKHUB_DATABASE_URL),
  });

  const disableSSL = process.env.POSTGRES_DISABLE_SSL === '1';
  const maxConnections = Number.parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '5', 10);

  try {
    // Detectar se é uma URL do Prisma Accelerate
    const isPrismaAccelerate = connectionString.includes('prisma.io') || connectionString.includes('prisma-data.net');
    
    // Para URLs do Prisma Accelerate, pode precisar de configuração especial
    const sslConfig = disableSSL ? false : (isPrismaAccelerate ? 'require' : 'require');
    
    const client = postgres(connectionString, {
      ssl: sslConfig,
      max: Number.isNaN(maxConnections) ? 5 : maxConnections,
      onnotice: () => {}, // Silenciar avisos do Postgres
      // Para Prisma Accelerate, pode precisar de configurações adicionais
      ...(isPrismaAccelerate && {
        connection: {
          application_name: 'workhubb',
        },
      }),
    });

    globalForDb.__workhubbPgClient = client;
    const database = drizzleWithPostgresJs(client, { schema });
    globalForDb.__workhubbDb = database;
    console.log('Postgres connection established successfully', { isPrismaAccelerate });
    return database;
  } catch (error: any) {
    console.error('Failed to create Postgres connection:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      cause: error?.cause?.message,
    });
    
    const errorMsg = error?.cause?.message || error?.message || 'Erro desconhecido';
    
    // Mensagem específica para erros do Prisma Accelerate
    if (errorMsg.includes('Failed to identify your database') || 
        errorMsg.includes('A server error occurred') ||
        connectionString.includes('prisma.io') ||
        connectionString.includes('prisma-data.net')) {
      throw new Error(
        `Erro: URLs do Prisma Accelerate (db.prisma.io) não funcionam diretamente com postgres-js. ` +
        `Use POSTGRES_URL_NON_POOLING que aponta diretamente para o Vercel Postgres. ` +
        `Execute 'vercel env pull .env.development.local' para atualizar as variáveis.`
      );
    }
    
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
