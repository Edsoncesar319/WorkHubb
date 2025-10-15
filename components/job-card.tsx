import Link from "next/link"
import type { Job } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, DollarSign } from "lucide-react"

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="p-6 hover:border-primary/50 transition-all hover:glow-effect cursor-pointer">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">{job.title}</h3>
            <p className="text-muted-foreground font-medium">{job.company}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>

            {job.remote && (
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                Remoto
              </Badge>
            )}

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
        </div>
      </Card>
    </Link>
  )
}
