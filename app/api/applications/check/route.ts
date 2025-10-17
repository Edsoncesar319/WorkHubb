import { NextRequest, NextResponse } from 'next/server';
import { hasApplied } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');

    if (!userId || !jobId) {
      return NextResponse.json({ error: 'Missing userId or jobId' }, { status: 400 });
    }

    const applied = await hasApplied(userId, jobId);
    return NextResponse.json({ applied });
  } catch (error) {
    console.error('Error checking application:', error);
    return NextResponse.json({ error: 'Failed to check application' }, { status: 500 });
  }
}
