/**
 * Resolve DATABASE_URL e DIRECT_DATABASE_URL para Prisma na Vercel.
 *
 * Ordem de prioridade (produção):
 * 1. POSTGRES_PRISMA_URL — Vercel Postgres / Neon (recomendado)
 * 2. POSTGRES_URL — URL pooled (*.neon.tech, vercel-storage, etc.)
 * 3. Variáveis com prefixo do Storage (WORKHUB_*)
 * 4. prisma+postgres:// — só se não houver URL Neon direta
 *
 * NÃO usa postgres://@db.prisma.io (Prisma Postgres legado — API key instável).
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

function isPostgresProtocol(url: string): boolean {
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

/** Prisma Postgres legado — evitar em produção */
function isLegacyPrismaPostgresHost(url: string): boolean {
  return url.includes('db.prisma.io') || url.includes('prisma-data.net');
}

function isPrismaAccelerateUrl(url: string): boolean {
  return url.startsWith('prisma+');
}

/** Neon, Vercel Storage, Supabase, etc. */
function isPreferredProductionHost(url: string): boolean {
  if (!isPostgresProtocol(url) || isLegacyPrismaPostgresHost(url)) return false;
  return (
    url.includes('neon.tech') ||
    url.includes('vercel-storage.com') ||
    url.includes('supabase.co') ||
    url.includes('pooler') ||
    !isLegacyPrismaPostgresHost(url)
  );
}

function scoreUrl(url: string | undefined): number {
  if (!url) return -1;
  if (isPreferredProductionHost(url)) return 100;
  if (isPostgresProtocol(url) && !isLegacyPrismaPostgresHost(url)) return 75;
  if (isPrismaAccelerateUrl(url)) return 15;
  if (isLegacyPrismaPostgresHost(url)) return 5;
  return 0;
}

function filterForProduction(urls: (string | undefined)[]): (string | undefined)[] {
  const onVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
  if (!onVercel) return urls;
  const allowed = urls.filter(
    (u) =>
      u &&
      (isPreferredProductionHost(u) ||
        (isPostgresProtocol(u) &&
          !isLegacyPrismaPostgresHost(u) &&
          !isPrismaAccelerateUrl(u)))
  );
  return allowed.length > 0 ? allowed : urls;
}

function pickBestUrl(...candidates: (string | undefined)[]): string | undefined {
  const valid = candidates.filter((u): u is string => !!u && (isPostgresProtocol(u) || isPrismaAccelerateUrl(u)));
  if (valid.length === 0) return undefined;
  return valid.sort((a, b) => scoreUrl(b) - scoreUrl(a))[0];
}

function collectAllCandidates(): (string | undefined)[] {
  const keys = Object.keys(process.env).filter((k) =>
    /^(POSTGRES|DATABASE|WORKHUB|PRISMA)/i.test(k)
  );
  const fromEnv: (string | undefined)[] = keys.map((k) => env(k));
  return [
    env('POSTGRES_PRISMA_URL'),
    env('POSTGRES_URL'),
    env('DATABASE_URL'),
    env('POSTGRES_URL_NON_POOLING'),
    env('DATABASE_URL_UNPOOLED'),
    env('WORKHUB_POSTGRES_PRISMA_URL'),
    env('WORKHUB_PRISMA_DATABASE_URL'),
    env('WORKHUB_POSTGRES_URL'),
    env('WORKHUB_POSTGRES_URL_NON_POOLING'),
    env('WORKHUB_DATABASE_URL'),
    ...fromEnv,
  ];
}

/** URL direta (sem pooler) — migrations / directUrl */
function isUnpooledUrl(url: string): boolean {
  return isPostgresProtocol(url) && !url.includes('-pooler') && !url.includes('pgbouncer');
}

