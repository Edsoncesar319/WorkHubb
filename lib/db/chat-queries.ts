import { withPrisma } from './prisma';
import { formatPrismaError } from './prisma-errors';
import type { User } from './types';

export interface ChatParticipant {
  id: string;
  name: string;
  type: string;
  company: string | null;
  profilePhoto: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  jobId: string | null;
  jobTitle: string | null;
  otherUser: ChatParticipant;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  jobId: string | null;
  jobTitle: string | null;
  participant1Id: string;
  participant2Id: string;
  otherUser: ChatParticipant;
}

function orderedParticipants(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function mapParticipant(row: {
  id: string;
  name: string;
  type: string;
  company: string | null;
  profilePhoto: string | null;
}): ChatParticipant {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    company: row.company,
    profilePhoto: row.profilePhoto,
  };
}

function mapMessage(row: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: Date | null;
  createdAt: Date;
}): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function handleDbError(error: unknown, context: string): never {
  const err = error as { message?: string };
  const formatted = formatPrismaError(error);
  if (formatted.code === 'PRISMA_API_KEY_INVALID' || formatted.code === 'DB_UNREACHABLE') {
    throw new Error(formatted.message);
  }
  throw new Error(err?.message || `Erro em ${context}`);
}

export function isConversationParticipant(
  conversation: { participant1Id: string; participant2Id: string },
  userId: string
): boolean {
  return (
    conversation.participant1Id === userId ||
    conversation.participant2Id === userId
  );
}

export async function getOrCreateConversation(params: {
  userId: string;
  otherUserId: string;
  jobId?: string | null;
}): Promise<ConversationDetail> {
  const { userId, otherUserId, jobId } = params;

  if (userId === otherUserId) {
    throw new Error('Não é possível iniciar conversa consigo mesmo');
  }

  const [participant1Id, participant2Id] = orderedParticipants(userId, otherUserId);

  try {
    const existing = await withPrisma((db) =>
      db.conversation.findUnique({
        where: { participant1Id_participant2Id: { participant1Id, participant2Id } },
        include: {
          participant1: {
            select: { id: true, name: true, type: true, company: true, profilePhoto: true },
          },
          participant2: {
            select: { id: true, name: true, type: true, company: true, profilePhoto: true },
          },
          job: { select: { title: true } },
        },
      })
    );

    if (existing) {
      const other =
        existing.participant1Id === userId ? existing.participant1 : existing.participant2;
      return {
        id: existing.id,
        jobId: existing.jobId,
        jobTitle: existing.job?.title ?? null,
        participant1Id: existing.participant1Id,
        participant2Id: existing.participant2Id,
        otherUser: mapParticipant(other),
      };
    }

    const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const created = await withPrisma((db) =>
      db.conversation.create({
        data: {
          id,
          participant1Id,
          participant2Id,
          jobId: jobId ?? null,
        },
        include: {
          participant1: {
            select: { id: true, name: true, type: true, company: true, profilePhoto: true },
          },
          participant2: {
            select: { id: true, name: true, type: true, company: true, profilePhoto: true },
          },
          job: { select: { title: true } },
        },
      })
    );

    const other =
      created.participant1Id === userId ? created.participant1 : created.participant2;

    return {
      id: created.id,
      jobId: created.jobId,
      jobTitle: created.job?.title ?? null,
      participant1Id: created.participant1Id,
      participant2Id: created.participant2Id,
      otherUser: mapParticipant(other),
    };
  } catch (e) {
    handleDbError(e, 'getOrCreateConversation');
  }
}

