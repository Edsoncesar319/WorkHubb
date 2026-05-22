# Configuração do Prisma - WorkHubb

Este projeto agora usa **Prisma ORM** integrado com **Vercel Postgres**.

## 🎯 Por que Prisma?

O Prisma oferece:
- ✅ Type-safe database client
- ✅ Migrations automatizadas
- ✅ Prisma Studio para visualização de dados
- ✅ Excelente integração com TypeScript
- ✅ Suporte nativo para Vercel Postgres

## 📋 Pré-requisitos

1. Node.js 20.19+ ou 22.12+ (para Prisma 7+)
   - Para Prisma 6.x (instalado): Node.js 18.17+ ou 20.x
2. Vercel Postgres configurado
3. Variáveis de ambiente configuradas

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente

O Prisma usa `DATABASE_URL` no schema. Para usar com Vercel Postgres:

**Opção 1: Usar POSTGRES_URL diretamente** (Recomendado)

Configure no seu `.env.local` ou `.env.development.local`:

```env
# Copie POSTGRES_URL para DATABASE_URL para o Prisma usar
DATABASE_URL="${POSTGRES_URL}"
POSTGRES_URL_NON_POOLING="${POSTGRES_URL_NON_POOLING}"
```

**Opção 2: Definir DATABASE_URL manualmente**

```env
DATABASE_URL="postgres://user:password@host:5432/database"
POSTGRES_URL_NON_POOLING="postgres://user:password@host:5432/database"
```

### 2. Sincronizar Variáveis da Vercel

```bash
vercel env pull .env.development.local
```

Isso irá baixar todas as variáveis de ambiente do seu projeto Vercel, incluindo `POSTGRES_URL`.

**Após baixar**, adicione no `.env.development.local`:

```env
DATABASE_URL="${POSTGRES_URL}"
```

Ou copie manualmente o valor de `POSTGRES_URL` para `DATABASE_URL`.

**Alternativa: Script Automático**

```bash
npm run prisma:setup-env
```

Este script configura automaticamente `DATABASE_URL` baseado em `POSTGRES_URL`.

### 3. Gerar Prisma Client

Após configurar as variáveis de ambiente:

```bash
npm run prisma:generate
```

Isso gera o Prisma Client baseado no `prisma/schema.prisma`.

## 📊 Usando o Prisma

### Importar o Cliente

```typescript
import { prisma } from '@/lib/db/prisma';

// Exemplo: Buscar todos os usuários
const users = await prisma.user.findMany();

// Exemplo: Criar um usuário
const user = await prisma.user.create({
  data: {
    id: 'user-123',
    name: 'João Silva',
    email: 'joao@example.com',
    type: 'professional',
  },
});

// Exemplo: Buscar com relacionamentos
const job = await prisma.job.findUnique({
  where: { id: 'job-123' },
  include: {
    author: true,
    applications: {
      include: {
        user: true,
      },
    },
  },
});
```

## 🔄 Migrations

### Criar uma Nova Migration

```bash
npm run prisma:migrate
```

Isso irá:
1. Criar uma nova migration baseada nas mudanças no schema
2. Aplicar a migration no banco de dados
3. Gerar o Prisma Client automaticamente

### Aplicar Migrations em Produção

```bash
npm run prisma:migrate:deploy
```

⚠️ **Importante**: Execute isso no deploy da Vercel ou via CLI antes de fazer deploy.

### Sincronizar Schema (Sem Migrations)

Para desenvolvimento rápido (sem criar migrations):

```bash
npm run prisma:push
```

⚠️ **Atenção**: Use apenas em desenvolvimento. Em produção, sempre use migrations.

### Pull Schema do Banco

Se o banco já existe e você quer gerar o schema a partir dele:

```bash
npm run prisma:pull
```

## 🎨 Prisma Studio

Visualize e edite dados do banco de forma visual:

```bash
npm run prisma:studio
```

Isso abre um servidor local em `http://localhost:5555` com uma interface web para gerenciar seus dados.

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate` | Cria e aplica uma nova migration (dev) |
| `npm run prisma:migrate:deploy` | Aplica migrations pendentes (produção) |
| `npm run prisma:push` | Sincroniza schema sem criar migration |
| `npm run prisma:pull` | Gera schema a partir do banco existente |
| `npm run prisma:studio` | Abre Prisma Studio |
| `npm run prisma:seed` | Popula o banco com dados iniciais |

## 📝 Schema do Prisma

O schema está em `prisma/schema.prisma` e define:

- **User**: Usuários (profissionais e empresas)
- **Job**: Vagas de emprego
- **Application**: Candidaturas
- **Experience**: Experiências profissionais

### Exemplo de Relacionamentos

```prisma
model User {
  jobs         Job[]
  applications Application[]
  experiences  Experience[]
}

model Job {
  author       User
  applications Application[]
}
```

## 🚀 Deploy na Vercel

### 1. Configurar Variáveis de Ambiente na Vercel

As variáveis `POSTGRES_URL` e `POSTGRES_URL_NON_POOLING` são automaticamente configuradas quando você conecta um banco Postgres ao projeto.

### 2. Adicionar Build Command (Opcional)

Adicione ao `package.json` ou `vercel.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

Ou configure no `vercel.json`:

```json
{
  "buildCommand": "npm run build && npx prisma generate"
}
```

### 3. Executar Migrations

No primeiro deploy, execute as migrations:

```bash
# Via Vercel CLI
vercel env pull
npx prisma migrate deploy

# Ou configure um script de deploy
```

## 🔄 Migrando de Drizzle para Prisma

Se você já estava usando Drizzle, pode:

1. **Manter ambos**: Use Prisma para novas features, Drizzle para código existente
2. **Migrar gradualmente**: Substitua gradualmente as queries do Drizzle por Prisma
3. **Migrar tudo**: Refatore todo o código para usar Prisma

O schema do Prisma foi criado baseado no schema Drizzle atual, então as tabelas são compatíveis.

## ⚠️ Troubleshooting

### Erro: "Environment variable not found: DATABASE_URL"

**Solução**: Configure `POSTGRES_URL` ou `DATABASE_URL` no `.env` ou `.env.development.local`

### Erro: "Can't reach database server"

**Solução**: 
1. Verifique se o banco Postgres está ativo na Vercel
2. Verifique se as variáveis de ambiente estão corretas
3. Teste a conexão: `npx prisma db pull`

### Erro: "Migration failed"

**Solução**: 
1. Verifique se o banco está acessível
2. Verifique se não há conflitos de schema
3. Use `prisma db push` em dev para sincronizar manualmente

## 📚 Recursos

- [Documentação Prisma](https://www.prisma.io/docs)
- [Prisma com Vercel Postgres](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

