/**
 * Ponto de entrada do banco — produção usa Prisma (@/lib/db/prisma).
 * Tipos Drizzle em ./schema mantidos para compatibilidade de tipos nas APIs.
 */
export { prisma, disconnectPrisma } from './prisma';
export * from './schema';
export * from './queries';
