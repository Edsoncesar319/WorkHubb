import { compareMonthStrings } from '@/lib/format-date';
import { withPrisma } from './prisma';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function serializeDate(value: Date): string {
  return value.toISOString();
}
import { formatPrismaError } from './prisma-errors';
import type {
  User,
  Job,
  Application,
  NewUser,
  NewJob,
  NewApplication,
  Experience,
  NewExperience,
} from './types';

function mapUser(row: {
  id: string;
  name: string;
  email: string;
  type: string;
  bio: string | null;
  stack: string | null;
  stackSkills: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
  company: string | null;
  profilePhoto: string | null;
  resumeUrl: string | null;
  resumeFileName: string | null;
  createdAt: Date;
}): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    type: row.type as User['type'],
    bio: row.bio,
    stack: row.stack,
    stackSkills: row.stackSkills,
    github: row.github,
    linkedin: row.linkedin,
    company: row.company,
    profilePhoto: row.profilePhoto,
    resumeUrl: row.resumeUrl,
    resumeFileName: row.resumeFileName,
    createdAt: serializeDate(row.createdAt),
  };
}

function mapJob(row: {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  hybrid: boolean;
  salary: string | null;
  description: string;
  requirements: string;
  authorId: string;
  createdAt: Date;
}): Job {
  let requirements: string[] = [];
  try {
    requirements = JSON.parse(row.requirements) as string[];
  } catch {
    requirements = [];
  }
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    remote: row.remote,
    hybrid: row.hybrid ?? false,
    salary: row.salary,
    description: row.description,
    requirements,
    authorId: row.authorId,
    createdAt: serializeDate(row.createdAt),
  };
}

function mapExperience(row: {
  id: string;
  userId: string;
  title: string;
  company: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
  createdAt: Date;
}): Experience {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    company: row.company,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    current: row.current,
    description: row.description,
    createdAt: serializeDate(row.createdAt),
  };
}

function mapApplication(row: {
  id: string;
  userId: string;
  jobId: string;
  message: string;
  createdAt: Date;
}): Application {
  return {
    id: row.id,
    userId: row.userId,
    jobId: row.jobId,
    message: row.message,
    createdAt: serializeDate(row.createdAt),
  };
}

function handleDbError(error: unknown, context: string): never {
  const err = error as { code?: string; message?: string; cause?: { message?: string } };
  const errorMessage = err?.cause?.message || err?.message || String(error);
  const errorCode = err?.code;

  console.error(`Error in ${context}:`, error);

  const formatted = formatPrismaError(error);
  if (formatted.code === 'PRISMA_API_KEY_INVALID' || formatted.code === 'DB_UNREACHABLE') {
    throw new Error(formatted.message);
  }

  if (errorCode === '23505' || errorMessage.includes('duplicate key')) {
    throw new Error('Este email já está cadastrado');
  }

  if (
    errorCode === 'P2021' ||
    errorCode === '42P01' ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('relation')
  ) {
    throw new Error(
      process.env.VERCEL === '1'
        ? 'Tabelas não criadas em produção. Execute scripts/create-postgres-tables.sql ou npm run prisma:push'
        : 'Tabelas não criadas. Execute: npm run prisma:push'
    );
  }

  throw new Error(errorMessage || `Erro em ${context}`);
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const rows = await withPrisma((db) =>
      db.user.findMany({ orderBy: { createdAt: 'desc' } })
    );
    return rows.map(mapUser);
  } catch (e) {
    handleDbError(e, 'getAllUsers');
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  try {
    const row = await withPrisma((db) => db.user.findUnique({ where: { id } }));
    return row ? mapUser(row) : undefined;
  } catch (e) {
    handleDbError(e, 'getUserById');
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const row = await withPrisma((db) =>
      db.user.findUnique({ where: { email: normalizeEmail(email) } })
    );
    return row ? mapUser(row) : undefined;
  } catch (e) {
    handleDbError(e, 'getUserByEmail');
  }
}

export async function createUser(user: NewUser): Promise<User> {
  try {
    if (!user.id || !user.name || !user.email || !user.type) {
      throw new Error('Campos obrigatórios faltando: id, name, email, type');
    }
    if (user.type !== 'professional' && user.type !== 'company') {
      throw new Error('Tipo de usuário inválido. Deve ser "professional" ou "company"');
    }

    const row = await withPrisma((db) =>
      db.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: normalizeEmail(user.email),
        type: user.type,
        bio: user.bio ?? null,
        stack: user.stack ?? null,
        stackSkills: user.stackSkills ?? null,
        github: user.github ?? null,
        linkedin: user.linkedin ?? null,
        website: user.website ?? null,
        company: user.company ?? null,
        profilePhoto: user.profilePhoto ?? null,
        resumeUrl: user.resumeUrl ?? null,
        resumeFileName: user.resumeFileName ?? null,
      },
    })
    );
    return mapUser(row);
  } catch (e) {
    handleDbError(e, 'createUser');
  }
}

