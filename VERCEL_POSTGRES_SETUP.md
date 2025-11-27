# Configuração do Vercel Postgres - WorkHubb

## 🎯 Por que Vercel Postgres?

O SQLite não funciona em ambientes serverless como a Vercel. Este projeto agora suporta automaticamente:
- **SQLite** para desenvolvimento local
- **Vercel Postgres** para produção na Vercel

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

### 4. Verificar Configuração

A variável `POSTGRES_URL` deve estar automaticamente disponível no seu projeto Vercel. Para verificar:

1. No dashboard do projeto Vercel, vá em **Settings** > **Environment Variables**
2. Você deve ver `POSTGRES_URL` listada

## ✅ Como Funciona

O sistema detecta automaticamente:
- Se `VERCEL=1` e `POSTGRES_URL` existe → usa Vercel Postgres
- Caso contrário → usa SQLite (desenvolvimento local)

## 🔧 Desenvolvimento Local

Para desenvolvimento local, você pode:
1. Continuar usando SQLite (padrão)
2. Ou configurar `POSTGRES_URL` no `.env.local` para usar Postgres localmente

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

