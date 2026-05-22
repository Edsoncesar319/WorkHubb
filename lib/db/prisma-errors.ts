import { hasNeonConfigured } from './env';

export const PRISMA_API_KEY_INVALID_CODE = 'PRISMA_API_KEY_INVALID';

export function isPrismaApiKeyError(message: string): boolean {
  return (
    message.includes('P6002') ||
    message.includes('API key is invalid') ||
    message.includes('API Key is invalid')
  );
}

export function getPrismaApiKeyErrorMessage(): string {
  if (hasNeonConfigured()) {
    return (
      'Conexão com o banco falhou. Reinicie o servidor (npm run dev) e confira POSTGRES_PRISMA_URL no .env.development.local.'
    );
  }
  return (
    'Variáveis antigas do Prisma Postgres (WORKHUB_* / db.prisma.io) ainda ativas. ' +
    'Na Vercel: apague WORKHUB_* e use Storage → Postgres (Neon). ' +
    'Depois: vercel env pull .env.development.local && npm run prisma:setup-env && redeploy.'
  );
}

export function formatPrismaError(error: unknown): {
  message: string;
  code?: string;
  status: number;
} {
  const err = error as { code?: string; message?: string; cause?: { message?: string } };
  const message = err?.cause?.message || err?.message || String(error);

  if (isPrismaApiKeyError(message)) {
    return {
      message: getPrismaApiKeyErrorMessage(),
      code: PRISMA_API_KEY_INVALID_CODE,
      status: 503,
    };
  }

  if (message.includes("Can't reach database server")) {
    return {
      message: hasNeonConfigured()
        ? 'Não foi possível alcançar o Neon. Verifique POSTGRES_URL_NON_POOLING e a rede.'
        : 'Configure Neon na Vercel (Storage → Postgres) e rode vercel env pull.',
      code: 'DB_UNREACHABLE',
      status: 503,
    };
  }

  return { message, code: err?.code, status: 500 };
}
