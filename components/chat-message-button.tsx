"use client"

import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { buildMessagesUrl } from "@/lib/chat"

type ChatMessageButtonProps = {
  otherUserId: string
  jobId?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  label?: string
}

export function ChatMessageButton({
  otherUserId,
  jobId,
  variant = "outline",
  size = "sm",
  className,
  label = "Mensagem",
}: ChatMessageButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }
    if (user.id === otherUserId) return

    router.push(
      buildMessagesUrl({
        withUserId: otherUserId,
        jobId,
      })
    )
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {label}
    </Button>
  )
}
