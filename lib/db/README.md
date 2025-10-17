# Banco de Dados SQLite - WorkHubb

Este diretório contém toda a configuração e estrutura do banco de dados SQLite para o projeto WorkHubb.

## Estrutura

- `index.ts` - Configuração principal do banco de dados
- `schema.ts` - Definição das tabelas e tipos
- `queries.ts` - Funções de acesso aos dados
- `seed.ts` - Script para popular o banco com dados iniciais
- `migrations/` - Diretório com as migrações do banco

## Scripts Disponíveis

```bash
# Gerar migrações
npm run db:generate

# Aplicar migrações
npm run db:migrate

# Popular banco com dados iniciais
npm run db:seed

# Abrir Drizzle Studio (interface visual)
npm run db:studio
```

## Tabelas

### users
- `id` (TEXT, PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL, UNIQUE)
- `type` (TEXT, ENUM: 'professional' | 'company')
- `bio` (TEXT, OPTIONAL)
- `stack` (TEXT, OPTIONAL)
- `github` (TEXT, OPTIONAL)
- `linkedin` (TEXT, OPTIONAL)
- `company` (TEXT, OPTIONAL)
- `created_at` (TEXT, DEFAULT: CURRENT_TIMESTAMP)

### jobs
- `id` (TEXT, PRIMARY KEY)
- `title` (TEXT, NOT NULL)
- `company` (TEXT, NOT NULL)
- `location` (TEXT, NOT NULL)
- `remote` (INTEGER, BOOLEAN, NOT NULL)
- `salary` (TEXT, OPTIONAL)
- `description` (TEXT, NOT NULL)
- `requirements` (TEXT, JSON, NOT NULL)
- `author_id` (TEXT, NOT NULL, FOREIGN KEY -> users.id)
- `created_at` (TEXT, DEFAULT: CURRENT_TIMESTAMP)

### applications
- `id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT, NOT NULL, FOREIGN KEY -> users.id)
- `job_id` (TEXT, NOT NULL, FOREIGN KEY -> jobs.id)
- `message` (TEXT, NOT NULL)
- `created_at` (TEXT, DEFAULT: CURRENT_TIMESTAMP)

## Uso

As funções de acesso aos dados estão disponíveis em `lib/data.ts` e são compatíveis com a interface anterior do localStorage, mas agora usam o banco SQLite.

Exemplo:
```typescript
import { getJobs, addJob } from '@/lib/data'

// Buscar todas as vagas
const jobs = await getJobs()

// Adicionar nova vaga
const newJob = await addJob({
  title: 'Desenvolvedor React',
  company: 'Minha Empresa',
  location: 'São Paulo, SP',
  remote: true,
  description: 'Vaga para desenvolvedor React',
  requirements: ['React', 'TypeScript', '3+ anos'],
  authorId: 'user123'
})
```
