"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Job, User } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, DollarSign } from "lucide-react"
import { WorkModeBadge } from "@/components/work-mode-badge"
import { ChatMessageButton } from "@/components/chat-message-button"
import { getCurrentUser } from "@/lib/auth"

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const showContactResponsible =
    !!job.authorId &&
    (!user || (user.type === "professional" && user.id !== job.authorId))

  return (
    <Card className="p-6 hover:border-primary/50 transition-all">
      <div className="space-y-4">
        <div>
          <Link href={`/jobs/${job.id}`} className="group">
            <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
          </Link>
          <p className="text-muted-foreground font-medium">{job.company}</p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>

          <WorkModeBadge job={job} />

          {job.salary && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{job.salary}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

        <div className="flex flex-wrap gap-2">
          {job.requirements.slice(0, 4).map((req, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {req}
            </Badge>
          ))}
          {job.requirements.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{job.requirements.length - 4}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Link href={`/jobs/${job.id}`}>
            <Button variant="outline" size="sm">
              Ver vaga
            </Button>
          </Link>
          {showContactResponsible && (
            <ChatMessageButton
              otherUserId={job.authorId}
              jobId={job.id}
              size="sm"
              label="Falar com responsável"
            />
          )}
        </div>
      </div>
    </Card>
  )
}
