"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getCurrentUser } from "@/lib/auth"
import { getCandidateProfile, type CandidateProfile } from "@/lib/data"
import { useDatabaseSync } from "@/hooks/use-database-sync"
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Github,
  Linkedin,
  Mail,
  MapPin,
  User as UserIcon,
  Award,
} from "lucide-react"

function getInitials(name: string | undefined) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("pt-BR")
}

export default function CandidateProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isInitialized } = useDatabaseSync()
  const candidateId = params.id as string
  const jobId = searchParams.get("job") ?? undefined

  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!isInitialized) return

    const viewer = getCurrentUser()
    if (!viewer) {
      router.push("/login")
      return
    }
    if (viewer.type !== "company") {
      router.push("/profile")
      return
    }
    if (viewer.id === candidateId) {
      router.push("/profile")
      return
    }

    getCandidateProfile(candidateId, viewer.id, jobId)
      .then((data) => {
        if (!data) {
          setDenied(true)
        } else {
          setProfile(data)
        }
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false))
  }, [isInitialized, candidateId, jobId, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Carregando perfil do candidato...
      </div>
    )
  }

  if (denied || !profile) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg mx-auto text-center space-y-4">
        <UserIcon className="w-16 h-16 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold">Perfil indisponível</h1>
        <p className="text-muted-foreground">
          Só é possível ver candidatos que se candidataram às suas vagas.
        </p>
        <Link href="/profile">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao perfil
          </Button>
        </Link>
      </div>
    )
  }

  const { candidate, experiences, applications } = profile
  const highlightedApplication = jobId
    ? applications.find((a) => a.application.jobId === jobId)
    : applications[0]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos candidatos
          </Button>
        </Link>

        <Card className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <Avatar className="w-28 h-28 shrink-0">
              <AvatarImage
                src={candidate.profilePhoto || "/placeholder-user.jpg"}
                alt={candidate.name}
              />
              <AvatarFallback className="text-2xl">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{candidate.name}</h1>
                <Badge variant="secondary" className="mt-2">
                  Candidato
                </Badge>
              </div>

              {candidate.bio && (
                <p className="text-muted-foreground leading-relaxed">{candidate.bio}</p>
              )}

              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href={`mailto:${candidate.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Mail className="w-4 h-4" />
                  {candidate.email}
                </a>
                {candidate.github && (
                  <a
                    href={
                      candidate.github.startsWith("http")
                        ? candidate.github
                        : `https://${candidate.github}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                )}
                {candidate.linkedin && (
                  <a
                    href={
                      candidate.linkedin.startsWith("http")
                        ? candidate.linkedin
                        : `https://${candidate.linkedin}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>

        {candidate.stack && (
          <Card className="p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-primary" />
              Habilidades
            </h2>
            <div className="flex flex-wrap gap-2">
              {candidate.stack.split(",").map((skill, idx) => (
                <Badge key={idx} variant="outline">
                  {skill.trim()}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {highlightedApplication && (
          <Card className="p-6 border-l-4 border-l-primary">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-primary" />
              Candidatura
              {jobId ? " nesta vaga" : ""}
            </h2>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/jobs/${highlightedApplication.job.id}`}
                  className="font-semibold hover:text-primary"
                >
                  {highlightedApplication.job.title}
                </Link>
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(highlightedApplication.application.createdAt)}
                </Badge>
              </div>
              {highlightedApplication.application.message && (
                <div className="bg-muted/40 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-1">Mensagem do candidato</p>
                  <p className="text-muted-foreground">
                    {highlightedApplication.application.message}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {applications.length > 1 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Outras candidaturas às suas vagas</h2>
            <ul className="space-y-2">
              {applications
                .filter((a) => a.application.jobId !== highlightedApplication?.application.jobId)
                .map(({ application, job }) => (
                  <li key={application.id} className="flex justify-between items-center text-sm">
                    <Link href={`/jobs/${job.id}`} className="hover:text-primary font-medium">
                      {job.title}
                    </Link>
                    <span className="text-muted-foreground">
                      {formatDate(application.createdAt)}
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
            <Briefcase className="w-5 h-5 text-primary" />
            Experiência profissional
          </h2>
          {experiences.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              O candidato ainda não cadastrou experiências.
            </p>
          ) : (
            <div className="space-y-6">
              {experiences.map((exp, index) => (
                <div key={exp.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{exp.title}</h3>
                    <p className="text-primary font-medium">{exp.company}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {exp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {exp.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {exp.startDate}
                        {" — "}
                        {exp.current ? "Atual" : exp.endDate || "—"}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
