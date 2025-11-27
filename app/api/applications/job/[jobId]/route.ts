import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { applications, users } from '@/lib/db/schema';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    // Buscar candidaturas com informações do candidato
    const result = await db
      .select({
        application: applications,
        user: users,
      })
      .from(applications)
      .leftJoin(users, eq(applications.userId, users.id))
      .where(eq(applications.jobId, jobId))
      .orderBy(desc(applications.createdAt));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching applications by job:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

