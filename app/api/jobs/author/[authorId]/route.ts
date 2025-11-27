import { NextRequest, NextResponse } from 'next/server';
import { getJobsByAuthor } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ authorId: string }> }
) {
  try {
    const { authorId } = await params;
    const jobs = await getJobsByAuthor(authorId);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs by author:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

