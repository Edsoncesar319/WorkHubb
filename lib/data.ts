import type { Job, Application, User } from "./types"

const JOBS_KEY = "workhubb_jobs"
const APPLICATIONS_KEY = "workhubb_applications"
const USERS_KEY = "workhubb_users"

// Mock initial jobs
const initialJobs: Job[] = [
  {
    id: "1",
    title: "Senior Full Stack Developer",
    company: "TechCorp",
    location: "São Paulo, SP",
    remote: true,
    salary: "R$ 12.000 - R$ 18.000",
    description: "Estamos procurando um desenvolvedor full stack experiente para liderar projetos inovadores.",
    requirements: ["React", "Node.js", "TypeScript", "PostgreSQL", "5+ anos de experiência"],
    authorId: "company1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Frontend Developer React",
    company: "StartupXYZ",
    location: "Remoto",
    remote: true,
    salary: "R$ 8.000 - R$ 12.000",
    description: "Junte-se à nossa equipe para criar interfaces incríveis e responsivas.",
    requirements: ["React", "Next.js", "Tailwind CSS", "Git", "3+ anos de experiência"],
    authorId: "company2",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Backend Developer Python",
    company: "DataTech Solutions",
    location: "Rio de Janeiro, RJ",
    remote: false,
    salary: "R$ 10.000 - R$ 15.000",
    description: "Desenvolva APIs robustas e escaláveis para nossos produtos de dados.",
    requirements: ["Python", "Django/Flask", "PostgreSQL", "Docker", "AWS"],
    authorId: "company3",
    createdAt: new Date().toISOString(),
  },
]

export function getJobs(): Job[] {
  if (typeof window === "undefined") return initialJobs

  const stored = localStorage.getItem(JOBS_KEY)
  if (!stored) {
    localStorage.setItem(JOBS_KEY, JSON.stringify(initialJobs))
    return initialJobs
  }

  try {
    return JSON.parse(stored)
  } catch {
    return initialJobs
  }
}

export function getJobById(id: string): Job | undefined {
  return getJobs().find((job) => job.id === id)
}

export function addJob(job: Omit<Job, "id" | "createdAt">): Job {
  const jobs = getJobs()
  const newJob: Job = {
    ...job,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }

  jobs.unshift(newJob)
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
  return newJob
}

export function getApplications(): Application[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(APPLICATIONS_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function addApplication(application: Omit<Application, "id" | "createdAt">): Application {
  const applications = getApplications()
  const newApplication: Application = {
    ...application,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }

  applications.push(newApplication)
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
  return newApplication
}

export function getUserApplications(userId: string): Application[] {
  return getApplications().filter((app) => app.userId === userId)
}

export function hasApplied(userId: string, jobId: string): boolean {
  return getApplications().some((app) => app.userId === userId && app.jobId === jobId)
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(USERS_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function addUser(user: User) {
  const users = getUsers()
  users.push(user)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email === email)
}
