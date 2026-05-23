import { NextRequest, NextResponse } from 'next/server';
import { getUserApplications } from '@/lib/db/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const applications = await getUserApplications(userId);
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user applications' },
      { status: 500 }
    );
  }
}
