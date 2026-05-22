import './env';
import { drizzle as drizzleWithPostgresJs, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  getPostgresDirectUrl,
  getPostgresPoolUrl,
  isDirectPostgresUrl,
} from './env';
import * as schema from './schema';

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __workhubbDb?: Database;
  __workhubbPgClient?: ReturnType<typeof postgres>;
};

function createDb(): Database {
  if (globalForDb.__workhubbDb) {
    return globalForDb.__workhubbDb;
  }

  const poolUrl = getPostgresPoolUrl();
  const directUrl = getPostgresDirectUrl();
  const connectionString = poolUrl ?? directUrl;

  if (!connectionString || !isDirectPostgresUrl(connectionString)) {
    const hasPrismaOnly =
      !!process.env.DATABASE_URL?.startsWith('prisma+') ||
      !!process.env.WORKHUB_PRISMA_DATABASE_URL?.startsWith('prisma+');

    throw new Error(
      hasPrismaOnly
        ? 'Apenas URL do Prisma Accelerate encontrada (prisma+...). ' +
            'Defina WORKHUB_POSTGRES_URL ou POSTGRES_URL (URL postgres:// direta) na Vercel.'
        : 'Postgres não configurado. Conecte Storage > Postgres ao projeto na Vercel ' +
            'ou defina WORKHUB_POSTGRES_URL / POSTGRES_URL no .env.local e redeploy.'
    );
  }

  const disableSSL = process.env.POSTGRES_DISABLE_SSL === '1';
  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
  const maxConnections = Number.parseInt(
    process.env.POSTGRES_MAX_CONNECTIONS || (isVercel ? '1' : '5'),
    10
  );

  const client = postgres(connectionString, {
    ssl: disableSSL ? false : 'require',
    max: Number.isNaN(maxConnections) ? 1 : maxConnections,
    idle_timeout: isVercel ? 20 : 0,
    connect_timeout: 15,
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
