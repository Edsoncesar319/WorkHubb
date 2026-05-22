import './env';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = prisma;

function isConnectionError(error: unknown): boolean {
  const msg =
    (error as { message?: string })?.message?.toLowerCase() ?? String(error).toLowerCase();
  return (
    msg.includes('closed') ||
    msg.includes('connection') ||
    msg.includes('econnreset') ||
    msg.includes('kind: closed')
  );
}

async function resetClient(): Promise<PrismaClient> {
  try {
    await globalForPrisma.prisma?.$disconnect();
  } catch {
    /* ignore */
  }
  globalForPrisma.prisma = createClient();
  return globalForPrisma.prisma;
}

/** Garante conexão ativa (Neon pooler pode fechar após idle) */
export async function ensurePrismaConnection(): Promise<PrismaClient> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return prisma;
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    const fresh = await resetClient();
    await fresh.$queryRaw`SELECT 1`;
    return fresh;
  }
}

/** Executa query com retry automático se a conexão cair */
export async function withPrisma<T>(
  fn: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const client = await ensurePrismaConnection();
  try {
    return await fn(client);
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    const fresh = await resetClient();
    return fn(fresh);
  }
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export default prisma;
