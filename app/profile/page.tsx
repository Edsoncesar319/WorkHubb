"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/auth"
import { getUserApplications, getJobById } from "@/lib/data"
import type { User, Application, Job } from "@/lib/types"
import { Github, Linkedin, Mail, Briefcase } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [applications, setApplications] = useState<Array<Application & { job?: Job }>>([])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
      return
    }

    setUser(currentUser)

    if (currentUser.type === "professional") {
      const userApps = getUserApplications(currentUser.id)
      const appsWithJobs = userApps.map((app) => ({
        ...app,
        job: getJobById(app.jobId),
      }))
      setApplications(appsWithJobs)
    }
  }, [router])

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
              <Badge variant="secondary" className="mb-4">
                {user.type === "professional" ? "Profissional" : "Empresa"}
              </Badge>
            </div>
          </div>

          {user.bio && <p className="text-muted-foreground mb-6 leading-relaxed">{user.bio}</p>}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-5 h-5" />
              <span>{user.email}</span>
            </div>

            {user.stack && (
              <div className="flex items-start gap-2">
                <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex flex-wrap gap-2">
                  {user.stack.split(",").map((tech, index) => (
                    <Badge key={index} variant="outline">
                      {tech.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {user.github && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Github className="w-5 h-5" />
                <a
                  href={user.github.startsWith("http") ? user.github : `https://${user.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {user.github}
                </a>
              </div>
            )}

            {user.linkedin && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Linkedin className="w-5 h-5" />
                <a
                  href={user.linkedin.startsWith("http") ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {user.linkedin}
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* Applications History (for professionals) */}
        {user.type === "professional" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Minhas Candidaturas</h2>

            {applications.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Você ainda não se candidatou a nenhuma vaga</p>
                <Link href="/jobs">
                  <Button>Explorar Vagas</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id} className="p-6">
                    {app.job ? (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{app.job.title}</h3>
                            <p className="text-muted-foreground">{app.job.company}</p>
                          </div>
                          <Badge variant="secondary">{new Date(app.createdAt).toLocaleDateString("pt-BR")}</Badge>
                        </div>

                        {app.message && (
                          <div className="bg-muted/30 rounded-lg p-4 mb-4">
                            <p className="text-sm text-muted-foreground">
                              <strong>Sua mensagem:</strong> {app.message}
                            </p>
                          </div>
                        )}

                        <Link href={`/jobs/${app.job.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Vaga
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Vaga não encontrada</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
