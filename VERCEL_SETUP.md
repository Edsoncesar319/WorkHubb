# Deploy na Vercel — WorkHubb

## Arquitetura

- **ORM:** Prisma (única camada de dados em produção)
- **Banco:** Vercel Postgres (Neon) — host `*.neon.tech`
- **Build:** `prisma generate` → `prisma migrate deploy` → `next build`

> **Não use** o produto legado "Prisma Postgres" (`db.prisma.io` / `prisma+` com API key). Use **Vercel Postgres** no Storage.

## Passo a passo

### 1. Banco na Vercel

1. [vercel.com](https://vercel.com) → projeto → **Storage**
2. **Create Database** → **Postgres** (Neon)
3. **Connect to Project** → marque Production + Preview

Variáveis criadas automaticamente (template Neon):

| Variável | Uso |
|----------|-----|
| `POSTGRES_PRISMA_URL` | Runtime Prisma (pooler) — **prioridade** |
| `DATABASE_URL` | Igual à URL pooled |
| `POSTGRES_URL_NON_POOLING` / `DATABASE_URL_UNPOOLED` | Migrations (`directUrl` no Prisma) |

O build usa `scripts/vercel-build.ts`, que mapeia `POSTGRES_PRISMA_URL` → `DATABASE_URL` e `POSTGRES_URL_NON_POOLING` antes do `migrate deploy`. **Não é obrigatório** criar `DIRECT_DATABASE_URL` manualmente na Vercel.

### 2. Desenvolvimento local

```bash
vercel env pull .env.development.local
npm run prisma:setup-env
npm run db:validate
npm run prisma:generate
npm run dev
```

### 3. Deploy

Push no Git ou:

```bash
vercel --prod
```

O `vercel-build` aplica migrations automaticamente se o banco estiver ligado ao projeto.

### 4. Vercel Blob (foto de perfil e currículo)

Storage → Blob → **Connect to Project** → `BLOB_READ_WRITE_TOKEN`

Local: `vercel env pull .env.development.local` → `npm run blob:check` → `npm run dev`

Guia: [VERCEL_BLOB_SETUP.md](./VERCEL_BLOB_SETUP.md)

## Verificação

| URL | Esperado |
|-----|----------|
| `/api/health/db` | `{ "ok": true }` |
| `npm run db:validate` | `✅ Conexão Prisma OK` |

## Troubleshooting

### Erros no console do **dashboard** vercel.com

CSP de fontes (`blob.vercel-storage.com`), `/api/chat/.../stream` 404, `turborepo-summary` 404 e avisos de `preload` são do **painel da Vercel**, não do WorkHubb. Veja [TROUBLESHOOTING_CONSOLE.md](./TROUBLESHOOTING_CONSOLE.md).

### `P6002` / API key inválida

Você está usando Prisma Postgres legado (`db.prisma.io`). **Migre para Vercel Postgres (Neon)** no Storage.

### `migrate deploy` falha no build

**`Environment variable not found: DIRECT_DATABASE_URL`** — corrigido no código: use `POSTGRES_URL_NON_POOLING` (Neon na Vercel já injeta).

1. Storage **Postgres (Neon)** conectado ao projeto?
2. Variáveis em **Production** (não só Preview)?
3. Redeploy após conectar o banco
4. Local: `npm run prisma:setup-env` e `npm run vercel-build`

### Tabelas não existem

```bash
npm run prisma:migrate:deploy
# ou
npm run prisma:push
```
