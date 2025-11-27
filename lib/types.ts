export type UserType = "professional" | "company"

export interface User {
  id: string
  name: string
  email: string
  type: UserType
  bio?: string
  stack?: string
  github?: string
  linkedin?: string
  company?: string
  profilePhoto?: string
  createdAt: string
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
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
