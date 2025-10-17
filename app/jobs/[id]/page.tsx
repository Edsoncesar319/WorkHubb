"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getJobById, addApplication, hasApplied } from "@/lib/data"
import { getCurrentUser } from "@/lib/auth"
import type { Job } from "@/lib/types"
import { MapPin, DollarSign, Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [message, setMessage] = useState("")
  const [applied, setApplied] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const user = getCurrentUser()

  useEffect(() => {
    const loadJobData = async () => {
      const foundJob = await getJobById(params.id)
      if (foundJob) {
        setJob(foundJob)
        if (user) {
          const hasUserApplied = await hasApplied(user.id, params.id)
          setApplied(hasUserApplied)
        }
      }
    }
    loadJobData()
  }, [params.id, user])

  const handleApply = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.type === "company") {
      alert("Empresas não podem se candidatar a vagas")
      return
    }

    if (!job) return

    await addApplication({
      userId: user.id,
      jobId: job.id,
      message,
    })

    setApplied(true)
    setShowApplicationForm(false)
    setMessage("")
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground">Vaga não encontrada</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/jobs">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para vagas
        </Button>
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{job.title}</h1>
            <div className="flex items-center gap-2 text-lg text-muted-foreground">
              <Building2 className="w-5 h-5" />
              <span className="font-medium">{job.company}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5" />
              <span>{job.location}</span>
            </div>

            {job.remote && <Badge className="bg-primary/20 text-primary border-primary/30">Remoto</Badge>}

            {job.salary && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-5 h-5" />
                <span>{job.salary}</span>
              </div>
            )}
          </div>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Sobre a Vaga</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{job.description}</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Requisitos</h2>
            <ul className="space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-muted-foreground">{req}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-24">
            {applied ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Candidatura Enviada!</h3>
                  <p className="text-sm text-muted-foreground">Você já se candidatou a esta vaga</p>
                </div>
              </div>
            ) : showApplicationForm ? (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Candidatar-se</h3>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem para o recrutador</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Conte por que você é o candidato ideal para esta vaga..."
                    rows={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApply} className="flex-1 glow-effect">
                    Enviar Candidatura
                  </Button>
                  <Button variant="outline" onClick={() => setShowApplicationForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowApplicationForm(true)} className="w-full glow-effect" size="lg">
                Candidatar-se
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