export function resolveDatabaseUrls(): {
  databaseUrl: string | undefined;
  directDatabaseUrl: string | undefined;
  source: string;
  directSource: string;
} {
  const pooledCandidates = filterForProduction([
    env('POSTGRES_PRISMA_URL'),
    env('POSTGRES_URL'),
    env('WORKHUB_POSTGRES_PRISMA_URL'),
    env('WORKHUB_POSTGRES_URL'),
    env('DATABASE_URL'),
    env('WORKHUB_PRISMA_DATABASE_URL'),
    env('WORKHUB_DATABASE_URL'),
    ...collectAllCandidates(),
  ]);

  const pooled = pickBestUrl(...pooledCandidates);

  const directCandidates = filterForProduction([
    env('DATABASE_URL_UNPOOLED'),
    env('POSTGRES_URL_NON_POOLING'),
    env('WORKHUB_POSTGRES_URL_NON_POOLING'),
    ...collectAllCandidates().filter((u) => u && isUnpooledUrl(u)),
    env('POSTGRES_URL'),
    env('WORKHUB_POSTGRES_URL'),
  ]);

  const direct =
    directCandidates.find((u) => u && isUnpooledUrl(u)) ??
    pickBestUrl(...directCandidates) ??
    pooled;

  let source = 'none';
  if (env('POSTGRES_PRISMA_URL') && pooled === env('POSTGRES_PRISMA_URL'))
    source = 'POSTGRES_PRISMA_URL';
  else if (env('DATABASE_URL') && pooled === env('DATABASE_URL'))
    source = 'DATABASE_URL';
  else if (env('POSTGRES_URL') && pooled === env('POSTGRES_URL'))
    source = 'POSTGRES_URL';
  else if (pooled?.startsWith('prisma+')) source = 'prisma+ (accelerate)';
  else if (pooled) source = 'resolved';

  const directSource =
    direct === env('DATABASE_URL_UNPOOLED')
      ? 'DATABASE_URL_UNPOOLED'
      : direct === env('POSTGRES_URL_NON_POOLING')
        ? 'POSTGRES_URL_NON_POOLING'
        : 'resolved';

  return {
    databaseUrl: pooled,
    directDatabaseUrl: direct ?? pooled,
    source,
    directSource,
  };
}

export function ensureDatabaseEnv(): void {
  const { databaseUrl, directDatabaseUrl } = resolveDatabaseUrls();

  if (databaseUrl) {
    process.env.DATABASE_URL = databaseUrl;
  }
  if (directDatabaseUrl) {
    process.env.DIRECT_DATABASE_URL = directDatabaseUrl;
    process.env.POSTGRES_URL_NON_POOLING = directDatabaseUrl;
  }
  if (databaseUrl && !process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL = databaseUrl;
  }
  if (databaseUrl?.startsWith('prisma+')) {
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'dataproxy';
  }
}

export function getDatabaseConfigStatus(): {
  ok: boolean;
  source: string;
  host: string;
  varsPresent: string[];
  hint?: string;
} {
  ensureDatabaseEnv();
  const { databaseUrl, source } = resolveDatabaseUrls();
  const varsPresent = Object.keys(process.env).filter((k) =>
    /^(POSTGRES|DATABASE|DIRECT|WORKHUB)/i.test(k)
  );

  let host = 'unknown';
  if (databaseUrl) {
    try {
      const u = databaseUrl.replace(/^prisma\+/, '');
      host = new URL(u).hostname;
    } catch {
      host = 'invalid-url';
    }
  }

  const ok = !!databaseUrl;
  let hint: string | undefined;
  if (!ok) {
    hint =
      'Conecte Vercel Postgres (Neon) ao projeto: Storage → Postgres → Connect. Depois redeploy.';
  } else if (isLegacyPrismaPostgresHost(databaseUrl)) {
    hint =
      'URL aponta para db.prisma.io (legado). Recomendado: use Vercel Postgres/Neon (host *.neon.tech).';
  }

  return { ok, source, host, varsPresent, hint };
}

ensureDatabaseEnv();
