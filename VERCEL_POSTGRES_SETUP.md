# Configuração do Vercel Postgres - WorkHubb

## 🎯 Por que Vercel Postgres?

Toda a camada de dados do WorkHubb agora roda exclusivamente em Postgres. A Vercel já fornece um Postgres gerenciado que funciona tanto para produção quanto para desenvolvimento (via `vercel env pull`). Isso garante compatibilidade total com o ambiente serverless.

## 📋 Passo a Passo

### 1. Criar Vercel Postgres

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Vá em **Storage** > **Create Database** > **Postgres**
3. Escolha um nome para o banco (ex: `workhubb-db`)
4. Selecione a região (recomendado: mais próxima dos seus usuários)
5. Clique em **Create**

### 2. Conectar ao Projeto

1. No dashboard do Postgres, vá em **Settings**
2. Na seção **Projects**, adicione seu projeto Vercel
3. A variável `POSTGRES_URL` será automaticamente configurada

### 3. Criar as Tabelas

Após criar o banco, você precisa criar as tabelas. Você pode:

#### Opção A: Via SQL direto (Recomendado)

Execute este SQL no console do Vercel Postgres:

```sql
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('professional', 'company')),
  bio TEXT,
  stack TEXT,
  github TEXT,
  linkedin TEXT,
  company TEXT,
  profile_photo TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabela de vagas
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
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabela de candidaturas
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  job_id TEXT NOT NULL REFERENCES jobs(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabela de experiências profissionais
CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  current BOOLEAN DEFAULT FALSE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Opção B: Via Drizzle Migrations

```bash
# Gerar migrações
npm run db:generate

# Aplicar migrações (adaptar para PostgreSQL)
```

### 4. Sincronizar variáveis localmente

Rode:

```bash
vercel env pull .env.development.local
```

Isso garante que `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` e `POSTGRES_PRISMA_URL` fiquem disponíveis localmente.

## ✅ Como Funciona

O sistema detecta automaticamente:
- Se estiver rodando na Vercel (`VERCEL=1`): usa `@vercel/postgres`
- Em desenvolvimento: usa `postgres` com a string definida em `POSTGRES_URL` (ou equivalentes). Sem essas variáveis, a aplicação não sobe.

## 🔧 Desenvolvimento Local

Use a mesma instância do Postgres (via `vercel env pull`) ou configure um Postgres local e exporte suas credenciais para as variáveis:

```env
POSTGRES_URL=postgresql://user:pass@localhost:5432/workhubb
POSTGRES_URL_NON_POOLING=postgresql://user:pass@localhost:5432/workhubb
POSTGRES_PRISMA_URL=postgresql://user:pass@localhost:5432/workhubb
```

Se o seu Postgres local não usa TLS, defina `POSTGRES_DISABLE_SSL=1`.

## 📊 Monitoramento

Você pode monitorar o uso do Postgres no dashboard da Vercel:
- **Queries**: Número de consultas executadas
- **Storage**: Espaço usado
- **Connections**: Conexões ativas

## 💰 Custos

Consulte a [página de preços do Vercel Postgres](https://vercel.com/pricing) para informações sobre custos.

Para projetos pequenos/médios, o plano Hobby geralmente é suficiente.

## 🚨 Troubleshooting

### Erro: "Vercel Postgres não configurado"

**Solução**: Certifique-se de que:
1. O banco Postgres foi criado
2. O banco está conectado ao seu projeto
3. A variável `POSTGRES_URL` está configurada

### Erro: "relation does not exist"

**Solução**: As tabelas não foram criadas. Execute o SQL acima para criar as tabelas.

### Erro: "connection refused"

**Solução**: Verifique se o banco está ativo e acessível no dashboard da Vercel.

