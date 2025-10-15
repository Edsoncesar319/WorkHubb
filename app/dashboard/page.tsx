"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "@/lib/auth"
import { getJobs, addJob } from "@/lib/data"
import type { User, Job } from "@/lib/types"
import { Plus, Briefcase } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [myJobs, setMyJobs] = useState<Job[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    remote: false,
    salary: "",
    description: "",
    requirements: "",
  })

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
      return
    }

    if (currentUser.type !== "company") {
      router.push("/jobs")
      return
    }

    setUser(currentUser)
    loadMyJobs(currentUser.id)
  }, [router])

  const loadMyJobs = (userId: string) => {
    const allJobs = getJobs()
    const filtered = allJobs.filter((job) => job.authorId === userId)
    setMyJobs(filtered)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    const newJob = addJob({
      title: formData.title,
      company: user.company || user.name,
      location: formData.location,
      remote: formData.remote,
      salary: formData.salary || undefined,
      description: formData.description,
      requirements: formData.requirements
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      authorId: user.id,
    })

    setMyJobs([newJob, ...myJobs])
    setShowForm(false)
    setFormData({
      title: "",
      location: "",
      remote: false,
      salary: "",
      description: "",
      requirements: "",
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Gerencie suas vagas publicadas</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="glow-effect">
            <Plus className="w-4 h-4 mr-2" />
            Nova Vaga
          </Button>
        </div>

        {/* New Job Form */}
        {showForm && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Publicar Nova Vaga</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Vaga *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Desenvolvedor Full Stack Sênior"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Localização *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: São Paulo, SP"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Faixa Salarial</Label>
                  <Input
                    id="salary"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="Ex: R$ 8.000 - R$ 12.000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remote"
                  checked={formData.remote}
                  onChange={(e) => setFormData({ ...formData, remote: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="remote" className="cursor-pointer">
                  Trabalho Remoto
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a vaga, responsabilidades e benefícios..."
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requisitos (separados por vírgula) *</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="React, Node.js, TypeScript, 5+ anos de experiência"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="glow-effect">
                  Publicar Vaga
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* My Jobs List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Minhas Vagas ({myJobs.length})</h2>

          {myJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Você ainda não publicou nenhuma vaga</p>
              <Button onClick={() => setShowForm(true)}>Publicar Primeira Vaga</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {myJobs.map((job) => (
                <Card key={job.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{job.title}</h3>
                      <p className="text-muted-foreground">{job.location}</p>
                    </div>
                    <div className="flex gap-2">
                      {job.remote && <Badge className="bg-primary/20 text-primary border-primary/30">Remoto</Badge>}
                      <Badge variant="secondary">{new Date(job.createdAt).toLocaleDateString("pt-BR")}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {job.requirements.slice(0, 5).map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
