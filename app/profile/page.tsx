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
import { getUserApplications, getJobById, updateUser, addUser, getJobsByAuthor, getJobApplications, getUserExperiences, addExperience, updateExperience, deleteExperience } from "@/lib/data"
import { useDatabaseSync } from "@/hooks/use-database-sync"
import { ImageCropper } from "@/components/image-cropper"
import type { User, Application, Job, Experience } from "@/lib/types"
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
  X,
  Plus,
  DollarSign,
  Building2
} from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const { isInitialized } = useDatabaseSync()
  const [user, setUser] = useState<User | null>(null)
  const [applications, setApplications] = useState<Array<Application & { job?: Job }>>([])
  const [companyJobs, setCompanyJobs] = useState<Job[]>([])
  const [jobApplications, setJobApplications] = useState<Record<string, Array<{ application: Application; user: User | null }>>>({})
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null)
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
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)

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
          
          // Carregar experiências profissionais
          const userExperiences = await getUserExperiences(currentUser.id)
          setExperiences(userExperiences)
        } catch (error) {
          console.error('Error loading applications:', error)
        }
      } else if (currentUser.type === "company") {
        try {
          // Carregar vagas da empresa
          const jobs = await getJobsByAuthor(currentUser.id)
          setCompanyJobs(jobs)
          
          // Carregar candidaturas para cada vaga
          const applicationsMap: Record<string, Array<{ application: Application; user: User | null }>> = {}
          for (const job of jobs) {
            try {
              const jobApps = await getJobApplications(job.id)
              applicationsMap[job.id] = jobApps
            } catch (error) {
              console.error(`Error loading applications for job ${job.id}:`, error)
              applicationsMap[job.id] = []
            }
          }
          setJobApplications(applicationsMap)
        } catch (error) {
          console.error('Error loading company data:', error)
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

      // Upload para Vercel Blob se houver nova imagem
      if (imagePreview && imagePreview !== user.profilePhoto) {
        // Se a imagem preview é base64 (data:), fazer upload para Blob
        if (imagePreview.startsWith('data:')) {
          try {
            profilePhoto = await uploadBase64ToBlob(imagePreview)
            console.log('Image uploaded to Vercel Blob:', profilePhoto)
          } catch (error) {
            console.error('Error uploading to blob, falling back to base64:', error)
            // Fallback para base64 se o upload falhar
            profilePhoto = imagePreview
          }
        } else {
          // Já é uma URL do Blob
          profilePhoto = imagePreview
        }
      } else if (selectedImage) {
        try {
          profilePhoto = await uploadToBlob(selectedImage)
          console.log('Image uploaded to Vercel Blob:', profilePhoto)
        } catch (error) {
          console.error('Error uploading to blob, falling back to base64:', error)
          // Fallback para base64 se o upload falhar
          profilePhoto = await convertToBase64(selectedImage)
        }
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
      
      // Create preview and open cropper
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setImageToCrop(imageData)
        setIsCropperOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setImageToCrop(null)
    setEditForm(prev => ({
      ...prev,
      profilePhoto: ""
    }))
  }

  const handleCropComplete = (croppedImage: string) => {
    setImagePreview(croppedImage)
    setIsCropperOpen(false)
    setImageToCrop(null)
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const uploadToBlob = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao fazer upload da imagem')
      }

      const data = await response.json()
      console.log('Upload successful:', {
        url: data.url,
        pathname: data.pathname
      })
      return data.url
    } catch (error: any) {
      console.error('Error uploading to blob:', error)
      throw error
    }
  }

  const uploadBase64ToBlob = async (base64String: string): Promise<string> => {
    try {
      // Opção 1: Enviar base64 diretamente via JSON (mais eficiente)
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64: base64String,
          fileName: 'profile-photo.jpg'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao fazer upload da imagem')
      }

      const data = await response.json()
      console.log('Base64 upload successful:', {
        url: data.url,
        pathname: data.pathname
      })
      return data.url
    } catch (error: any) {
      console.error('Error uploading base64 to blob:', error)
      // Fallback: tentar método antigo (converter para File primeiro)
      try {
        const response = await fetch(base64String)
        const blob = await response.blob()
        const file = new File([blob], 'profile-photo.jpg', { type: blob.type })
        return await uploadToBlob(file)
      } catch (fallbackError: any) {
        console.error('Fallback upload also failed:', fallbackError)
        throw error // Lançar o erro original
      }
    }
  }

  const [experienceForm, setExperienceForm] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: ""
  })

  const handleAddExperience = () => {
    setEditingExperience(null)
    setExperienceForm({
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: ""
    })
    setIsExperienceModalOpen(true)
  }

  const handleSaveExperience = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      if (editingExperience) {
        // Atualizar experiência existente
        const updated = await updateExperience(editingExperience.id, {
          title: experienceForm.title,
          company: experienceForm.company,
          location: experienceForm.location || undefined,
          startDate: experienceForm.startDate,
          endDate: experienceForm.current ? undefined : (experienceForm.endDate || undefined),
          current: experienceForm.current,
          description: experienceForm.description || undefined
        })
        if (updated) {
          setExperiences(experiences.map(e => e.id === updated.id ? updated : e))
          setIsExperienceModalOpen(false)
        }
      } else {
        // Criar nova experiência
        const newExp = await addExperience({
          userId: user.id,
          title: experienceForm.title,
          company: experienceForm.company,
          location: experienceForm.location || undefined,
          startDate: experienceForm.startDate,
          endDate: experienceForm.current ? undefined : (experienceForm.endDate || undefined),
          current: experienceForm.current,
          description: experienceForm.description || undefined
        })
        setExperiences([...experiences, newExp])
        setIsExperienceModalOpen(false)
      }
    } catch (error) {
      console.error("Erro ao salvar experiência:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditExperience = (exp: Experience) => {
    setEditingExperience(exp)
    setExperienceForm({
      title: exp.title,
      company: exp.company,
      location: exp.location || "",
      startDate: exp.startDate,
      endDate: exp.endDate || "",
      current: exp.current,
      description: exp.description || ""
    })
    setIsExperienceModalOpen(true)
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
            
            {user.type === "company" && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{companyJobs.length}</div>
                  <div className="text-sm text-muted-foreground">Vagas Publicadas</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(jobApplications).flat().length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Candidaturas</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {companyJobs.filter(job => (jobApplications[job.id]?.length || 0) > 0).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Vagas com Candidatos</div>
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
            {user.type === "professional" && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Experiência Profissional</h2>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddExperience}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Experiência
                  </Button>
                </div>
                
                {experiences.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Adicione sua experiência profissional</p>
                    <Button variant="outline" size="sm" onClick={handleAddExperience}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Experiência
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <Card key={exp.id} className="p-4 border-l-4 border-l-primary">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{exp.title}</h3>
                            <p className="text-muted-foreground font-medium mb-2">{exp.company}</p>
                            {exp.location && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <MapPin className="w-4 h-4" />
                                <span>{exp.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(exp.startDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })} - {
                                  exp.current ? "Atual" : exp.endDate ? new Date(exp.endDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "N/A"
                                }
                              </span>
                            </div>
                            {exp.description && (
                              <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditExperience(exp)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm("Tem certeza que deseja excluir esta experiência?")) {
                                  const deleted = await deleteExperience(exp.id)
                                  if (deleted) {
                                    setExperiences(experiences.filter(e => e.id !== exp.id))
                                  }
                                }
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            )}
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

        {/* Company Jobs and Applications */}
        {user.type === "company" && (
          <>
            {/* Company Jobs Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Vagas Publicadas</h2>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{companyJobs.length} vagas</Badge>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Vaga
                    </Button>
                  </Link>
                </div>
              </div>

              {companyJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma vaga publicada ainda</h3>
                  <p className="text-muted-foreground mb-6">Comece publicando sua primeira vaga</p>
                  <Link href="/dashboard">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Publicar Vaga
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {companyJobs.map((job) => {
                    const applications = jobApplications[job.id] || []
                    return (
                      <Card key={job.id} className="p-4 border-l-4 border-l-primary">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                              <p className="text-muted-foreground text-sm mb-2">{job.location}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                            </div>
                            <div className="text-right ml-4">
                              <Badge variant="secondary" className="mb-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(job.createdAt).toLocaleDateString("pt-BR")}
                              </Badge>
                              {job.remote && (
                                <Badge className="bg-primary/20 text-primary border-primary/30 mt-1">
                                  Remoto
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {applications.length} {applications.length === 1 ? 'candidato' : 'candidatos'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/jobs/${job.id}`}>
                                <Button variant="outline" size="sm">
                                  Ver Vaga
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Company Applications Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Candidatos</h2>
                </div>
                <Badge variant="outline">
                  {Object.values(jobApplications).flat().length} candidaturas
                </Badge>
              </div>

              {Object.values(jobApplications).flat().length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma candidatura ainda</h3>
                  <p className="text-muted-foreground">As candidaturas aparecerão aqui quando profissionais se candidatarem às suas vagas</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {companyJobs.map((job) => {
                    const applications = jobApplications[job.id] || []
                    if (applications.length === 0) return null

                    // Função para verificar correspondência de habilidades
                    const getMatchingSkills = (candidateStack: string | undefined, jobRequirements: string[]) => {
                      if (!candidateStack) return { matching: [], missing: jobRequirements }
                      const candidateSkills = candidateStack.split(',').map(s => s.trim().toLowerCase())
                      const requirements = jobRequirements.map(r => r.trim().toLowerCase())
                      
                      const matching = requirements.filter(req => 
                        candidateSkills.some(skill => 
                          skill.includes(req) || req.includes(skill) ||
                          skill.split(' ').some(word => req.includes(word)) ||
                          req.split(' ').some(word => skill.includes(word))
                        )
                      )
                      const missing = requirements.filter(req => !matching.includes(req))
                      
                      return { matching, missing }
                    }

                    return (
                      <div key={job.id} className="space-y-4">
                        {/* Job Profile Card */}
                        <Card className="p-6 border-l-4 border-l-primary bg-muted/20">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Briefcase className="w-5 h-5 text-primary" />
                                  <h3 className="text-2xl font-bold">{job.title}</h3>
                                  <Badge variant="secondary">{applications.length} {applications.length === 1 ? 'candidato' : 'candidatos'}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                                  <Building2 className="w-4 h-4" />
                                  <span>{job.company}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{job.location}</span>
                              </div>
                              {job.remote && (
                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                  Remoto
                                </Badge>
                              )}
                              {job.salary && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <DollarSign className="w-4 h-4" />
                                  <span>{job.salary}</span>
                                </div>
                              )}
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold mb-2">Descrição da Vaga</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                {job.description}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-3">Requisitos</h4>
                              <div className="flex flex-wrap gap-2">
                                {job.requirements.map((req, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Candidates List */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            <UserIcon className="w-5 h-5" />
                            Candidatos ({applications.length})
                          </h4>
                          
                          {applications.map(({ application, user: candidate }) => {
                            const { matching, missing } = getMatchingSkills(candidate?.stack, job.requirements)
                            const matchPercentage = job.requirements.length > 0 
                              ? Math.round((matching.length / job.requirements.length) * 100) 
                              : 0

                            return (
                              <Card key={application.id} className="p-4 border-l-4 border-l-green-500">
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <Avatar className="w-12 h-12">
                                        <AvatarImage 
                                          src={candidate?.profilePhoto || "/placeholder-user.jpg"} 
                                          alt={candidate?.name || "Candidato"} 
                                        />
                                        <AvatarFallback>
                                          {candidate ? getInitials(candidate.name) : "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-semibold">{candidate?.name || "Candidato"}</h4>
                                          {matchPercentage > 0 && (
                                            <Badge 
                                              variant={matchPercentage >= 70 ? "default" : matchPercentage >= 50 ? "secondary" : "outline"}
                                              className="text-xs"
                                            >
                                              {matchPercentage}% match
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{candidate?.email}</p>
                                        {candidate?.bio && (
                                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                            {candidate.bio}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="secondary" className="mb-1">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(application.createdAt).toLocaleDateString("pt-BR")}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Skills Comparison */}
                                  {candidate?.stack && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-semibold">Habilidades do Candidato</h5>
                                        <span className="text-xs text-muted-foreground">
                                          {matching.length} de {job.requirements.length} requisitos atendidos
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {candidate.stack.split(',').map((tech, idx) => {
                                          const techLower = tech.trim().toLowerCase()
                                          const isMatching = matching.some(req => 
                                            req.includes(techLower) || techLower.includes(req) ||
                                            techLower.split(' ').some(word => req.includes(word)) ||
                                            req.split(' ').some(word => techLower.includes(word))
                                          )
                                          return (
                                            <Badge 
                                              key={idx} 
                                              variant={isMatching ? "default" : "outline"} 
                                              className="text-xs"
                                            >
                                              {tech.trim()}
                                            </Badge>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {application.message && (
                                    <div className="bg-muted/30 rounded-lg p-3">
                                      <p className="text-sm">
                                        <strong>Mensagem do candidato:</strong> {application.message}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex gap-2 pt-2 border-t">
                                    {candidate && (
                                      <>
                                        {candidate.github && (
                                          <a
                                            href={candidate.github.startsWith("http") ? candidate.github : `https://${candidate.github}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <Button variant="outline" size="sm">
                                              <Github className="w-4 h-4 mr-2" />
                                              GitHub
                                            </Button>
                                          </a>
                                        )}
                                        {candidate.linkedin && (
                                          <a
                                            href={candidate.linkedin.startsWith("http") ? candidate.linkedin : `https://${candidate.linkedin}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <Button variant="outline" size="sm">
                                              <Linkedin className="w-4 h-4 mr-2" />
                                              LinkedIn
                                            </Button>
                                          </a>
                                        )}
                                      </>
                                    )}
                                    <Link href={`/jobs/${job.id}`}>
                                      <Button variant="outline" size="sm">
                                        Ver Vaga Completa
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Image Cropper */}
        {imageToCrop && (
          <ImageCropper
            image={imageToCrop}
            isOpen={isCropperOpen}
            onClose={() => {
              setIsCropperOpen(false)
              setImageToCrop(null)
            }}
            onCrop={handleCropComplete}
            aspectRatio={1}
          />
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
                    <div className="flex flex-col gap-2">
                      <Label 
                        htmlFor="profile-photo-upload" 
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-dashed border-muted-foreground/25 rounded-md hover:border-muted-foreground/50 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        {selectedImage ? "Alterar Foto" : "Escolher Foto"}
                      </Label>
                      {imagePreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (imageToCrop) {
                              setIsCropperOpen(true)
                            } else if (selectedImage) {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                setImageToCrop(e.target?.result as string)
                                setIsCropperOpen(true)
                              }
                              reader.readAsDataURL(selectedImage)
                            }
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Ajustar Foto
                        </Button>
                      )}
                    </div>
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

        {/* Experience Modal */}
        <Dialog open={isExperienceModalOpen} onOpenChange={setIsExperienceModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExperience ? "Editar Experiência" : "Adicionar Experiência"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="exp-title">Cargo *</Label>
                <Input
                  id="exp-title"
                  value={experienceForm.title}
                  onChange={(e) => setExperienceForm({ ...experienceForm, title: e.target.value })}
                  placeholder="Ex: Desenvolvedor Full Stack"
                  required
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="exp-company">Empresa *</Label>
                <Input
                  id="exp-company"
                  value={experienceForm.company}
                  onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                  placeholder="Ex: TechCorp"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="exp-location">Localização</Label>
                <Input
                  id="exp-location"
                  value={experienceForm.location}
                  onChange={(e) => setExperienceForm({ ...experienceForm, location: e.target.value })}
                  placeholder="Ex: São Paulo, SP"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exp-start-date">Data de Início *</Label>
                  <Input
                    id="exp-start-date"
                    type="month"
                    value={experienceForm.startDate}
                    onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-end-date">Data de Término</Label>
                  <Input
                    id="exp-end-date"
                    type="month"
                    value={experienceForm.endDate}
                    onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                    disabled={experienceForm.current}
                  />
                </div>
              </div>

              {/* Current Job */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exp-current"
                  checked={experienceForm.current}
                  onChange={(e) => {
                    setExperienceForm({ 
                      ...experienceForm, 
                      current: e.target.checked,
                      endDate: e.target.checked ? "" : experienceForm.endDate
                    })
                  }}
                  className="w-4 h-4"
                />
                <Label htmlFor="exp-current" className="cursor-pointer">
                  Trabalho Atual
                </Label>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="exp-description">Descrição</Label>
                <Textarea
                  id="exp-description"
                  value={experienceForm.description}
                  onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                  placeholder="Descreva suas responsabilidades e conquistas..."
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsExperienceModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveExperience}
                  disabled={isLoading || !experienceForm.title?.trim() || !experienceForm.company?.trim() || !experienceForm.startDate}
                >
                  {isLoading ? "Salvando..." : editingExperience ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
