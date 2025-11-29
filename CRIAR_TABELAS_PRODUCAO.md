# Como Criar Tabelas no Banco de Produção

## ⚠️ Problema

O erro `Failed query: select ... from "users"` indica que as tabelas não existem no banco de dados de **produção** da Vercel.

## ✅ Solução: Criar Tabelas no Dashboard da Vercel

### Passo a Passo

1. **Acesse o Dashboard da Vercel**
   - https://vercel.com/dashboard
   - Faça login se necessário

2. **Vá para Storage**
   - Menu lateral > **Storage**
   - Clique no banco **Postgres** do seu projeto

3. **Abra o SQL Editor**
   - No menu do banco, clique em **Data** > **SQL Editor**
   - Ou vá em **Query** > **SQL Editor**

4. **Execute o SQL**
   - Abra o arquivo `scripts/create-postgres-tables.sql` no seu projeto
   - Copie **TODO** o conteúdo do arquivo
   - Cole no SQL Editor da Vercel
   - Clique em **Run** ou **Execute**

5. **Verifique o Resultado**
   - Você deve ver mensagens de sucesso
   - As tabelas `users`, `jobs`, `applications`, `experiences` serão criadas
   - Os índices também serão criados

### SQL para Copiar

O conteúdo completo está em `scripts/create-postgres-tables.sql`. Aqui está um resumo:

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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_jobs_author_id ON jobs(author_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON experiences(user_id);
```

## ✅ Após Criar as Tabelas

1. **Teste a aplicação em produção**
   - Acesse: https://work-hubb-r88iffvwa-edson-cesars-projects.vercel.app
   - Tente fazer login ou cadastrar um usuário

2. **Verifique se funcionou**
   - Se não houver mais erros 500, as tabelas foram criadas com sucesso!

## 🆘 Ainda com Problemas?

Se após criar as tabelas ainda houver erros:

1. Verifique os logs de produção:
   ```bash
   vercel logs work-hubb.vercel.app
   ```

2. Confirme que o banco Postgres está conectado ao projeto na Vercel

3. Verifique se as variáveis de ambiente estão configuradas:
   ```bash
   vercel env ls
   ```

