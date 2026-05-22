import { NextResponse } from 'next/server';
import { getDatabaseConfigStatus } from '@/lib/db/env';
import { formatPrismaError } from '@/lib/db/prisma-errors';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const status = getDatabaseConfigStatus();

  if (!status.ok) {
    return NextResponse.json(
      {
        ok: false,
        host: status.host,
        source: status.source,
        hint: status.hint,
        vars: status.varsPresent,
      },
      { status: 503 }
    );
  }

  if (status.host === 'db.prisma.io') {
    return NextResponse.json(
      {
        ok: false,
        code: 'LEGACY_PRISMA_POSTGRES',
        hint: 'Use Vercel Postgres (Neon) em vez de db.prisma.io',
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({
      ok: true,
      host: status.host,
      source: status.source,
    });
  } catch (error) {
    const formatted = formatPrismaError(error);
    return NextResponse.json(
      {
        ok: false,
        error: formatted.message,
        code: formatted.code,
        host: status.host,
      },
      { status: formatted.status }
    );
  }
}
