import './env';
import { createPool } from '@vercel/postgres';
import { drizzle as drizzleWithVercel, type VercelPgDatabase } from 'drizzle-orm/vercel-postgres';
import { drizzle as drizzleWithPostgresJs, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getPostgresDirectUrl, getPostgresPoolUrl } from './env';
import * as schema from './schema';

type Database = VercelPgDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __workhubbDb?: Database;
  __workhubbPgClient?: ReturnType<typeof postgres>;
};

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;

function resolvePoolUrl(): string | undefined {
  return getPostgresPoolUrl();
}

function isPrismaAccelerateUrl(url: string): boolean {
  return (
    url.includes('db.prisma.io') ||
    url.includes('prisma-data.net') ||
    url.startsWith('prisma+')
  );
}

function createDb(): Database {
  if (globalForDb.__workhubbDb) {
    return globalForDb.__workhubbDb;
  }

  const poolUrl = resolvePoolUrl();
  const directUrl = getPostgresDirectUrl() ?? poolUrl;

  if (!poolUrl && !directUrl) {
    throw new Error(
      'Postgres não configurado na Vercel. Conecte Storage > Postgres ao projeto ' +
        '(variáveis POSTGRES_URL ou DATABASE_URL) e faça um novo deploy.'
    );
  }

  const connectionString = poolUrl ?? directUrl!;

  // Produção Vercel ou URL pooled: @vercel/postgres com connectionString explícita
  if (isVercel || !isPrismaAccelerateUrl(connectionString)) {
    try {
      const pool = createPool({ connectionString });
      const database = drizzleWithVercel(pool, { schema });
      globalForDb.__workhubbDb = database;
      return database;
    } catch (error: unknown) {
      const err = error as { message?: string };
      // Se falhar na Vercel, não tentar postgres-js com URL pooled
      if (isVercel) {
        throw new Error(
          `Erro ao conectar ao Postgres: ${err?.message ?? 'desconhecido'}. ` +
            `Confira Storage > Postgres no dashboard da Vercel.`
        );
      }
    }
  }

  // Desenvolvimento local: conexão direta via postgres-js
  const localUrl = directUrl ?? connectionString;
  if (!localUrl) {
    throw new Error(
      'Postgres não configurado. Defina POSTGRES_URL ou DATABASE_URL no .env.local'
    );
  }

  const disableSSL = process.env.POSTGRES_DISABLE_SSL === '1';
  const maxConnections = Number.parseInt(
    process.env.POSTGRES_MAX_CONNECTIONS || '5',
    10
  );

  const client = postgres(localUrl, {
    ssl: disableSSL ? false : 'require',
    max: Number.isNaN(maxConnections) ? 5 : maxConnections,
    onnotice: () => {},
  });

  globalForDb.__workhubbPgClient = client;
  const database = drizzleWithPostgresJs(client, { schema });
  globalForDb.__workhubbDb = database;
  return database;
}

let dbInstance: Database | null = null;

function getDbInstance(): Database {
  if (!dbInstance) {
    dbInstance = createDb();
  }
  return dbInstance;
}

export async function ensureDbInitialized(): Promise<Database> {
  return getDbInstance();
}

export async function closeDb() {
  if (globalForDb.__workhubbPgClient) {
    await globalForDb.__workhubbPgClient.end({ timeout: 5 });
    globalForDb.__workhubbPgClient = undefined;
    globalForDb.__workhubbDb = undefined;
    dbInstance = null;
  }
}

/** Cliente Drizzle — inicialização lazy */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = getDbInstance();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});

export * from './schema';
