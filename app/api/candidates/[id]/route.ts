import { NextRequest, NextResponse } from 'next/server';
import { getCandidateProfileForCompany } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;
    const companyId = request.nextUrl.searchParams.get('companyId');
    const jobId = request.nextUrl.searchParams.get('jobId') ?? undefined;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId é obrigatório' },
        { status: 400 }
      );
    }

    const profile = await getCandidateProfileForCompany(
      companyId,
      candidateId,
      jobId || undefined
    );

    if (!profile) {
      return NextResponse.json(
        { error: 'Candidato não encontrado ou sem candidatura às suas vagas' },
        { status: 403 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate profile' },
      { status: 500 }
    );
  }
}
