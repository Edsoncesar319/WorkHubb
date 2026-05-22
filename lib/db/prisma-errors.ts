/** Mensagens amigáveis para erros do Prisma Postgres / Data Proxy */

export const PRISMA_API_KEY_INVALID_CODE = 'PRISMA_API_KEY_INVALID';

export function isPrismaApiKeyError(message: string): boolean {
  return (
    message.includes('P6002') ||
    message.includes('API key is invalid') ||
    message.includes('API Key is invalid')
  );
}

export function getPrismaApiKeyErrorMessage(): string {
  return (
    'Banco configurado com Prisma Postgres legado (API key inválida). ' +
    'Na Vercel use Storage → Postgres (Neon), não db.prisma.io. ' +
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
      message:
        'Não foi possível conectar ao Prisma Postgres. Regenere as variáveis no Storage da Vercel e faça vercel env pull.',
      code: 'DB_UNREACHABLE',
      status: 503,
    };
  }

  return { message, code: err?.code, status: 500 };
}
