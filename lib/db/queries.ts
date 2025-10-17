import { db } from './index';
import { users, jobs, applications } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import type { User, Job, Application, NewUser, NewJob, NewApplication } from './schema';

// Funções para usuários
export async function getAllUsers(): Promise<User[]> {
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createUser(user: NewUser): Promise<User> {
  const result = await db.insert(users).values(user).returning();
  return result[0];
}

// Funções para vagas
export async function getAllJobs(): Promise<Job[]> {
  const dbJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  return dbJobs.map(job => ({
    ...job,
    requirements: JSON.parse(job.requirements as string)
  }));
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (result[0]) {
    return {
      ...result[0],
      requirements: JSON.parse(result[0].requirements as string)
    };
  }
  return undefined;
}

export async function getJobsByAuthor(authorId: string): Promise<Job[]> {
  const dbJobs = await db.select().from(jobs).where(eq(jobs.authorId, authorId)).orderBy(desc(jobs.createdAt));
  return dbJobs.map(job => ({
    ...job,
    requirements: JSON.parse(job.requirements as string)
  }));
}

export async function createJob(job: NewJob): Promise<Job> {
  const jobToInsert = {
    ...job,
    requirements: JSON.stringify(job.requirements)
  };
  const result = await db.insert(jobs).values(jobToInsert).returning();
  return {
    ...result[0],
    requirements: job.requirements
  };
}

export async function updateJob(id: string, job: Partial<NewJob>): Promise<Job | undefined> {
  const jobToUpdate = {
    ...job,
    requirements: job.requirements ? JSON.stringify(job.requirements) : undefined
  };
  const result = await db.update(jobs).set(jobToUpdate).where(eq(jobs.id, id)).returning();
  if (result[0]) {
    return {
      ...result[0],
      requirements: job.requirements || JSON.parse(result[0].requirements as string)
    };
  }
  return undefined;
}

export async function deleteJob(id: string): Promise<boolean> {
  const result = await db.delete(jobs).where(eq(jobs.id, id));
  return result.changes > 0;
}

// Funções para candidaturas
export async function getAllApplications(): Promise<Application[]> {
  return await db.select().from(applications).orderBy(desc(applications.createdAt));
}

export async function getApplicationById(id: string): Promise<Application | undefined> {
  const result = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0];
}

export async function getUserApplications(userId: string): Promise<Application[]> {
  return await db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
}

export async function getJobApplications(jobId: string): Promise<Application[]> {
  return await db.select().from(applications).where(eq(applications.jobId, jobId)).orderBy(desc(applications.createdAt));
}

export async function createApplication(application: NewApplication): Promise<Application> {
  const result = await db.insert(applications).values(application).returning();
  return result[0];
}

export async function hasApplied(userId: string, jobId: string): Promise<boolean> {
  const result = await db.select().from(applications).where(
    and(
      eq(applications.userId, userId),
      eq(applications.jobId, jobId)
    )
  ).limit(1);
  return result.length > 0;
}

// Função para buscar candidaturas com informações do usuário e vaga
export async function getApplicationsWithDetails() {
  return await db
    .select({
      application: applications,
      user: users,
      job: jobs,
    })
    .from(applications)
    .leftJoin(users, eq(applications.userId, users.id))
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.createdAt));
}
