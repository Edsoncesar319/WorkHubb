import './env';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient;
};

/**
 * Cliente Prisma singleton para evitar múltiplas conexões
 * Compatível com Next.js (hot reload) e Vercel (serverless)
 */
export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

/**
 * Função auxiliar para desconectar o Prisma
 * Útil para scripts ou testes
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export default prisma;

