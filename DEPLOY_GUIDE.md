# 🚀 Guia Completo de Deploy - WorkHubb para Vercel

Este guia vai te ajudar a fazer o deploy completo do WorkHubb na Vercel.

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Node.js 18+ instalado localmente

## 🔧 Passo 1: Preparar o Projeto Localmente

### 1.1 Verificar Dependências

Certifique-se de que todas as dependências estão instaladas:

```bash
npm install
```

### 1.2 Testar Build Local

Teste se o projeto compila corretamente:

```bash
npm run build
```

Se houver erros, corrija-os antes de fazer o deploy.

## 🌐 Passo 2: Conectar ao Vercel

### Opção A: Via Dashboard da Vercel (Recomendado)

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em **Add New Project**
3. Importe seu repositório Git
4. Configure o projeto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Opção B: Via CLI

```bash
# Instalar Vercel CLI globalmente
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

## 🗄️ Passo 3: Configurar Vercel Postgres

### 3.1 Criar o Banco de Dados

1. No dashboard da Vercel, vá para seu projeto
2. Vá em **Storage** > **Create Database** > **Postgres**
3. Escolha um nome (ex: `workhubb-db`)
4. Selecione a região (recomendado: mais próxima dos seus usuários)
5. Escolha o plano (Hobby é suficiente para começar)
6. Clique em **Create**

### 3.2 Conectar ao Projeto

1. No dashboard do Postgres, vá em **Settings**
2. Na seção **Projects**, adicione seu projeto Vercel
3. A variável `POSTGRES_URL` será automaticamente configurada

### 3.3 Criar as Tabelas

1. No dashboard do Postgres, vá em **Data** > **SQL Editor**
2. Execute o script SQL de `scripts/create-postgres-tables.sql`:

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
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabela de candidaturas
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabela de experiências profissionais
CREATE TABLE IF NOT EXISTS experiences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  current BOOLEAN DEFAULT FALSE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_jobs_author_id ON jobs(author_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON experiences(user_id);
```

3. Clique em **Run** para executar o script

## 📦 Passo 4: Configurar Vercel Blob (Opcional - para fotos de perfil)

### 4.1 Criar Blob Store

1. No dashboard da Vercel, vá em **Storage** > **Create Database** > **Blob**
2. Escolha um nome (ex: `workhubb-blob`)
3. Selecione a região
4. Clique em **Create**

### 4.2 Conectar ao Projeto

1. No dashboard do Blob, vá em **Settings**
2. Na seção **Projects**, adicione seu projeto Vercel
3. As variáveis `BLOB_READ_WRITE_TOKEN` serão automaticamente configuradas

## 🔐 Passo 5: Verificar Variáveis de Ambiente

No dashboard do projeto Vercel:

1. Vá em **Settings** > **Environment Variables**
2. Verifique se as seguintes variáveis estão configuradas:
   - `POSTGRES_URL` (automático do Postgres)
   - `BLOB_READ_WRITE_TOKEN` (automático do Blob, se configurado)

**Nota**: Não é necessário configurar manualmente essas variáveis - elas são adicionadas automaticamente quando você conecta o Postgres/Blob ao projeto.

## 🚀 Passo 6: Fazer o Deploy

### Opção A: Deploy Automático (Recomendado)

Se você conectou o repositório Git:
1. Faça push das alterações para o repositório
2. O deploy será feito automaticamente
3. Acompanhe o progresso no dashboard da Vercel

### Opção B: Deploy Manual

```bash
# Deploy para produção
vercel --prod

# Ou apenas preview
vercel
```

## ✅ Passo 7: Verificar o Deploy

Após o deploy:

1. Acesse sua URL: `https://work-hubb.vercel.app`
2. Teste as funcionalidades:
   - ✅ Criar conta
   - ✅ Fazer login
   - ✅ Criar perfil
   - ✅ Criar vagas (se for empresa)
   - ✅ Candidatar-se a vagas (se for profissional)

## 🔍 Troubleshooting

### Erro: "Banco de dados não está disponível"

**Solução**:
1. Verifique se o Postgres está criado e conectado ao projeto
2. Verifique se `POSTGRES_URL` está nas variáveis de ambiente
3. Verifique se as tabelas foram criadas (execute o SQL novamente)

### Erro: "relation does not exist"

**Solução**: As tabelas não foram criadas. Execute o script SQL no console do Postgres.

### Erro: "Failed to fetch user"

**Solução**: 
1. Verifique se o banco está inicializado corretamente
2. Verifique os logs no dashboard da Vercel
3. Certifique-se de que `POSTGRES_URL` está configurada

### Build falha

**Solução**:
1. Verifique os logs de build no dashboard
2. Teste o build localmente: `npm run build`
3. Verifique se todas as dependências estão no `package.json`

### Erro de timeout nas APIs

**Solução**: 
- O `vercel.json` já está configurado com `maxDuration: 10` segundos
- Se precisar de mais tempo, ajuste no `vercel.json`

## 📊 Monitoramento

### Logs

1. No dashboard da Vercel, vá em **Deployments**
2. Clique no deployment desejado
3. Vá em **Functions** para ver os logs das APIs

### Métricas do Postgres

1. No dashboard do Postgres, veja:
   - Queries executadas
   - Storage usado
   - Conexões ativas

## 🔄 Atualizações Futuras

Para atualizar o projeto:

1. Faça as alterações no código
2. Faça commit e push para o Git
3. O deploy será feito automaticamente

Ou manualmente:

```bash
vercel --prod
```

## 📝 Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Postgres criado e conectado ao projeto
- [ ] Tabelas criadas no Postgres
- [ ] Variáveis de ambiente configuradas automaticamente
- [ ] Build local funciona (`npm run build`)
- [ ] Deploy bem-sucedido na Vercel
- [ ] Site acessível em `https://work-hubb.vercel.app`
- [ ] Funcionalidades básicas testadas (criar conta, login, etc.)

## 🎉 Pronto!

Seu WorkHubb está no ar! 🚀

Para suporte adicional, consulte:
- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Documentação do Vercel Blob](https://vercel.com/docs/storage/vercel-blob)

