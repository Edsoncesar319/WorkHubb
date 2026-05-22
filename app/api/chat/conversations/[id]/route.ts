import { NextRequest, NextResponse } from 'next/server';
import { getConversationById } from '@/lib/db/chat-queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const conversation = await getConversationById(id, userId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error: unknown) {
    console.error('Error fetching conversation:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch conversation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
