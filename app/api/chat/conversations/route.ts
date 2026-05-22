import { NextRequest, NextResponse } from 'next/server';
import {
  getConversationsForUser,
  getOrCreateConversation,
} from '@/lib/db/chat-queries';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const conversations = await getConversationsForUser(userId);
    return NextResponse.json(conversations);
  } catch (error: unknown) {
    console.error('Error fetching conversations:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch conversations';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId as string | undefined;
    const otherUserId = body.otherUserId as string | undefined;
    const jobId = body.jobId as string | undefined;

    if (!userId || !otherUserId) {
      return NextResponse.json(
        { error: 'userId e otherUserId são obrigatórios' },
        { status: 400 }
      );
    }

    const conversation = await getOrCreateConversation({
      userId,
      otherUserId,
      jobId: jobId ?? null,
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating conversation:', error);
    const message = error instanceof Error ? error.message : 'Failed to create conversation';
    const needsMigrate =
      message.includes('Unknown model') ||
      message.includes('conversations') ||
      message.includes('does not exist');
    return NextResponse.json(
      {
        error: needsMigrate
          ? 'Chat não configurado no banco. Rode: npx prisma migrate deploy'
          : message,
      },
      { status: 500 }
    );
  }
}
