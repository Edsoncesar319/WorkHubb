import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Tabela de usuários
export const users = sqliteTable('users', {
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
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Tabela de vagas
export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location').notNull(),
  remote: integer('remote', { mode: 'boolean' }).notNull(),
  salary: text('salary'),
  description: text('description').notNull(),
  requirements: text('requirements', { mode: 'json' }).notNull(), // Array de strings
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Tabela de candidaturas
export const applications = sqliteTable('applications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  jobId: text('job_id').notNull().references(() => jobs.id),
  message: text('message').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Tipos TypeScript derivados dos schemas
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Job = Omit<typeof jobs.$inferSelect, 'requirements'> & { requirements: string[] };
export type NewJob = Omit<typeof jobs.$inferInsert, 'requirements'> & { requirements: string[] };
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
