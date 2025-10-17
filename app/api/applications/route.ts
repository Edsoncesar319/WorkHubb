import { NextRequest, NextResponse } from 'next/server';
import { getAllApplications, createApplication } from '@/lib/db/queries';

export async function GET() {
  try {
    const applications = await getAllApplications();
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const application = await createApplication(body);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
