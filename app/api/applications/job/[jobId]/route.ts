import { NextRequest, NextResponse } from 'next/server';
import { getJobApplicationsWithUsers } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const result = await getJobApplicationsWithUsers(jobId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching applications by job:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