function buildUserUpdateData(user: Partial<NewUser>) {
  const data: Record<string, unknown> = {};
  if (user.name !== undefined) data.name = user.name;
  if (user.email !== undefined) data.email = normalizeEmail(user.email);
  if (user.type !== undefined) data.type = user.type;
  if (user.bio !== undefined) data.bio = user.bio;
  if (user.stack !== undefined) data.stack = user.stack;
  if (user.stackSkills !== undefined) data.stackSkills = user.stackSkills;
  if (user.github !== undefined) data.github = user.github;
  if (user.linkedin !== undefined) data.linkedin = user.linkedin;
  if (user.website !== undefined) data.website = user.website;
  if (user.company !== undefined) data.company = user.company;
  if (user.profilePhoto !== undefined) data.profilePhoto = user.profilePhoto;
  if (user.resumeUrl !== undefined) data.resumeUrl = user.resumeUrl;
  if (user.resumeFileName !== undefined) data.resumeFileName = user.resumeFileName;
  return data;
}

export async function updateUser(
  id: string,
  user: Partial<NewUser>
): Promise<User | undefined> {
  try {
    const data = buildUserUpdateData(user);
    if (Object.keys(data).length === 0) {
      return getUserById(id);
    }
    const row = await withPrisma((db) =>
      db.user.update({ where: { id }, data })
    );
    return mapUser(row);
  } catch (e) {
    handleDbError(e, 'updateUser');
  }
}

export async function getAllJobs(): Promise<Job[]> {
  try {
    const rows = await withPrisma((db) =>
      db.job.findMany({ orderBy: { createdAt: 'desc' } })
    );
    return rows.map(mapJob);
  } catch (e) {
    handleDbError(e, 'getAllJobs');
  }
}

export async function getJobById(id: string): Promise<Job | undefined> {
  try {
    const row = await withPrisma((db) => db.job.findUnique({ where: { id } }));
    return row ? mapJob(row) : undefined;
  } catch (e) {
    handleDbError(e, 'getJobById');
  }
}

export async function getJobsByAuthor(authorId: string): Promise<Job[]> {
  try {
    const rows = await withPrisma((db) =>
      db.job.findMany({
        where: { authorId },
        orderBy: { createdAt: 'desc' },
      })
    );
    return rows.map(mapJob);
  } catch (e) {
    handleDbError(e, 'getJobsByAuthor');
  }
}

export async function createJob(job: NewJob): Promise<Job> {
  try {
    const row = await withPrisma((db) =>
      db.job.create({
        data: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          remote: job.remote ?? false,
          hybrid: job.hybrid ?? false,
          salary: job.salary ?? null,
          description: job.description,
          requirements: JSON.stringify(job.requirements),
          authorId: job.authorId,
        },
      })
    );
    return mapJob(row);
  } catch (e) {
    handleDbError(e, 'createJob');
  }
}

export async function updateJob(
  id: string,
  job: Partial<NewJob>
): Promise<Job | undefined> {
  try {
    const data: {
      title?: string;
      company?: string;
      location?: string;
      remote?: boolean;
      hybrid?: boolean;
      salary?: string | null;
      description?: string;
      requirements?: string;
    } = {};

    if (job.title !== undefined) data.title = job.title;
    if (job.company !== undefined) data.company = job.company;
    if (job.location !== undefined) data.location = job.location;
    if (job.remote !== undefined) data.remote = job.remote;
    if (job.hybrid !== undefined) data.hybrid = job.hybrid;
    if (job.salary !== undefined) data.salary = job.salary ?? null;
    if (job.description !== undefined) data.description = job.description;
    if (job.requirements !== undefined) {
      data.requirements = JSON.stringify(job.requirements);
    }

    const row = await withPrisma((db) =>
      db.job.update({
        where: { id },
        data,
      })
    );
    return mapJob(row);
  } catch (e) {
    handleDbError(e, 'updateJob');
  }
}

export async function deleteJob(id: string): Promise<boolean> {
  try {
    await withPrisma((db) => db.job.delete({ where: { id } }));
    return true;
  } catch {
    return false;
  }
}

export async function getAllApplications(): Promise<Application[]> {
  try {
    return await withPrisma((db) =>
      db.application.findMany({ orderBy: { createdAt: 'desc' } })
    );
  } catch (e) {
    handleDbError(e, 'getAllApplications');
  }
}

export async function getApplicationById(
  id: string
): Promise<Application | undefined> {
  try {
    return (
      (await withPrisma((db) => db.application.findUnique({ where: { id } }))) ??
      undefined
    );
  } catch (e) {
    handleDbError(e, 'getApplicationById');
  }
}

