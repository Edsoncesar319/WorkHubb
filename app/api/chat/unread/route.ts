import { NextRequest, NextResponse } from 'next/server';
import { getUnreadCountForUser } from '@/lib/db/chat-queries';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const count = await getUnreadCountForUser(userId);
    return NextResponse.json({ count });
  } catch (error: unknown) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ count: 0 });
  }
}
