import { NextRequest, NextResponse } from 'next/server';
import { markConversationAsRead } from '@/lib/db/chat-queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    await markConversationAsRead(id, userId);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('Error marking conversation read:', error);
    const message = error instanceof Error ? error.message : 'Failed to mark read';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
