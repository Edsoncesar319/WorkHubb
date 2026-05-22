-- WorkHubb: schema inicial para Vercel Postgres
-- Execute no SQL Editor do Storage > Postgres (ou: npm run prisma:push)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  bio TEXT,
  stack TEXT,
  github TEXT,
  linkedin TEXT,
  company TEXT,
  profile_photo TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  remote BOOLEAN NOT NULL,
  salary TEXT,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  job_id TEXT NOT NULL REFERENCES jobs(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  current BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
