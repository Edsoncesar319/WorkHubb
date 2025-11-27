import { db } from './index';
import { users, jobs, applications, experiences } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import type { User, Job, Application, NewUser, NewJob, NewApplication, Experience, NewExperience } from './schema';

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
  try {
    // Validar dados obrigatórios
    if (!user.id || !user.name || !user.email || !user.type) {
      throw new Error('Campos obrigatórios faltando: id, name, email, type');
    }

    // Validar tipo de usuário
    if (user.type !== 'professional' && user.type !== 'company') {
      throw new Error('Tipo de usuário inválido. Deve ser "professional" ou "company"');
    }

    // Garantir que campos opcionais sejam null ao invés de undefined
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      bio: user.bio ?? null,
      stack: user.stack ?? null,
      github: user.github ?? null,
      linkedin: user.linkedin ?? null,
      company: user.company ?? null,
      profilePhoto: user.profilePhoto ?? null,
      createdAt: user.createdAt || new Date().toISOString(),
    };
    
    console.log('Creating user with data:', {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      type: userData.type,
      hasBio: !!userData.bio,
      hasStack: !!userData.stack,
    });
    
    // Verificar se o banco está disponível tentando acessá-lo
    try {
      // Testar se o banco está acessível
      const testQuery = await db.select().from(users).limit(0);
    } catch (testError: any) {
      console.error('Database access test failed:', testError);
      throw new Error('Banco de dados não está disponível. Verifique a configuração.');
    }
    
    const result = await db.insert(users).values(userData).returning();
    
    if (!result || result.length === 0) {
      throw new Error('Falha ao criar usuário: nenhum resultado retornado');
    }
    
    console.log('User created successfully:', result[0]?.id);
    return result[0];
  } catch (error: any) {
    console.error('Error in createUser:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sql: error?.sql,
      stack: error?.stack
    });
    
    // Re-throw com mensagem mais clara
    if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || error?.errno === 19) {
      throw new Error('Este email já está cadastrado');
    }
    
    // Se for erro de constraint, tentar identificar qual campo
    if (error?.message?.includes('UNIQUE constraint')) {
      throw new Error('Este email já está cadastrado');
    }
    
    // Se for erro de banco não disponível
    if (error?.message?.includes('Database not available')) {
      throw new Error('Banco de dados não está disponível. Verifique a configuração.');
    }
    
    throw new Error(error?.message || 'Erro ao criar usuário no banco de dados');
  }
}

export async function updateUser(id: string, user: Partial<NewUser>): Promise<User | undefined> {
  const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
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

// Funções para experiências profissionais
export async function getAllExperiences(): Promise<Experience[]> {
  return await db.select().from(experiences).orderBy(desc(experiences.startDate));
}

export async function getExperienceById(id: string): Promise<Experience | undefined> {
  const result = await db.select().from(experiences).where(eq(experiences.id, id)).limit(1);
  return result[0];
}

export async function getUserExperiences(userId: string): Promise<Experience[]> {
  return await db.select().from(experiences).where(eq(experiences.userId, userId)).orderBy(desc(experiences.startDate));
}

export async function createExperience(experience: NewExperience): Promise<Experience> {
  const result = await db.insert(experiences).values(experience).returning();
  return result[0];
}

export async function updateExperience(id: string, experience: Partial<NewExperience>): Promise<Experience | undefined> {
  const result = await db.update(experiences).set(experience).where(eq(experiences.id, id)).returning();
  return result[0];
}

export async function deleteExperience(id: string): Promise<boolean> {
  const result = await db.delete(experiences).where(eq(experiences.id, id));
  return result.changes > 0;
}