export async function getConversationsForUser(userId: string): Promise<ConversationSummary[]> {
  try {
    const rows = await withPrisma((db) =>
      db.conversation.findMany({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          participant1: {
            select: { id: true, name: true, type: true, company: true, profilePhoto: true },
          },
          participant2: {
            select: { id: true, name: true, type: true, company: true, profilePhoto: true },
          },
          job: { select: { title: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    );

    const summaries: ConversationSummary[] = [];

    for (const conv of rows) {
      const other =
        conv.participant1Id === userId ? conv.participant1 : conv.participant2;
      const last = conv.messages[0];

      const unreadCount = await withPrisma((db) =>
        db.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            readAt: null,
          },
        })
      );

      summaries.push({
        id: conv.id,
        jobId: conv.jobId,
        jobTitle: conv.job?.title ?? null,
        otherUser: mapParticipant(other),
        lastMessage: last ? mapMessage(last) : null,
        unreadCount,
        updatedAt: conv.updatedAt.toISOString(),
      });
    }

    return summaries;
  } catch (e) {
    handleDbError(e, 'getConversationsForUser');
  }
}

export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<ConversationDetail | undefined> {
  try {
    const row = await withPrisma((db) =>
      db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participant1: {
            select: { id: true, name: true, type: true, company: true, profilePhoto: true },
          },
          participant2: {
            select: { id: true, name: true, type: true, company: true, profilePhoto: true },
          },
          job: { select: { title: true } },
        },
      })
    );

    if (!row || !isConversationParticipant(row, userId)) return undefined;

    const other = row.participant1Id === userId ? row.participant1 : row.participant2;

    return {
      id: row.id,
      jobId: row.jobId,
      jobTitle: row.job?.title ?? null,
      participant1Id: row.participant1Id,
      participant2Id: row.participant2Id,
      otherUser: mapParticipant(other),
    };
  } catch (e) {
    handleDbError(e, 'getConversationById');
  }
}

export async function getMessages(
  conversationId: string,
  userId: string
): Promise<ChatMessage[]> {
  const conv = await getConversationById(conversationId, userId);
  if (!conv) {
    throw new Error('Conversa não encontrada');
  }

  try {
    const rows = await withPrisma((db) =>
      db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      })
    );
    return rows.map(mapMessage);
  } catch (e) {
    handleDbError(e, 'getMessages');
  }
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
}): Promise<ChatMessage> {
  const { conversationId, senderId, content } = params;
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Mensagem vazia');
  }

  const conv = await getConversationById(conversationId, senderId);
  if (!conv) {
    throw new Error('Conversa não encontrada');
  }

  try {
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const row = await withPrisma(async (db) => {
      const message = await db.message.create({
        data: {
          id,
          conversationId,
          senderId,
          content: trimmed,
        },
      });
      await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return message;
    });
    return mapMessage(row);
  } catch (e) {
    handleDbError(e, 'sendMessage');
  }
}

export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const conv = await getConversationById(conversationId, userId);
  if (!conv) return;

  try {
    await withPrisma((db) =>
      db.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt: new Date() },
      })
    );
  } catch (e) {
    handleDbError(e, 'markConversationAsRead');
  }
}

export async function getUnreadCountForUser(userId: string): Promise<number> {
  try {
    return await withPrisma((db) =>
      db.message.count({
        where: {
          readAt: null,
          senderId: { not: userId },
          conversation: {
            OR: [{ participant1Id: userId }, { participant2Id: userId }],
          },
        },
      })
    );
  } catch (e) {
    handleDbError(e, 'getUnreadCountForUser');
  }
}

export async function getUserByIdForChat(id: string): Promise<User | undefined> {
  try {
    const row = await withPrisma((db) => db.user.findUnique({ where: { id } }));
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      type: row.type as User['type'],
      bio: row.bio,
      stack: row.stack,
      github: row.github,
      linkedin: row.linkedin,
      website: row.website,
      stackSkills: row.stackSkills,
      company: row.company,
      profilePhoto: row.profilePhoto,
      resumeUrl: row.resumeUrl,
      resumeFileName: row.resumeFileName,
      createdAt: row.createdAt,
    };
  } catch (e) {
    handleDbError(e, 'getUserByIdForChat');
  }
}
