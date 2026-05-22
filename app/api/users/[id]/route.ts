import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedUser = await updateUser(id, body);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update user';
    const needsGenerate = message.includes('Unknown argument `resumeUrl`');
    return NextResponse.json(
      {
        error: needsGenerate
          ? 'Banco desatualizado. Pare o npm run dev, rode: npx prisma generate && npm run prisma:migrate:deploy, depois npm run dev'
          : message,
      },
      { status: 500 }
    );
  }
}
