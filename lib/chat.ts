import type {
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
} from '@/lib/db/chat-queries';

export type { ChatMessage, ConversationDetail, ConversationSummary };

async function parseError(response: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const data = await response.json();
    message = data.error || message;
  } catch {
    /* ignore */
  }
  throw new Error(message);
}

export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const response = await fetch(
    `/api/chat/conversations?userId=${encodeURIComponent(userId)}`
  );
  if (!response.ok) {
    await parseError(response, 'Não foi possível carregar conversas');
  }
  return response.json();
}

export async function getUnreadCount(userId: string): Promise<number> {
  const response = await fetch(
    `/api/chat/unread?userId=${encodeURIComponent(userId)}`
  );
  if (!response.ok) return 0;
  const data = await response.json();
  return data.count ?? 0;
}

export async function getConversation(
  conversationId: string,
  userId: string
): Promise<ConversationDetail> {
  const response = await fetch(
    `/api/chat/conversations/${conversationId}?userId=${encodeURIComponent(userId)}`
  );
  if (!response.ok) {
    await parseError(response, 'Conversa não encontrada');
  }
  return response.json();
}

export async function getOrCreateConversation(params: {
  userId: string;
  otherUserId: string;
  jobId?: string;
}): Promise<ConversationDetail> {
  const response = await fetch('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    await parseError(response, 'Não foi possível iniciar a conversa');
  }
  return response.json();
}

export async function getMessages(
  conversationId: string,
  userId: string
): Promise<ChatMessage[]> {
  const response = await fetch(
    `/api/chat/conversations/${conversationId}/messages?userId=${encodeURIComponent(userId)}`
  );
  if (!response.ok) {
    await parseError(response, 'Não foi possível carregar mensagens');
  }
  return response.json();
}

export async function sendMessage(params: {
  conversationId: string;
  userId: string;
  content: string;
}): Promise<ChatMessage> {
  const response = await fetch(
    `/api/chat/conversations/${params.conversationId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        content: params.content,
      }),
    }
  );
  if (!response.ok) {
    await parseError(response, 'Não foi possível enviar a mensagem');
  }
  return response.json();
}

export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await fetch(`/api/chat/conversations/${conversationId}/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}

export function buildMessagesUrl(params: {
  conversationId?: string;
  withUserId?: string;
  jobId?: string;
}): string {
  const search = new URLSearchParams();
  if (params.conversationId) search.set('c', params.conversationId);
  if (params.withUserId) search.set('with', params.withUserId);
  if (params.jobId) search.set('job', params.jobId);
  const q = search.toString();
  return q ? `/messages?${q}` : '/messages';
}
