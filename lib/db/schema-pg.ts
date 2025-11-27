import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Schema PostgreSQL para Vercel Postgres
// Compatível com o schema SQLite, mas usando tipos PostgreSQL

// Tabela de usuários
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  type: text('type', { enum: ['professional', 'company'] }).notNull(),
  bio: text('bio'),
  stack: text('stack'),
  github: text('github'),
  linkedin: text('linkedin'),
  company: text('company'),
  profilePhoto: text('profile_photo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de vagas
export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location').notNull(),
  remote: boolean('remote').notNull(),
  salary: text('salary'),
  description: text('description').notNull(),
  requirements: text('requirements').notNull(), // JSON string
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de candidaturas
export const applications = pgTable('applications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  jobId: text('job_id').notNull().references(() => jobs.id),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de experiências profissionais
export const experiences = pgTable('experiences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  current: boolean('current').default(false).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tipos TypeScript derivados dos schemas
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Job = Omit<typeof jobs.$inferSelect, 'requirements'> & { requirements: string[] };
export type NewJob = Omit<typeof jobs.$inferInsert, 'requirements'> & { requirements: string[] };
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Experience = typeof experiences.$inferSelect;
export type NewExperience = typeof experiences.$inferInsert;

