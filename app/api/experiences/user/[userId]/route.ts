import { NextRequest, NextResponse } from 'next/server';
import { getUserExperiences } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const experiences = await getUserExperiences(userId);
    return NextResponse.json(experiences);
  } catch (error) {
    console.error('Error fetching user experiences:', error);
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}

