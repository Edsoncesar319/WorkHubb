import { NextRequest, NextResponse } from 'next/server';
import { getMessages, sendMessage } from '@/lib/db/chat-queries';

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

    const messages = await getMessages(id, userId);
    return NextResponse.json(messages);
  } catch (error: unknown) {
    console.error('Error fetching messages:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch messages';
    const status = message.includes('não encontrada') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body.userId as string | undefined;
    const content = body.content as string | undefined;

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'userId e content são obrigatórios' },
        { status: 400 }
      );
    }

    const message = await sendMessage({
      conversationId: id,
      senderId: userId,
      content,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: unknown) {
    console.error('Error sending message:', error);
    const message = error instanceof Error ? error.message : 'Failed to send message';
    const status = message.includes('não encontrada') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
