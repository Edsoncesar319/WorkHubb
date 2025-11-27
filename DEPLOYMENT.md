# Guia de Deploy - WorkHubb

## ⚠️ Importante: Banco de Dados

Este projeto atualmente usa **SQLite com better-sqlite3**, que **não funciona em ambientes serverless** como a Vercel.

### Solução Recomendada: Migrar para Vercel Postgres

Para fazer deploy na Vercel, você precisa migrar para um banco de dados compatível com serverless:

#### Opção 1: Vercel Postgres (Recomendado)

1. No dashboard da Vercel, vá para seu projeto
2. Vá em **Storage** > **Create Database** > **Postgres**
3. Copie a string de conexão
4. Instale o driver:
   ```bash
   npm install @vercel/postgres drizzle-orm
   npm uninstall better-sqlite3
   ```
5. Atualize `lib/db/index.ts` para usar Postgres:
   ```typescript
   import { drizzle } from 'drizzle-orm/vercel-postgres';
   import { sql } from '@vercel/postgres';
   import * as schema from './schema';
   
   export const db = drizzle(sql, { schema });
   ```

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

