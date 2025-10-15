"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { User, UserType } from "@/lib/types"
import { setCurrentUser } from "@/lib/auth"
import { addUser, findUserByEmail } from "@/lib/data"

export default function RegisterPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<UserType>("professional")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    stack: "",
    github: "",
    linkedin: "",
    company: "",
  })
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos obrigatórios")
      return
    }

    if (findUserByEmail(formData.email)) {
      setError("Este email já está cadastrado")
      return
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      type: userType,
      bio: formData.bio || undefined,
      stack: formData.stack || undefined,
      github: formData.github || undefined,
      linkedin: formData.linkedin || undefined,
      company: userType === "company" ? formData.company : undefined,
      createdAt: new Date().toISOString(),
    }

    addUser(newUser)
    setCurrentUser(newUser)
    router.push(userType === "company" ? "/dashboard" : "/jobs")
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Criar Conta</h1>
          <p className="text-muted-foreground">Junte-se ao WorkHubb e encontre as melhores oportunidades</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType("professional")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    userType === "professional"
                      ? "border-primary bg-primary/10 glow-effect"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold">Profissional</div>
                  <div className="text-sm text-muted-foreground">Buscar vagas</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("company")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    userType === "company"
                      ? "border-primary bg-primary/10 glow-effect"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold">Empresa</div>
                  <div className="text-sm text-muted-foreground">Publicar vagas</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={userType === "company" ? "Nome da Empresa" : "Seu nome completo"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            {userType === "professional" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Conte um pouco sobre você..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stack">Stack Tecnológica</Label>
                  <Input
                    id="stack"
                    value={formData.stack}
                    onChange={(e) => setFormData({ ...formData, stack: e.target.value })}
                    placeholder="React, Node.js, TypeScript..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="github.com/seu-usuario"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/seu-perfil"
                    />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full glow-effect" size="lg">
              Criar Conta
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}
