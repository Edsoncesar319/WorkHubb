/**
 * Resolve DATABASE_URL e DIRECT_DATABASE_URL (Neon / Vercel Postgres).
 * Ignora WORKHUB_* e db.prisma.io quando existir URL *.neon.tech.
 */

function stripQuotes(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/^["']+|["']+$/g, '');
}

function env(name: string): string | undefined {
  return stripQuotes(process.env[name]);
}

function isPostgresProtocol(url: string): boolean {
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

function isLegacyDb(url: string): boolean {
  return (
    url.startsWith('prisma+') ||
    url.includes('db.prisma.io') ||
    url.includes('prisma-data.net')
  );
}

function isNeonUrl(url: string | undefined): boolean {
  return !!url && url.includes('neon.tech') && isPostgresProtocol(url);
}

function isUnpooledUrl(url: string): boolean {
  return isPostgresProtocol(url) && !url.includes('-pooler') && !url.includes('pgbouncer');
}

/** Alguma variável Neon está definida no ambiente */
export function hasNeonConfigured(): boolean {
  for (const [key, value] of Object.entries(process.env)) {
    if (!/POSTGRES|DATABASE|PGHOST/i.test(key)) continue;
    if (isNeonUrl(stripQuotes(value))) return true;
  }
  return false;
}

function isUsableUrl(url: string | undefined, neonOnly: boolean): boolean {
  if (!url || (!isPostgresProtocol(url) && !url.startsWith('prisma+'))) return false;
  if (!neonOnly) return true;
  return isNeonUrl(url) && !isLegacyDb(url);
}

function pickFirst(
  names: string[],
  neonOnly: boolean
): { url?: string; source: string } {
  for (const name of names) {
    const v = env(name);
    if (isUsableUrl(v, neonOnly)) return { url: v!, source: name };
  }
  return { source: 'none' };
}

function pickEnvSuffix(suffixes: string[]): { value?: string; source: string } {
  for (const suffix of suffixes) {
    const v = env(suffix);
    if (v) return { value: v, source: suffix };
    for (const key of Object.keys(process.env)) {
      if (key.endsWith(`_${suffix}`)) {
        const val = env(key);
        if (val) return { value: val, source: key };
      }
    }
  }
  return { source: 'none' };
}

/** Monta URL quando só existem PGHOST / PGUSER / PGPASSWORD / PGDATABASE (Vercel Storage) */
function assembleUrlFromParts(pooled: boolean): { url?: string; source: string } {
  const host = pickEnvSuffix(
    pooled ? ['POSTGRES_HOST', 'PGHOST'] : ['PGHOST_UNPOOLED', 'POSTGRES_HOST', 'PGHOST']
  ).value;
  const user = pickEnvSuffix(['POSTGRES_USER', 'PGUSER']).value;
  const password = pickEnvSuffix(['POSTGRES_PASSWORD', 'PGPASSWORD']).value;
  const database = pickEnvSuffix(['POSTGRES_DATABASE', 'PGDATABASE']).value;

  if (!host || !user || !password || !database) {
    return { source: 'none' };
  }

  const source = pooled ? 'assembled:pooled' : 'assembled:direct';
  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${database}?sslmode=require`;
  return { url, source };
}

/** Vercel Storage usa prefixo ex.: DATABASE_db_POSTGRES_PRISMA_URL */
function pickBySuffix(
  suffixes: string[],
  neonOnly: boolean
): { url?: string; source: string } {
  const exact = pickFirst(suffixes, neonOnly);
  if (exact.url) return exact;

  for (const suffix of suffixes) {
    for (const key of Object.keys(process.env)) {
      if (key === suffix || key.endsWith(`_${suffix}`)) {
        const v = env(key);
        if (isUsableUrl(v, neonOnly)) return { url: v!, source: key };
      }
    }
  }
  return { source: 'none' };
}

export function resolveDatabaseUrls(): {
  databaseUrl: string | undefined;
  directDatabaseUrl: string | undefined;
  source: string;
  directSource: string;
} {
  const neonOnly = hasNeonConfigured();

  const pooledNames = neonOnly
    ? [
        'POSTGRES_PRISMA_URL',
        'DATABASE_URL',
        'POSTGRES_URL',
        'DIRECT_DATABASE_URL',
      ]
    : [
        'POSTGRES_PRISMA_URL',
        'DATABASE_URL',
        'POSTGRES_URL',
        'WORKHUB_POSTGRES_PRISMA_URL',
        'WORKHUB_POSTGRES_URL',
        'WORKHUB_PRISMA_DATABASE_URL',
        'WORKHUB_DATABASE_URL',
      ];

  let { url: pooled, source } = pickBySuffix(pooledNames, neonOnly);
  if (!pooled) {
    const assembled = assembleUrlFromParts(true);
    if (assembled.url) {
      pooled = assembled.url;
      source = assembled.source;
    }
  }

  const directNames = neonOnly
    ? ['DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING', 'DIRECT_DATABASE_URL']
    : [
        'DATABASE_URL_UNPOOLED',
        'POSTGRES_URL_NON_POOLING',
        'WORKHUB_POSTGRES_URL_NON_POOLING',
        'WORKHUB_POSTGRES_URL',
      ];

  let { url: direct, source: directSource } = pickBySuffix(directNames, neonOnly);

  if (direct && !isUnpooledUrl(direct)) {
    const unpooled = directNames
      .flatMap((suffix) =>
        Object.keys(process.env)
          .filter((k) => k === suffix || k.endsWith(`_${suffix}`))
          .map((k) => env(k))
      )
      .find((u) => u && isUnpooledUrl(u));
    if (unpooled) {
      direct = unpooled;
      directSource = 'unpooled';
    }
  }

  if (!direct && pooled && isUnpooledUrl(pooled)) {
    direct = pooled;
    directSource = source;
  }

  if (!direct) {
    const assembledDirect = assembleUrlFromParts(false);
    if (assembledDirect.url) {
      direct = assembledDirect.url;
      directSource = assembledDirect.source;
    }
  }

  return {
    databaseUrl: pooled,
    directDatabaseUrl: direct ?? pooled,
    source,
    directSource,
  };
}

export function getPostgresPoolUrl(): string | undefined {
  ensureDatabaseEnv();
  return resolveDatabaseUrls().databaseUrl;
}

/** Parâmetros recomendados para Neon serverless / Vercel */
function withNeonServerlessParams(url: string, pooled: boolean): string {
  if (!url.includes('neon.tech')) return url;
  let u = url;
  const add = (key: string, val: string) => {
    if (u.includes(`${key}=`)) return;
    u += (u.includes('?') ? '&' : '?') + `${key}=${val}`;
  };
  add('sslmode', 'require');
  if (pooled) {
    add('connect_timeout', '15');
    if (u.includes('-pooler')) add('pgbouncer', 'true');
    add('connection_limit', '1');
  }
  return u;
}

export function ensureDatabaseEnv(): void {
  const { databaseUrl, directDatabaseUrl } = resolveDatabaseUrls();

  if (databaseUrl) {
    process.env.DATABASE_URL = withNeonServerlessParams(databaseUrl, true);
  }
  if (directDatabaseUrl) {
    const direct = withNeonServerlessParams(directDatabaseUrl, false);
    process.env.DIRECT_DATABASE_URL = direct;
    process.env.POSTGRES_URL_NON_POOLING = direct;
  }
  if (process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL;
  }
  if (process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL) {
    process.env.POSTGRES_PRISMA_URL = process.env.DATABASE_URL;
  }
}

export function getDatabaseConfigStatus(): {
  ok: boolean;
  source: string;
  host: string;
  neon: boolean;
  varsPresent: string[];
  hint?: string;
} {
  ensureDatabaseEnv();
  const { databaseUrl, source } = resolveDatabaseUrls();
  const neon = hasNeonConfigured();

  const varsPresent = Object.keys(process.env).filter(
    (k) => /POSTGRES|DATABASE|PGHOST|NEON/i.test(k) && !!process.env[k]
  );

  let host = 'unknown';
  if (databaseUrl) {
    try {
      host = new URL(databaseUrl.replace(/^prisma\+/, '')).hostname;
    } catch {
      host = 'invalid-url';
    }
  }

  let hint: string | undefined;
  if (!databaseUrl) {
    hint = 'Conecte Vercel Postgres (Neon) ao projeto e faça redeploy.';
  } else if (!neon && (host === 'db.prisma.io' || databaseUrl.startsWith('prisma+'))) {
    hint =
      'Remova variáveis WORKHUB_* / Prisma Postgres na Vercel. Use apenas Neon (POSTGRES_PRISMA_URL).';
  } else if (neon && varsPresent.some((k) => k.startsWith('WORKHUB_'))) {
    hint =
      'Neon detectado, mas WORKHUB_* ainda existe — apague WORKHUB_* nas env vars da Vercel.';
  }

  return {
    ok: !!databaseUrl && (neon || !isLegacyDb(databaseUrl)),
    source,
    host,
    neon,
    varsPresent,
    hint,
  };
}

ensureDatabaseEnv();
