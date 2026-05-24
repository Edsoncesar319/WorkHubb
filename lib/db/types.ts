/** Tipos de domínio alinhados a `prisma/schema.prisma` */

export type UserType = 'professional' | 'company';

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  bio: string | null;
  stack: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
  company: string | null;
  profilePhoto: string | null;
  resumeUrl: string | null;
  resumeFileName: string | null;
  createdAt: string;
}

export interface NewUser {
  id: string;
  name: string;
  email: string;
  type: UserType;
  bio?: string | null;
  stack?: string | null;
  github?: string | null;
  linkedin?: string | null;
  website?: string | null;
  company?: string | null;
  profilePhoto?: string | null;
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  createdAt?: Date;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  hybrid: boolean;
  salary: string | null;
  description: string;
  requirements: string[];
  authorId: string;
  createdAt: string;
}

export interface NewJob {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  hybrid?: boolean;
  salary?: string | null;
  description: string;
  requirements: string[];
  authorId: string;
  createdAt?: Date;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  message: string;
  createdAt: string;
}

export interface NewApplication {
  id: string;
  userId: string;
  jobId: string;
  message: string;
  createdAt?: Date;
}

export interface Experience {
  id: string;
  userId: string;
  title: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
  createdAt: string;
}

export interface NewExperience {
  id: string;
  userId: string;
  title: string;
  company: string;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  description?: string | null;
  createdAt?: Date;
}
