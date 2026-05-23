import { NextRequest, NextResponse } from 'next/server';
import { getJobById, updateJob } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const authorId = body.authorId as string | undefined;

    if (!authorId) {
      return NextResponse.json(
        { error: 'authorId é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await getJobById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    if (existing.authorId !== authorId) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta vaga' },
        { status: 403 }
      );
    }

    if (!body.title?.trim() || !body.location?.trim() || !body.description?.trim()) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: título, localização e descrição' },
        { status: 400 }
      );
    }

    const requirements = Array.isArray(body.requirements)
      ? body.requirements
      : typeof body.requirements === 'string'
        ? body.requirements.split(',').map((r: string) => r.trim()).filter(Boolean)
        : existing.requirements;

    const job = await updateJob(id, {
      title: String(body.title).trim(),
      company: body.company
        ? String(body.company).trim()
        : existing.company,
      location: String(body.location).trim(),
      remote: Boolean(body.remote),
      hybrid: Boolean(body.hybrid),
      salary: body.salary ? String(body.salary).trim() : null,
      description: String(body.description).trim(),
      requirements,
    });

    if (!job) {
      return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: unknown) {
    console.error('Error updating job:', error);
    const message = error instanceof Error ? error.message : 'Failed to update job';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
