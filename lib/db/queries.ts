import { db, ensureDbInitialized } from './index';
import { users, jobs, applications, experiences } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import type { User, Job, Application, NewUser, NewJob, NewApplication, Experience, NewExperience } from './schema';

// Função auxiliar para garantir que o banco está inicializado antes de usar
async function getDb() {
  await ensureDbInitialized();
  return db;
}

// Funções para usuários
export async function getAllUsers(): Promise<User[]> {
  try {
    const database = await getDb();
    return await database.select().from(users).orderBy(desc(users.createdAt));
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    throw new Error(error?.message || 'Erro ao buscar usuários');
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  try {
    const database = await getDb();
    const result = await database.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  } catch (error: any) {
    console.error('Error in getUserById:', error);
    throw new Error(error?.message || 'Erro ao buscar usuário');
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const database = await getDb();
    const result = await database.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  } catch (error: any) {
    console.error('Error in getUserByEmail:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      email: email
    });
    throw new Error(error?.message || 'Erro ao buscar usuário por email');
  }
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
    // createdAt não precisa ser passado pois tem defaultNow() no schema
    const userData: any = {
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
    };
    
    console.log('Creating user with data:', {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      type: userData.type,
      hasBio: !!userData.bio,
      hasStack: !!userData.stack,
    });
    
    const database = await getDb();
    
    const result = await database.insert(users).values(userData).returning();
    
    if (!result || result.length === 0) {
      throw new Error('Falha ao criar usuário: nenhum resultado retornado');
    }
    
    console.log('User created successfully:', result[0]?.id);
    return result[0];
  } catch (error: any) {
    console.error('Error in createUser:', error);
    
    // Extrair o erro real se estiver aninhado
    const realError = error?.cause || error;
    const errorMessage = realError?.message || error?.message;
    const errorCode = realError?.code || error?.code;
    
    console.error('Error details:', {
      message: errorMessage,
      code: errorCode,
      errno: realError?.errno || error?.errno,
      sql: realError?.sql || error?.sql,
      name: realError?.name || error?.name,
      stack: error?.stack
    });
    
    // Re-throw com mensagem mais clara
    if (errorCode === '23505' || errorMessage?.includes('duplicate key value')) {
      throw new Error('Este email já está cadastrado');
    }
    
    // Erros de conexão/banco
    if (errorMessage?.includes('Failed to identify your database') || 
        errorMessage?.includes('A server error occurred') ||
        errorMessage?.includes('connection') ||
        errorMessage?.includes('ECONNREFUSED')) {
      throw new Error('Erro de conexão com o banco de dados. Verifique se o Postgres está configurado corretamente e se as variáveis POSTGRES_URL estão definidas.');
    }
    
    // Se for erro de banco não disponível
    if (errorMessage?.includes('Database not available') || 
        errorMessage?.includes('Postgres não configurado')) {
      throw new Error('Banco de dados não está disponível. Verifique a configuração.');
    }
    
    // Mensagem genérica com detalhes úteis
    const finalMessage = errorMessage || 'Erro ao criar usuário no banco de dados';
    throw new Error(finalMessage);
  }
}

export async function updateUser(id: string, user: Partial<NewUser>): Promise<User | undefined> {
  const database = await getDb();
  const result = await database.update(users).set(user).where(eq(users.id, id)).returning();
  return result[0];
}

// Funções para vagas
export async function getAllJobs(): Promise<Job[]> {
  const database = await getDb();
  const dbJobs = await database.select().from(jobs).orderBy(desc(jobs.createdAt));
  return dbJobs.map(job => ({
    ...job,
    requirements: JSON.parse(job.requirements as string)
  }));
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const database = await getDb();
  const result = await database.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (result[0]) {
    return {
      ...result[0],
      requirements: JSON.parse(result[0].requirements as string)
    };
  }
  return undefined;
}

export async function getJobsByAuthor(authorId: string): Promise<Job[]> {
  const database = await getDb();
  const dbJobs = await database.select().from(jobs).where(eq(jobs.authorId, authorId)).orderBy(desc(jobs.createdAt));
  return dbJobs.map(job => ({
    ...job,
    requirements: JSON.parse(job.requirements as string)
  }));
}

export async function createJob(job: NewJob): Promise<Job> {
  const database = await getDb();
  const jobToInsert = {
    ...job,
    requirements: JSON.stringify(job.requirements)
  };
  const result = await database.insert(jobs).values(jobToInsert).returning();
  return {
    ...result[0],
    requirements: job.requirements
  };
}

export async function updateJob(id: string, job: Partial<NewJob>): Promise<Job | undefined> {
  const database = await getDb();
  const jobToUpdate = {
    ...job,
    requirements: job.requirements ? JSON.stringify(job.requirements) : undefined
  };
  const result = await database.update(jobs).set(jobToUpdate).where(eq(jobs.id, id)).returning();
  if (result[0]) {
    return {
      ...result[0],
      requirements: job.requirements || JSON.parse(result[0].requirements as string)
    };
  }
  return undefined;
}

export async function deleteJob(id: string): Promise<boolean> {
  const database = await getDb();
  const result = await database.delete(jobs).where(eq(jobs.id, id)).returning({ id: jobs.id });
  return result.length > 0;
}

// Funções para candidaturas
export async function getAllApplications(): Promise<Application[]> {
  const database = await getDb();
  return await database.select().from(applications).orderBy(desc(applications.createdAt));
}

export async function getApplicationById(id: string): Promise<Application | undefined> {
  const database = await getDb();
  const result = await database.select().from(applications).where(eq(applications.id, id)).limit(1);
  return result[0];
}

export async function getUserApplications(userId: string): Promise<Application[]> {
  const database = await getDb();
  return await database.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
}

export async function getJobApplications(jobId: string): Promise<Application[]> {
  const database = await getDb();
  return await database.select().from(applications).where(eq(applications.jobId, jobId)).orderBy(desc(applications.createdAt));
}

export async function createApplication(application: NewApplication): Promise<Application> {
  const database = await getDb();
  const result = await database.insert(applications).values(application).returning();
  return result[0];
}

export async function hasApplied(userId: string, jobId: string): Promise<boolean> {
  const database = await getDb();
  const result = await database.select().from(applications).where(
    and(
      eq(applications.userId, userId),
      eq(applications.jobId, jobId)
    )
  ).limit(1);
  return result.length > 0;
}

// Função para buscar candidaturas com informações do usuário e vaga
export async function getApplicationsWithDetails() {
  const database = await getDb();
  return await database
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
  const database = await getDb();
  return await database.select().from(experiences).orderBy(desc(experiences.startDate));
}

export async function getExperienceById(id: string): Promise<Experience | undefined> {
  const database = await getDb();
  const result = await database.select().from(experiences).where(eq(experiences.id, id)).limit(1);
  return result[0];
}

export async function getUserExperiences(userId: string): Promise<Experience[]> {
  const database = await getDb();
  return await database.select().from(experiences).where(eq(experiences.userId, userId)).orderBy(desc(experiences.startDate));
}

export async function createExperience(experience: NewExperience): Promise<Experience> {
  const database = await getDb();
  const result = await database.insert(experiences).values(experience).returning();
  return result[0];
}

export async function updateExperience(id: string, experience: Partial<NewExperience>): Promise<Experience | undefined> {
  const database = await getDb();
  const result = await database.update(experiences).set(experience).where(eq(experiences.id, id)).returning();
  return result[0];
}

export async function deleteExperience(id: string): Promise<boolean> {
  const database = await getDb();
  const result = await database.delete(experiences).where(eq(experiences.id, id)).returning({ id: experiences.id });
  return result.length > 0;
}
