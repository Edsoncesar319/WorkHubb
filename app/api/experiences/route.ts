import { NextRequest, NextResponse } from 'next/server';
import { getAllExperiences, createExperience } from '@/lib/db/queries';

export async function GET() {
  try {
    const experiences = await getAllExperiences();
    return NextResponse.json(experiences);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const experience = await createExperience(body);
    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    console.error('Error creating experience:', error);
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 });
  }
}

