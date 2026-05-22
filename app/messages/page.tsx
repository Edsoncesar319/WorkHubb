"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"
import {
  getConversation,
  getConversations,
  getMessages,
  getOrCreateConversation,
  markConversationRead,
  sendMessage,
  type ChatMessage,
  type ConversationDetail,
  type ConversationSummary,
} from "@/lib/chat"
import { Briefcase, MessageCircle, Send } from "lucide-react"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function otherUserLabel(other: ConversationSummary["otherUser"]) {
  if (other.type === "company") {
    return other.company || other.name
  }
  return other.name
}

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramConversationId = searchParams.get("c")
  const paramWithUserId = searchParams.get("with")
  const paramJobId = searchParams.get("job")

  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deepLinkHandled = useRef(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const loadConversations = useCallback(async (userId: string) => {
    const list = await getConversations(userId)
    setConversations(list)
    return list
  }, [])

  const openConversation = useCallback(
    async (userId: string, conversationId: string, detail?: ConversationDetail) => {
      setError(null)
      let conv = detail
      if (!conv) {
        const list = await getConversations(userId)
        const found = list.find((c) => c.id === conversationId)
        if (found) {
          conv = {
            id: found.id,
            jobId: found.jobId,
            jobTitle: found.jobTitle,
            participant1Id: "",
            participant2Id: "",
            otherUser: found.otherUser,
          }
        }
      }

      if (conv) {
        setActiveConversation(conv)
        setMobileShowThread(true)
      }

      const msgs = await getMessages(conversationId, userId)
      setMessages(msgs)
      await markConversationRead(conversationId, userId)
      await loadConversations(userId)
      scrollToBottom()

      router.replace(`/messages?c=${conversationId}`, { scroll: false })
    },
    [loadConversations, router, scrollToBottom]
  )

  const startConversationWith = useCallback(
    async (currentUser: User, otherUserId: string, jobId?: string) => {
      setError(null)
      const conv = await getOrCreateConversation({
        userId: currentUser.id,
        otherUserId,
        jobId,
      })
      await loadConversations(currentUser.id)
      await openConversation(currentUser.id, conv.id, conv)
    },
    [loadConversations, openConversation]
  )

  useEffect(() => {
    const current = getCurrentUser()
    if (!current) {
      router.push("/login")
      return
    }
    setUser(current)

    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await loadConversations(current.id)

        if (!deepLinkHandled.current) {
          deepLinkHandled.current = true

        if (paramWithUserId && paramWithUserId !== current.id) {
          await startConversationWith(current, paramWithUserId, paramJobId ?? undefined)
        } else if (paramConversationId) {
          const found = list.find((c) => c.id === paramConversationId)
          if (found) {
            await openConversation(current.id, paramConversationId, {
              id: found.id,
              jobId: found.jobId,
              jobTitle: found.jobTitle,
              participant1Id: "",
              participant2Id: "",
              otherUser: found.otherUser,
            })
          } else {
            const conv = await getConversation(paramConversationId, current.id)
            await openConversation(current.id, paramConversationId, conv)
          }
        }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erro ao carregar mensagens"
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once on mount
  }, [router])

  useEffect(() => {
    if (!user || !activeConversation) return

    const poll = async () => {
      try {
        const msgs = await getMessages(activeConversation.id, user.id)
        setMessages(msgs)
        await markConversationRead(activeConversation.id, user.id)
        await loadConversations(user.id)
      } catch {
        /* ignore polling errors */
      }
    }

    pollRef.current = setInterval(poll, 4000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [user, activeConversation, loadConversations])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !activeConversation || !draft.trim() || sending) return

    setSending(true)
    setError(null)
    try {
      const sent = await sendMessage({
        conversationId: activeConversation.id,
        userId: user.id,
        content: draft,
      })
      setMessages((prev) => [...prev, sent])
      setDraft("")
      await loadConversations(user.id)
      scrollToBottom()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao enviar")
    } finally {
      setSending(false)
    }
  }

  const selectConversation = (summary: ConversationSummary) => {
    if (!user) return
    openConversation(user.id, summary.id, {
      id: summary.id,
      jobId: summary.jobId,
      jobTitle: summary.jobTitle,
      participant1Id: "",
      participant2Id: "",
      otherUser: summary.otherUser,
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-primary" />
          Mensagens
        </h1>
        <p className="text-muted-foreground mt-1">
          Converse com empresas e profissionais sobre vagas e candidaturas
        </p>
      </div>

      {error && (
        <Card className="p-4 mb-4 border-destructive/50 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <Card className="overflow-hidden min-h-[560px] flex flex-col md:flex-row border-border">
        {/* Lista de conversas */}
        <div
          className={`md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-border flex flex-col ${
            mobileShowThread ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-border font-semibold text-sm text-muted-foreground">
            Conversas ({conversations.length})
          </div>
          <ScrollArea className="flex-1 max-h-[480px] md:max-h-none">
            {loading && conversations.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">Carregando...</p>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhuma conversa ainda.</p>
                <p className="text-xs mt-2">
                  Use &quot;Mensagem&quot; no perfil de um candidato ou em uma vaga.
                </p>
              </div>
            ) : (
              <ul>
                {conversations.map((conv) => {
                  const isActive = activeConversation?.id === conv.id
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => selectConversation(conv)}
                        className={`w-full text-left p-4 flex gap-3 hover:bg-muted/40 transition-colors border-b border-border/50 ${
                          isActive ? "bg-primary/10" : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={conv.otherUser.profilePhoto || undefined} />
                          <AvatarFallback>{getInitials(conv.otherUser.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">
                              {otherUserLabel(conv.otherUser)}
                            </span>
                            {conv.unreadCount > 0 && (
                              <Badge className="shrink-0 h-5 min-w-5 px-1.5">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conv.jobTitle && (
                            <p className="text-xs text-primary truncate flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3 shrink-0" />
                              {conv.jobTitle}
                            </p>
                          )}
                          {conv.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conv.lastMessage.senderId === user.id ? "Você: " : ""}
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>
        </div>

        {/* Thread */}
        <div
          className={`flex-1 flex flex-col min-h-[400px] ${
            !mobileShowThread && conversations.length > 0 ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversation ? (
            <>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden -ml-2"
                  onClick={() => setMobileShowThread(false)}
                >
                  Voltar
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={activeConversation.otherUser.profilePhoto || undefined}
                  />
                  <AvatarFallback>
                    {getInitials(activeConversation.otherUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {otherUserLabel(activeConversation.otherUser)}
                  </p>
                  {activeConversation.jobTitle && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {activeConversation.jobTitle}
                    </p>
                  )}
                </div>
                {activeConversation.otherUser.type === "professional" && (
                  <Link
                    href={`/profile/${activeConversation.otherUser.id}`}
                    className="ml-auto text-xs text-primary hover:underline shrink-0"
                  >
                    Ver perfil
                  </Link>
                )}
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3 min-h-[280px]">
                  {messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-12">
                      Envie a primeira mensagem
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user.id
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <form
                onSubmit={handleSend}
                className="p-4 border-t border-border flex gap-2"
              >
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={sending}
                  className="flex-1"
                  maxLength={4000}
                />
                <Button type="submit" disabled={sending || !draft.trim()} className="glow-effect">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
              <div>
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Selecione uma conversa</p>
                <p className="text-sm mt-2">ou inicie pelo perfil de um candidato / vaga</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
