/**
 * Normaliza variáveis do Vercel Postgres / Neon para Drizzle, @vercel/postgres e Prisma.
 * Importe este módulo antes de qualquer cliente de banco (ex.: lib/db/index.ts).
 */

function firstDefined(...values: (string | undefined)[]): string | undefined {
  return values.find((v) => v && v.length > 0);
}

/** Monta URL a partir de POSTGRES_HOST, POSTGRES_USER, etc. (formato Vercel Storage) */
function buildUrlFromPostgresParts(): string | undefined {
  const host = firstDefined(
    process.env.POSTGRES_HOST,
    process.env.WORKHUB_POSTGRES_HOST
  );
  const user = firstDefined(
    process.env.POSTGRES_USER,
    process.env.WORKHUB_POSTGRES_USER
  );
  const password = firstDefined(
    process.env.POSTGRES_PASSWORD,
    process.env.WORKHUB_POSTGRES_PASSWORD
  );
  const database = firstDefined(
    process.env.POSTGRES_DATABASE,
    process.env.WORKHUB_POSTGRES_DATABASE
  );

  if (!host || !user || !password || !database) return undefined;

  const port = firstDefined(process.env.POSTGRES_PORT, '5432');
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}

/** Procura qualquer env *POSTGRES*URL* ou DATABASE_URL com protocolo postgres */
function findPostgresUrlInProcessEnv(): string | undefined {
  for (const [key, value] of Object.entries(process.env)) {
    if (!value || !value.startsWith('postgres')) continue;
    const upper = key.toUpperCase();
    if (
      upper === 'DATABASE_URL' ||
      upper.endsWith('_DATABASE_URL') ||
      (upper.includes('POSTGRES') && upper.includes('URL') && !upper.includes('NON_POOLING'))
    ) {
      return value;
    }
  }
  return undefined;
}

export function getPostgresPoolUrl(): string | undefined {
  ensureDatabaseEnv();
  return firstDefined(
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.WORKHUB_POSTGRES_PRISMA_URL,
    process.env.WORKHUB_POSTGRES_URL,
    process.env.WORKHUB_DATABASE_URL
  );
}

export function getPostgresDirectUrl(): string | undefined {
  ensureDatabaseEnv();
  return firstDefined(
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.WORKHUB_POSTGRES_URL_NON_POOLING,
    process.env.WORKHUB_POSTGRES_URL,
    process.env.WORKHUB_DATABASE_URL
  );
}

export function ensureDatabaseEnv(): void {
  const fromScan = findPostgresUrlInProcessEnv();
  const fromParts = buildUrlFromPostgresParts();

  const postgresUrl = firstDefined(
    process.env.POSTGRES_URL,
    process.env.WORKHUB_POSTGRES_URL,
    fromScan,
    fromParts
  );

  const postgresNonPooling = firstDefined(
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.WORKHUB_POSTGRES_URL_NON_POOLING
  );

  const prismaUrl = firstDefined(
    process.env.POSTGRES_PRISMA_URL,
    process.env.WORKHUB_POSTGRES_PRISMA_URL
  );

  const databaseUrl = firstDefined(
    process.env.DATABASE_URL,
    process.env.WORKHUB_DATABASE_URL,
    fromScan,
    fromParts
  );

  // @vercel/postgres exige POSTGRES_URL em process.env
  if (!process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL = firstDefined(
      prismaUrl,
      postgresUrl,
      databaseUrl,
      postgresNonPooling
    );
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = firstDefined(
      prismaUrl,
      process.env.POSTGRES_URL,
      postgresUrl,
      databaseUrl
    );
  }

  if (!process.env.POSTGRES_URL_NON_POOLING) {
    process.env.POSTGRES_URL_NON_POOLING = firstDefined(
      postgresNonPooling,
      process.env.POSTGRES_URL,
      databaseUrl
    );
  }
}

ensureDatabaseEnv();
