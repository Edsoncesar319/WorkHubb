import type { Job, Application, User } from "./types"

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

// Funções para usuários
export async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users')
  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }
  return await response.json()
}

export async function addUser(user: User): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })
  if (!response.ok) {
    throw new Error('Failed to create user')
  }
  return await response.json()
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  try {
    const response = await fetch(`/api/users/email/${encodeURIComponent(email)}`)
    if (!response.ok) {
      if (response.status === 404) return undefined
      throw new Error('Failed to fetch user')
    }
    return await response.json()
  } catch (error) {
    console.error('Error finding user by email:', error)
    return undefined
  }
}