export async function getUserApplications(
  userId: string
): Promise<Application[]> {
  try {
    const rows = await withPrisma((db) =>
      db.application.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
    );
    return rows.map(mapApplication);
  } catch (e) {
    handleDbError(e, 'getUserApplications');
  }
}

export async function getJobApplications(jobId: string): Promise<Application[]> {
  try {
    return await withPrisma((db) =>
      db.application.findMany({
        where: { jobId },
        orderBy: { createdAt: 'desc' },
      })
    );
  } catch (e) {
    handleDbError(e, 'getJobApplications');
  }
}

export async function getJobApplicationsWithUsers(jobId: string) {
  try {
    const rows = await withPrisma((db) =>
      db.application.findMany({
      where: { jobId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    })
    );
    return rows.map((row) => ({
      application: mapApplication(row),
      user: row.user ? mapUser(row.user) : null,
    }));
  } catch (e) {
    handleDbError(e, 'getJobApplicationsWithUsers');
  }
}

export async function createApplication(
  application: NewApplication
): Promise<Application> {
  try {
    const row = await withPrisma((db) =>
      db.application.create({ data: application })
    );
    return mapApplication(row);
  } catch (e) {
    handleDbError(e, 'createApplication');
  }
}

export async function hasApplied(userId: string, jobId: string): Promise<boolean> {
  try {
    const row = await withPrisma((db) =>
      db.application.findFirst({
        where: { userId, jobId },
      })
    );
    return !!row;
  } catch (e) {
    handleDbError(e, 'hasApplied');
  }
}

export async function getApplicationsWithDetails() {
  try {
    const rows = await withPrisma((db) =>
      db.application.findMany({
      include: { user: true, job: true },
      orderBy: { createdAt: 'desc' },
    })
    );
    return rows.map((row) => ({
      application: mapApplication(row),
      user: row.user ? mapUser(row.user) : null,
      job: row.job ? mapJob(row.job) : null,
    }));
  } catch (e) {
    handleDbError(e, 'getApplicationsWithDetails');
  }
}

export async function getAllExperiences(): Promise<Experience[]> {
  try {
    const rows = await withPrisma((db) =>
      db.experience.findMany({
        orderBy: { startDate: 'desc' },
      })
    );
    return rows.map(mapExperience);
  } catch (e) {
    handleDbError(e, 'getAllExperiences');
  }
}

export async function getExperienceById(
  id: string
): Promise<Experience | undefined> {
  try {
    const row = await withPrisma((db) =>
      db.experience.findUnique({ where: { id } })
    );
    return row ? mapExperience(row) : undefined;
  } catch (e) {
    handleDbError(e, 'getExperienceById');
  }
}

export async function getUserExperiences(userId: string): Promise<Experience[]> {
  try {
    const rows = await withPrisma((db) =>
      db.experience.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
      })
    );
    return rows.map(mapExperience);
  } catch (e) {
    handleDbError(e, 'getUserExperiences');
  }
}

export async function createExperience(
  experience: NewExperience
): Promise<Experience> {
  try {
    const row = await withPrisma((db) =>
      db.experience.create({ data: experience })
    );
    return mapExperience(row);
  } catch (e) {
    handleDbError(e, 'createExperience');
  }
}

export async function updateExperience(
  id: string,
  experience: Partial<NewExperience>
): Promise<Experience | undefined> {
  try {
    const row = await withPrisma((db) =>
      db.experience.update({
        where: { id },
        data: experience,
      })
    );
    return mapExperience(row);
  } catch (e) {
    handleDbError(e, 'updateExperience');
  }
}

export async function deleteExperience(id: string): Promise<boolean> {
  try {
    await withPrisma((db) => db.experience.delete({ where: { id } }));
    return true;
  } catch {
    return false;
  }
}

/** Perfil de candidato visível para empresa que recebeu candidatura */
export async function getCandidateProfileForCompany(
  companyId: string,
  candidateId: string,
  jobId?: string
): Promise<{
  candidate: User;
  experiences: Experience[];
  applications: Array<{ application: Application; job: Job }>;
} | null> {
  const candidate = await getUserById(candidateId);
  if (!candidate || candidate.type !== 'professional') return null;

  const companyJobs = await getJobsByAuthor(companyId);
  const companyJobIds = companyJobs.map((j) => j.id);
  if (companyJobIds.length === 0) return null;

  if (jobId && !companyJobIds.includes(jobId)) return null;

  const rows = await withPrisma((db) =>
    db.application.findMany({
      where: {
        userId: candidateId,
        jobId: jobId ? jobId : { in: companyJobIds },
      },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    })
  );

  if (rows.length === 0) return null;

  const experiences = (await getUserExperiences(candidateId)).sort((a, b) =>
    compareMonthStrings(a.startDate, b.startDate)
  );

  return {
    candidate,
    experiences,
    applications: rows.map((row) => ({
      application: mapApplication(row),
      job: mapJob(row.job),
    })),
  };
}
