/**
 * Exemplos de uso do Prisma Client
 * Este arquivo serve como referência - você pode deletá-lo após entender o uso
 */

import { prisma } from './prisma';

// ==========================================
// EXEMPLOS DE QUERIES COM PRISMA
// ==========================================

/**
 * Buscar todos os usuários
 */
export async function getAllUsersExample() {
  return await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Buscar usuário por ID
 */
export async function getUserByIdExample(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  });
}

/**
 * Buscar usuário por email
 */
export async function getUserByEmailExample(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Criar usuário
 */
export async function createUserExample(data: {
  id: string;
  name: string;
  email: string;
  type: 'professional' | 'company';
  bio?: string;
  stack?: string;
}) {
  return await prisma.user.create({
    data,
  });
}

/**
 * Atualizar usuário
 */
export async function updateUserExample(
  id: string,
  data: {
    name?: string;
    bio?: string;
    stack?: string;
    github?: string;
    linkedin?: string;
  }
) {
  return await prisma.user.update({
    where: { id },
    data,
  });
}

/**
 * Buscar todas as vagas com autor
 */
export async function getAllJobsWithAuthorExample() {
  return await prisma.job.findMany({
    include: {
      author: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Buscar vaga com candidaturas e candidatos
 */
export async function getJobWithApplicationsExample(jobId: string) {
  return await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      author: true,
      applications: {
        include: {
          user: true,
        },
      },
    },
  });
}

/**
 * Criar candidatura
 */
export async function createApplicationExample(data: {
  id: string;
  userId: string;
  jobId: string;
  message: string;
}) {
  return await prisma.application.create({
    data,
    include: {
      user: true,
      job: true,
    },
  });
}

/**
 * Buscar experiências de um usuário
 */
export async function getUserExperiencesExample(userId: string) {
  return await prisma.experience.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Criar experiência
 */
export async function createExperienceExample(data: {
  id: string;
  userId: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}) {
  return await prisma.experience.create({
    data,
  });
}

/**
 * Query complexa: Buscar usuário com todas as relações
 */
export async function getUserWithAllRelationsExample(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      jobs: {
        include: {
          applications: {
            include: {
              user: true,
            },
          },
        },
      },
      applications: {
        include: {
          job: {
            include: {
              author: true,
            },
          },
        },
      },
      experiences: true,
    },
  });
}

/**
 * Contagem de registros
 */
export async function getStatsExample() {
  const [usersCount, jobsCount, applicationsCount] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
  ]);

  return {
    users: usersCount,
    jobs: jobsCount,
    applications: applicationsCount,
  };
}

