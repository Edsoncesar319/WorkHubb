import type { Job, Application, User, Experience } from "./types"

// Funções para vagas
export async function getJobs(): Promise<Job[]> {
  const response = await fetch('/api/jobs')
  if (!response.ok) {
    throw new Error('Failed to fetch jobs')
  }
  return await response.json()
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const response = await fetch(`/api/jobs/${id}`)
  if (!response.ok) {
    if (response.status === 404) return undefined
    throw new Error('Failed to fetch job')
  }
  return await response.json()
}

export async function getJobsByAuthor(authorId: string): Promise<Job[]> {
  const response = await fetch(`/api/jobs/author/${authorId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch jobs by author')
  }
  return await response.json()
}

export async function addJob(job: Omit<Job, "id" | "createdAt">): Promise<Job> {
  const newJob = {
    ...job,
    id: Date.now().toString(),
  }
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newJob),
  })
  if (!response.ok) {
    throw new Error('Failed to create job')
  }
  return await response.json()
}

// Funções para candidaturas
export async function getApplications(): Promise<Application[]> {
  const response = await fetch('/api/applications')
  if (!response.ok) {
    throw new Error('Failed to fetch applications')
  }
  return await response.json()
}

export async function addApplication(application: Omit<Application, "id" | "createdAt">): Promise<Application> {
  const newApplication = {
    ...application,
    id: Date.now().toString(),
  }
  const response = await fetch('/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newApplication),
  })
  if (!response.ok) {
    throw new Error('Failed to create application')
  }
  return await response.json()
}

export async function getUserApplications(userId: string): Promise<Application[]> {
  const applications = await getApplications()
  return applications.filter(app => app.userId === userId)
}

export async function hasApplied(userId: string, jobId: string): Promise<boolean> {
  const response = await fetch(`/api/applications/check?userId=${userId}&jobId=${jobId}`)
  if (!response.ok) {
    throw new Error('Failed to check application')
  }
  const data = await response.json()
  return data.applied
}

export async function getJobApplications(jobId: string): Promise<Array<{ application: Application; user: User | null }>> {
  const response = await fetch(`/api/applications/job/${jobId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch job applications')
  }
  return await response.json()
}

// Funções para usuários
export async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users')
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  return await response.json()
}

export async function addUser(user: User): Promise<User> {
  try {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })
    
  if (!response.ok) {
      let errorMessage = 'Failed to create user'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
        console.error('API Error Response:', errorData)
      } catch (e) {
        console.error('Failed to parse error response:', e)
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      throw new Error(errorMessage)
  }
    
  return await response.json()
  } catch (error: any) {
    console.error('Error in addUser:', error)
    throw error
  }
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  try {
    const response = await fetch(`/api/users/email/${encodeURIComponent(email)}`)
    
    // 404 significa que o usuário não existe, o que é válido
    if (response.status === 404) {
      return undefined
    }
    
    if (!response.ok) {
      // Tentar obter mensagem de erro da resposta
      let errorMessage = 'Failed to fetch user'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // Se não conseguir parsear JSON, usar mensagem padrão
      }
      console.error('Error fetching user by email:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage
      })
      
      // Se for erro 500 relacionado ao banco não configurado, lançar erro específico
      if (response.status === 500 && (
        errorMessage.includes('Vercel Postgres não configurado') ||
        errorMessage.includes('not configured') ||
        errorMessage.includes('not available')
      )) {
        throw new Error('Vercel Postgres não configurado')
      }
      
      throw new Error(errorMessage)
    }
    
    return await response.json()
  } catch (error: any) {
    // Se for um erro relacionado ao banco não configurado, lançar para que o login mostre mensagem apropriada
    if (error?.message?.includes('Vercel Postgres não configurado') ||
        error?.message?.includes('not configured') ||
        error?.message?.includes('not available')) {
      throw error
    }
    
    // Se for um erro de rede ou outro erro, logar mas não lançar
    // Retornar undefined para permitir que o registro continue
    console.error('Error finding user by email:', error)
    
    // Se for um erro de rede (fetch falhou), retornar undefined
    // para permitir que o registro continue (assumindo que o email não existe)
    if (error?.message?.includes('fetch') || error?.name === 'TypeError') {
      console.warn('Network error when checking email, allowing registration to continue')
      return undefined
    }
    
    // Para outros erros, lançar para que o usuário saiba que algo deu errado
    throw error
  }
}

export async function updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
  try {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    })
    if (!response.ok) {
      if (response.status === 404) return undefined
      throw new Error('Failed to update user')
    }
    return await response.json()
  } catch (error) {
    console.error('Error updating user:', error)
    return undefined
  }
}

// Funções para experiências profissionais
export async function getExperiences(): Promise<Experience[]> {
  const response = await fetch('/api/experiences')
  if (!response.ok) {
    throw new Error('Failed to fetch experiences')
  }
  return await response.json()
}

export async function getExperienceById(id: string): Promise<Experience | undefined> {
  const response = await fetch(`/api/experiences/${id}`)
  if (!response.ok) {
    if (response.status === 404) return undefined
    throw new Error('Failed to fetch experience')
  }
  return await response.json()
}

export async function getUserExperiences(userId: string): Promise<Experience[]> {
  const response = await fetch(`/api/experiences/user/${userId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch user experiences')
  }
  return await response.json()
}

export async function addExperience(experience: Omit<Experience, "id" | "createdAt">): Promise<Experience> {
  const newExperience = {
    ...experience,
    id: Date.now().toString(),
  }
  const response = await fetch('/api/experiences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newExperience),
  })
  if (!response.ok) {
    throw new Error('Failed to create experience')
  }
  return await response.json()
}

export async function updateExperience(id: string, experience: Partial<Experience>): Promise<Experience | undefined> {
  try {
    const response = await fetch(`/api/experiences/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(experience),
    })
    if (!response.ok) {
      if (response.status === 404) return undefined
      throw new Error('Failed to update experience')
    }
    return await response.json()
  } catch (error) {
    console.error('Error updating experience:', error)
    return undefined
  }
}

export async function deleteExperience(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/experiences/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      if (response.status === 404) return false
      throw new Error('Failed to delete experience')
    }
    return true
  } catch (error) {
    console.error('Error deleting experience:', error)
    return false
  }
}
