export type UserType = "professional" | "company"

export interface User {
  id: string
  name: string
  email: string
  type: UserType
  bio?: string
  stack?: string
  stackSkills?: string
  github?: string
  linkedin?: string
  website?: string
  company?: string
  profilePhoto?: string
  resumeUrl?: string
  resumeFileName?: string
  createdAt: string
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  hybrid?: boolean
  salary?: string
  description: string
  requirements: string[]
  authorId: string
  createdAt: string
}

export interface Application {
  id: string
  userId: string
  jobId: string
  message: string
  createdAt: string
}

export interface Experience {
  id: string
  userId: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
  createdAt: string
}
