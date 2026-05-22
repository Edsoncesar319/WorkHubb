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
| `POSTGRES_URL_NON_POOLING` / `DATABASE_URL_UNPOOLED` | Migrations (`DIRECT_DATABASE_URL`) |

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

### 4. Vercel Blob (opcional)

Storage → Blob → Connect → `BLOB_READ_WRITE_TOKEN`

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

1. Storage conectado ao projeto?
2. Variáveis em Production?
3. Rode local: `DATABASE_URL="..." DIRECT_DATABASE_URL="..." npx prisma migrate deploy`

### Tabelas não existem

```bash
npm run prisma:migrate:deploy
# ou
npm run prisma:push
```
