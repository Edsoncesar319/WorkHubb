import { NextResponse } from 'next/server';
import { getDatabaseConfigStatus } from '@/lib/db/env';
import { formatPrismaError } from '@/lib/db/prisma-errors';
import { withPrisma } from '@/lib/db/prisma';

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

  if (!status.neon && (status.host === 'db.prisma.io' || status.host.includes('prisma'))) {
    return NextResponse.json(
      {
        ok: false,
        code: 'LEGACY_PRISMA_POSTGRES',
        hint:
          'Apague WORKHUB_* na Vercel. Use Neon: POSTGRES_PRISMA_URL (*.neon.tech)',
      },
      { status: 503 }
    );
  }

  try {
    await withPrisma((db) => db.$queryRaw`SELECT 1 as ok`);
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
