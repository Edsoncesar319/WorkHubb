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
import { cn } from "@/lib/utils"
import { ArrowLeft, Briefcase, MessageCircle, Send } from "lucide-react"

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
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deepLinkHandled = useRef(false)

  const mobileChatFocus = mobileShowThread && !!activeConversation

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = messagesScrollRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior })
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior })
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

      requestAnimationFrame(() => scrollToBottom("auto"))

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
    scrollToBottom(messages.length <= 1 ? "auto" : "smooth")
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (!mobileChatFocus) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileChatFocus])

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

  const messageBubbles = (
    <div className="mx-auto w-full max-w-md space-y-3">
      {messages.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          Envie a primeira mensagem
        </p>
      ) : (
        messages.map((msg) => {
          const isMine = msg.senderId === user!.id
          return (
            <div
              key={msg.id}
              className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap break-words text-left">{msg.content}</p>
                <p
                  className={cn(
                    "text-[10px] mt-1 text-right",
                    isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })
      )}
      <div ref={messagesEndRef} aria-hidden />
    </div>
  )

  if (!user) {
    return null
  }

  return (
    <div
      className={cn(
        "mx-auto max-w-6xl",
        mobileChatFocus
          ? "fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col bg-background md:static md:inset-auto md:z-auto md:container md:px-4 md:py-8"
          : "container px-4 py-6 md:py-8 min-h-[calc(100dvh-4rem)] md:min-h-0"
      )}
    >
      <div
        className={cn(
          "mb-6 shrink-0",
          mobileChatFocus && "hidden md:block"
        )}
      >
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-primary" />
          Mensagens
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Converse com empresas e profissionais sobre vagas e candidaturas
        </p>
      </div>

      {error && (
        <Card
          className={cn(
            "p-3 mb-3 border-destructive/50 bg-destructive/10 shrink-0",
            mobileChatFocus && "mx-3 md:mx-0 rounded-lg"
          )}
        >
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <Card
        className={cn(
          "overflow-hidden flex flex-col border-border",
          mobileChatFocus
            ? "flex-1 min-h-0 rounded-none border-0 shadow-none md:min-h-[560px] md:rounded-xl md:border md:flex-row md:shadow-sm"
            : "min-h-[calc(100dvh-11rem)] md:min-h-[560px] md:flex-row"
        )}
      >
        {/* Lista de conversas */}
        <div
          className={cn(
            "border-border flex flex-col shrink-0",
            "md:w-80 lg:w-96 md:border-r",
            mobileChatFocus ? "hidden md:flex" : "flex flex-1 md:flex-none md:max-h-none",
            !mobileChatFocus && "border-b md:border-b-0"
          )}
        >
          <div className="p-4 border-b border-border font-semibold text-sm text-muted-foreground">
            Conversas ({conversations.length})
          </div>
          <ScrollArea className="flex-1 md:max-h-none">
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
                        className={cn(
                          "w-full text-left p-4 flex gap-3 hover:bg-muted/40 transition-colors border-b border-border/50",
                          isActive && "bg-primary/10"
                        )}
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

        {/* Thread — foco no mobile */}
        <div
          className={cn(
            "flex flex-col min-h-0 bg-background",
            mobileChatFocus
              ? "flex-1 w-full"
              : cn(
                  "flex-1",
                  !mobileShowThread && conversations.length > 0 && "hidden md:flex",
                  (!conversations.length || mobileShowThread) && "flex"
                )
          )}
        >
          {activeConversation ? (
            <>
              <div className="shrink-0 p-3 md:p-4 border-b border-border flex items-center gap-2 md:gap-3 bg-card/80 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  aria-label="Voltar para conversas"
                  onClick={() => {
                    setMobileShowThread(false)
                    router.replace("/messages", { scroll: false })
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage
                    src={activeConversation.otherUser.profilePhoto || undefined}
                  />
                  <AvatarFallback>
                    {getInitials(activeConversation.otherUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <p className="font-semibold truncate">
                    {otherUserLabel(activeConversation.otherUser)}
                  </p>
                  {activeConversation.jobTitle && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center md:justify-start gap-1 truncate">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      {activeConversation.jobTitle}
                    </p>
                  )}
                </div>
                {activeConversation.otherUser.type === "professional" && (
                  <Link
                    href={`/profile/${activeConversation.otherUser.id}`}
                    className="text-xs text-primary hover:underline shrink-0 hidden sm:inline"
                  >
                    Perfil
                  </Link>
                )}
              </div>

              {/* Área de mensagens — coluna centralizada, ancorada embaixo */}
              <div
                ref={messagesScrollRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 md:px-6"
              >
                <div className="min-h-full flex flex-col justify-end">
                  {messageBubbles}
                </div>
              </div>

              <form
                onSubmit={handleSend}
                className={cn(
                  "shrink-0 border-t border-border flex gap-2 bg-card/95 backdrop-blur-sm",
                  "p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4"
                )}
              >
                <div className="mx-auto w-full max-w-md flex gap-2">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={sending}
                    className="flex-1"
                    maxLength={4000}
                  />
                  <Button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="glow-effect shrink-0"
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
              <div className="max-w-xs mx-auto">
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
