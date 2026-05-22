# Deploy na Vercel — WorkHubb

Guia para publicar o projeto com **Vercel Postgres**, **Vercel Blob** e **Prisma**.

## 1. Criar projeto na Vercel

1. Importe o repositório em [vercel.com/new](https://vercel.com/new).
2. Framework: **Next.js** (detectado automaticamente).
3. Não altere o Build Command — o `vercel.json` já usa `npm run vercel-build`.

## 2. Vercel Postgres (obrigatório)

1. No projeto: **Storage** → **Create Database** → **Postgres**.
2. Conecte o banco ao projeto (variáveis injetadas automaticamente):
   - `POSTGRES_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_PRISMA_URL`

O código em `lib/db/env.ts` define `DATABASE_URL` e `POSTGRES_URL_NON_POOLING` quando faltam, para Drizzle e Prisma funcionarem sem configuração manual.

### Criar tabelas (primeira vez)

Escolha **uma** opção:

**A — SQL (recomendado se o banco está vazio)**

No console SQL do Postgres na Vercel, execute o conteúdo de `scripts/create-postgres-tables.sql`.

**B — Prisma**

```bash
vercel env pull .env.development.local
npm run prisma:setup-env
npm run prisma:push
```

## 3. Vercel Blob (opcional — fotos de perfil)

1. **Storage** → **Blob** → conectar ao projeto.
2. A variável `BLOB_READ_WRITE_TOKEN` é criada automaticamente.

Sem Blob, o upload de avatar pode falhar; o restante da aplicação funciona.

## 4. Variáveis de ambiente

| Variável | Origem | Obrigatório |
|----------|--------|-------------|
| `POSTGRES_URL` | Vercel Postgres | Sim |
| `POSTGRES_URL_NON_POOLING` | Vercel Postgres | Sim (migrations) |
| `POSTGRES_PRISMA_URL` | Vercel Postgres | Recomendado |
| `DATABASE_URL` | Auto via `lib/db/env.ts` | Não* |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | Não |

\*Opcional: no dashboard, defina `DATABASE_URL` = valor de `POSTGRES_PRISMA_URL` (redundante se o Storage já estiver ligado).

## 5. Build na Vercel

Scripts configurados em `package.json`:

- `postinstall` → `prisma generate`
- `vercel-build` → `prisma generate && next build`

Em produção, as APIs usam **Drizzle** + `@vercel/postgres` (`lib/db/index.ts`). O Prisma Client é gerado no build para uso futuro e ferramentas (`prisma studio`, migrations).

## 6. Deploy

```bash
# CLI (opcional)
npm i -g vercel
vercel link
vercel --prod
```

Ou faça push na branch conectada ao Git.

## 7. Verificar localmente antes do deploy

```bash
vercel env pull .env.development.local
npm run prisma:setup-env
npm run prisma:generate
npx tsx scripts/test-db-connection.ts
npx tsx scripts/verify-deploy.ts
npm run build
```

## Problemas comuns

### Erro: `missing_connection_string` / `POSTGRES_URL env var was found`

O Postgres **não está ligado** ao projeto ou o deploy foi feito **antes** de conectar o Storage.

1. Vercel Dashboard → seu projeto → **Storage** → **Postgres** (ou Neon) → **Connect to Project**
2. Marque os ambientes **Production** e **Preview**
3. **Redeploy** (Deployments → ⋮ → Redeploy) — variáveis só entram em runtime após novo deploy
4. Confira em **Settings → Environment Variables** se existem `POSTGRES_URL` ou `DATABASE_URL`

Opcional: defina manualmente `DATABASE_URL` com o mesmo valor de `POSTGRES_URL` (ou `POSTGRES_PRISMA_URL`).

### Build falha: `Environment variable not found: DATABASE_URL`

Conecte o **Vercel Postgres** ao projeto. As variáveis `POSTGRES_*` precisam existir no ambiente de **Production** e **Preview**.

### API retorna erro de banco

1. Confirme que as tabelas existem (`scripts/create-postgres-tables.sql` ou `prisma db push`).
2. Veja logs em **Vercel** → **Deployments** → **Functions**.
3. Rode `npx tsx scripts/test-db-connection.ts` com env local do `vercel env pull`.

### Upload de imagem falha

Configure **Vercel Blob** e confira `BLOB_READ_WRITE_TOKEN` no projeto.

## Referências

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma + Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [PRISMA_SETUP.md](./PRISMA_SETUP.md) — uso do Prisma no dia a dia
