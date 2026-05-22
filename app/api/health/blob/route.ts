import { NextResponse } from 'next/server';
import { getBlobConfigStatus } from '@/lib/blob';

export async function GET() {
  const status = getBlobConfigStatus();
  return NextResponse.json({
    ok: status.ok,
    hint: status.hint,
  });
}
