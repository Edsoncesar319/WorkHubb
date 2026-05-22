import { NextRequest, NextResponse } from 'next/server';
import { getAllJobs, createJob } from '@/lib/db/queries';

export async function GET() {
  try {
    const jobs = await getAllJobs();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id || !body.title || !body.company || !body.location || !body.description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: título, empresa, localização e descrição' },
        { status: 400 }
      );
    }

    const requirements = Array.isArray(body.requirements)
      ? body.requirements
      : typeof body.requirements === 'string'
        ? body.requirements.split(',').map((r: string) => r.trim()).filter(Boolean)
        : [];

    const job = await createJob({
      id: String(body.id),
      title: String(body.title).trim(),
      company: String(body.company).trim(),
      location: String(body.location).trim(),
      remote: Boolean(body.remote),
      hybrid: Boolean(body.hybrid),
      salary: body.salary ? String(body.salary).trim() : null,
      description: String(body.description).trim(),
      requirements,
      authorId: String(body.authorId),
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating job:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create job';
    const needsMigrate = message.includes('Unknown argument `hybrid`');
    return NextResponse.json(
      {
        error: needsMigrate
          ? 'Banco desatualizado. Rode: npx prisma migrate deploy && npx prisma generate'
          : message,
      },
      { status: 500 }
    );
  }
}
