"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getCurrentUser, setCurrentUser } from "@/lib/auth"
import { getUserApplications, getJobById, updateUser, addUser } from "@/lib/data"
import { useDatabaseSync } from "@/hooks/use-database-sync"
import type { User, Application, Job } from "@/lib/types"
import { 
  Github, 
  Linkedin, 
  Mail, 
  Briefcase, 
  MapPin, 
  Calendar,
  Edit,
  TrendingUp,
  CheckCircle,
  Clock,
  User as UserIcon,
  Award,
  Target,
  Camera,
  Upload,
  X
} from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const { isInitialized } = useDatabaseSync()
  const [user, setUser] = useState<User | null>(null)
  const [applications, setApplications] = useState<Array<Application & { job?: Job }>>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    stack: "",
    github: "",
    linkedin: "",
    profilePhoto: ""
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (!isInitialized) return

    const loadUserData = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push("/login")
      return
    }

    setUser(currentUser)
      setEditForm({
        name: currentUser.name || "",
        bio: currentUser.bio || "",
        stack: currentUser.stack || "",
        github: currentUser.github || "",
        linkedin: currentUser.linkedin || "",
        profilePhoto: currentUser.profilePhoto || ""
      })

    if (currentUser.type === "professional") {
        try {
          const userApps = await getUserApplications(currentUser.id)
          const appsWithJobs = await Promise.all(
            userApps.map(async (app) => ({
        ...app,
              job: await getJobById(app.jobId),
      }))
          )
      setApplications(appsWithJobs)
        } catch (error) {
          console.error('Error loading applications:', error)
        }
      }
    }

    loadUserData()
  }, [router, isInitialized])

  const handleEditProfile = () => {
    if (user) {
      setEditForm({
        name: user.name || "",
        bio: user.bio || "",
        stack: user.stack || "",
        github: user.github || "",
        linkedin: user.linkedin || "",
        profilePhoto: user.profilePhoto || ""
      })
    }
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      let profilePhoto = editForm.profilePhoto

      // Convert selected image to base64 if there's a new image
      if (selectedImage) {
        profilePhoto = await convertToBase64(selectedImage)
      }

      const updatedUser = await updateUser(user.id, {
        name: editForm.name,
        bio: editForm.bio,
        stack: editForm.stack,
        github: editForm.github,
        linkedin: editForm.linkedin,
        profilePhoto: profilePhoto
      })

      if (updatedUser) {
        setUser(updatedUser)
        setIsEditModalOpen(false)
        setSelectedImage(null)
        setImagePreview(null)
        // Persist session with consistent helper
        setCurrentUser(updatedUser)
      } else {
        // If the user doesn't exist in DB (e.g., after a DB reset), create it
        const newUser = await addUser({
          id: user.id,
          name: editForm.name,
          email: user.email,
          type: user.type,
          bio: editForm.bio,
          stack: editForm.stack,
          github: editForm.github,
          linkedin: editForm.linkedin,
          company: user.company,
          profilePhoto: profilePhoto,
        })
        setUser(newUser)
        setIsEditModalOpen(false)
        setSelectedImage(null)
        setImagePreview(null)
        setCurrentUser(newUser)
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.')
        return
      }

      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setEditForm(prev => ({
      ...prev,
      profilePhoto: ""
    }))
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  // Calculate profile statistics
  const totalApplications = applications.length
  const recentApplications = applications.filter(app => {
    const appDate = new Date(app.createdAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return appDate >= thirtyDaysAgo
  }).length

  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') {
      return 'U'
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage 
                  src={user.profilePhoto || "/placeholder-user.jpg"} 
                  alt={user.name || "Usuário"} 
                />
                <AvatarFallback className="text-2xl font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{user.name || "Usuário"}</h1>
              <Badge variant="secondary" className="mb-4">
                {user.type === "professional" ? "Profissional" : "Empresa"}
              </Badge>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Membro desde {user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Profile Stats */}
            {user.type === "professional" && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{totalApplications}</div>
                  <div className="text-sm text-muted-foreground">Candidaturas</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{recentApplications}</div>
                  <div className="text-sm text-muted-foreground">Últimos 30 dias</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {user.stack ? user.stack.split(',').length : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Habilidades</div>
                </div>
              </div>
            )}
          </div>

          {/* Edit Profile Button */}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleEditProfile}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Sobre</h2>
            </div>

              {user.bio ? (
                <p className="text-muted-foreground leading-relaxed">{user.bio}</p>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Adicione uma biografia para destacar seu perfil</p>
                  <Button variant="outline" size="sm" onClick={handleEditProfile}>
                    <Edit className="w-4 h-4 mr-2" />
                    Adicionar Biografia
                  </Button>
                </div>
              )}
            </Card>

            {/* Skills Section */}
            {user.stack && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Habilidades Técnicas</h2>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {user.stack?.split(",").map((tech, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {tech?.trim() || ""}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Experience Section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Experiência</h2>
              </div>
              
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Adicione sua experiência profissional</p>
                <Button variant="outline" size="sm" onClick={handleEditProfile}>
                  <Edit className="w-4 h-4 mr-2" />
                  Adicionar Experiência
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Informações de Contato</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>

            {user.github && (
                  <div className="flex items-center gap-3">
                    <Github className="w-4 h-4 text-muted-foreground" />
                <a
                  href={user.github?.startsWith("http") ? user.github : `https://${user.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                      className="text-sm hover:text-primary transition-colors"
                >
                      GitHub
                </a>
              </div>
            )}

            {user.linkedin && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                <a
                  href={user.linkedin?.startsWith("http") ? user.linkedin : `https://${user.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                      className="text-sm hover:text-primary transition-colors"
                >
                      LinkedIn
                </a>
              </div>
            )}
          </div>
        </Card>

            {/* Profile Completion */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Completude do Perfil</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Perfil Completo</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Complete seu perfil para aumentar suas chances
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                <Link href="/jobs" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    Buscar Vagas
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Estatísticas
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Applications History (for professionals) */}
        {user.type === "professional" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Minhas Candidaturas</h2>
              </div>
              <Badge variant="outline">{totalApplications} candidaturas</Badge>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma candidatura ainda</h3>
                <p className="text-muted-foreground mb-6">Comece explorando as vagas disponíveis</p>
                <Link href="/jobs">
                  <Button>
                    <Target className="w-4 h-4 mr-2" />
                    Explorar Vagas
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <Card key={app.id} className="p-4 border-l-4 border-l-primary">
                    {app.job ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{app.job.title}</h3>
                            <p className="text-muted-foreground">{app.job.company}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {app.job.remote ? "Remoto" : app.job.location}
                            </div>
                          </div>
                        </div>

                        {app.message && (
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-sm">
                              <strong>Sua mensagem:</strong> {app.message}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                        <Link href={`/jobs/${app.job.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Vaga
                          </Button>
                        </Link>
                          <Button variant="ghost" size="sm">
                            Ver Status
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Vaga não encontrada</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Edit Profile Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Profile Photo */}
              <div className="space-y-2">
                <Label>Foto de Perfil</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage 
                        src={imagePreview || user.profilePhoto || "/placeholder-user.jpg"} 
                        alt="Preview" 
                      />
                      <AvatarFallback className="text-lg">
                        {getInitials(editForm.name || user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    {imagePreview && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={removeImage}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="profile-photo-upload"
                    />
                    <Label 
                      htmlFor="profile-photo-upload" 
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-dashed border-muted-foreground/25 rounded-md hover:border-muted-foreground/50 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      {selectedImage ? "Alterar Foto" : "Escolher Foto"}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG ou GIF. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Conte um pouco sobre você, sua experiência e objetivos profissionais..."
                  rows={4}
                />
              </div>

              {/* Stack */}
              <div className="space-y-2">
                <Label htmlFor="stack">Habilidades Técnicas</Label>
                <Input
                  id="stack"
                  value={editForm.stack}
                  onChange={(e) => handleInputChange("stack", e.target.value)}
                  placeholder="React, Node.js, TypeScript, Python..."
                />
                <p className="text-sm text-muted-foreground">
                  Separe as tecnologias por vírgula
                </p>
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={editForm.github}
                  onChange={(e) => handleInputChange("github", e.target.value)}
                  placeholder="https://github.com/seuusuario"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={editForm.linkedin}
                  onChange={(e) => handleInputChange("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/in/seuusuario"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading || !editForm.name?.trim()}
                >
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
