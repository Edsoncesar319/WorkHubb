# Guia de Deploy - WorkHubb

## ✅ Banco de Dados Híbrido

Este projeto agora suporta **ambos SQLite (desenvolvimento) e Vercel Postgres (produção)** automaticamente!

O sistema detecta automaticamente o ambiente:
- **Desenvolvimento local**: Usa SQLite (`better-sqlite3`)
- **Vercel (produção)**: Usa Vercel Postgres (quando `POSTGRES_URL` estiver configurado)

### Configuração para Vercel

#### Passo 1: Criar Vercel Postgres

1. No dashboard da Vercel, vá para seu projeto
2. Vá em **Storage** > **Create Database** > **Postgres**
3. Escolha um nome para o banco
4. Selecione a região (recomendado: mais próxima dos seus usuários)
5. Clique em **Create**

#### Passo 2: Configurar Variável de Ambiente

A variável `POSTGRES_URL` será automaticamente configurada pela Vercel quando você conectar o banco ao projeto.

Para verificar:
1. No dashboard do Postgres, vá em **Settings**
2. Na seção **Environment Variables**, você verá `POSTGRES_URL`
3. Certifique-se de que está conectado ao seu projeto

#### Passo 3: Criar as Tabelas

Após criar o banco Postgres, você precisa criar as tabelas. Execute o script de migração:

```bash
# Gerar migrações para PostgreSQL
npm run db:generate

# Aplicar migrações (ou criar manualmente via SQL)
```

Ou crie as tabelas manualmente usando o SQL em `lib/db/migrations/` adaptado para PostgreSQL.

#### Opção 2: Supabase (Alternativa)

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Use a string de conexão PostgreSQL
4. Siga os mesmos passos acima, mas usando `postgres-js` ou `@supabase/supabase-js`

#### Opção 3: PlanetScale (MySQL)

1. Crie uma conta no [PlanetScale](https://planetscale.com)
2. Crie um banco de dados
3. Use o driver MySQL do Drizzle

### Configuração Atual (Temporária)

O código atual está configurado para usar um banco em memória durante o build, mas **não funcionará em runtime** na Vercel sem um banco de dados real.

## Deploy

Após configurar o banco de dados:

```bash
vercel --prod
```

Ou conecte seu repositório GitHub à Vercel para deploy automático.

