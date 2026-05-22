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
        mode: status.mode,
        vars: status.varsPresent,
        hint: status.hint,
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({
      ok: true,
      mode: status.mode,
      vars: status.varsPresent,
    });
  } catch (error) {
    const formatted = formatPrismaError(error);
    return NextResponse.json(
      {
        ok: false,
        mode: status.mode,
        error: formatted.message,
        code: formatted.code,
      },
      { status: formatted.status }
    );
  }
}
