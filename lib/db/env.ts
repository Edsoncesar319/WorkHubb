/**
 * Normaliza variáveis do Vercel Postgres / Prisma Postgres / Neon.
 */

function stripQuotes(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/^["']+|["']+$/g, '');
}

function env(name: string): string | undefined {
  return stripQuotes(process.env[name]);
}

function firstDefined(...values: (string | undefined)[]): string | undefined {
  return values.find((v) => v && v.length > 0);
}

export function isPrismaHostedUrl(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith('prisma+') ||
    url.includes('db.prisma.io') ||
    url.includes('prisma-data.net')
  );
}

/** URLs postgres:// diretas (Neon, Vercel Postgres) — não Prisma Postgres */
export function isDirectPostgresUrl(url: string | undefined): boolean {
  if (!url || isPrismaHostedUrl(url)) return false;
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

function pickDirectUrl(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find(isDirectPostgresUrl);
}

function pickPrismaUrl(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find(isPrismaHostedUrl);
}

export function shouldUsePrismaClient(): boolean {
  ensureDatabaseEnv();
  return !!pickPrismaUrl(
    env('WORKHUB_PRISMA_DATABASE_URL'),
    env('DATABASE_URL'),
    env('WORKHUB_DATABASE_URL'),
    env('WORKHUB_POSTGRES_URL'),
    env('POSTGRES_URL')
  );
}

export function ensureDatabaseEnv(): void {
  const prismaUrl = pickPrismaUrl(
    env('WORKHUB_PRISMA_DATABASE_URL'),
    env('DATABASE_URL'),
    env('WORKHUB_DATABASE_URL')
  );

  const directPrisma = pickPrismaUrl(
    env('WORKHUB_POSTGRES_URL'),
    env('POSTGRES_URL'),
    env('WORKHUB_DATABASE_URL'),
    env('DATABASE_URL')
  );

  const neonUrl = pickDirectUrl(
    env('WORKHUB_POSTGRES_URL'),
    env('POSTGRES_URL'),
    env('POSTGRES_URL_NON_POOLING'),
    env('WORKHUB_POSTGRES_URL_NON_POOLING')
  );

  // Prisma Client: prisma+postgres://... ou postgres://db.prisma.io
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = firstDefined(prismaUrl, directPrisma, neonUrl);
  } else if (prismaUrl && isPrismaHostedUrl(env('DATABASE_URL'))) {
    process.env.DATABASE_URL = prismaUrl;
  }

  if (!process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL = firstDefined(neonUrl, directPrisma, prismaUrl);
  }

  if (!process.env.POSTGRES_URL_NON_POOLING) {
    process.env.POSTGRES_URL_NON_POOLING = firstDefined(
      env('POSTGRES_URL_NON_POOLING'),
      env('WORKHUB_POSTGRES_URL_NON_POOLING'),
      directPrisma,
      neonUrl,
      env('POSTGRES_URL')
    );
  }
}

export function getPostgresPoolUrl(): string | undefined {
  ensureDatabaseEnv();
  return pickDirectUrl(
    env('WORKHUB_POSTGRES_URL'),
    env('POSTGRES_URL'),
    env('POSTGRES_URL_NON_POOLING'),
    env('WORKHUB_DATABASE_URL'),
    env('DATABASE_URL')
  );
}

export function getPostgresDirectUrl(): string | undefined {
  ensureDatabaseEnv();
  return pickDirectUrl(
    env('POSTGRES_URL_NON_POOLING'),
    env('WORKHUB_POSTGRES_URL_NON_POOLING'),
    env('WORKHUB_POSTGRES_URL'),
    env('POSTGRES_URL')
  );
}

export function getDatabaseConfigStatus(): {
  ok: boolean;
  mode: 'prisma' | 'postgres' | 'none';
  varsPresent: string[];
  hint?: string;
} {
  ensureDatabaseEnv();
  const varsPresent = Object.keys(process.env).filter(
    (k) =>
      /^(POSTGRES|DATABASE|WORKHUB)/i.test(k) &&
      !!process.env[k]
  );
  const usePrisma = shouldUsePrismaClient();
  const direct = getPostgresPoolUrl();
  return {
    ok: usePrisma || !!direct,
    mode: usePrisma ? 'prisma' : direct ? 'postgres' : 'none',
    varsPresent,
    hint:
      usePrisma || direct
        ? undefined
        : 'Execute: vercel env pull .env.development.local',
  };
}

ensureDatabaseEnv();
