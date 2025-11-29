# Banco de Dados Postgres - WorkHubb

Este diretório contém toda a configuração e estrutura do banco de dados Postgres utilizado pelo WorkHubb em desenvolvimento e produção.

## Estrutura

- `index.ts` – inicializa o Drizzle usando `@vercel/postgres` (na Vercel) ou `postgres` (local)
- `schema.ts` – definição das tabelas usando `pg-core`
- `queries.ts` – funções de leitura/escrita utilizadas pelas rotas da API
- `seed.ts` – script para popular o banco com dados iniciais
- `migrations/` – migrações geradas via `drizzle-kit`

## Scripts disponíveis

```bash
npm run db:generate       # gera migrações a partir do schema
npm run db:migrate        # aplica migrações no Postgres configurado
npm run db:seed           # popula o banco com dados de exemplo
npm run db:studio         # abre o Drizzle Studio
npm run db:sync:postgres  # executa scripts/create-postgres-tables.sql diretamente no Postgres
```

> Todas as operações exigem que `POSTGRES_URL` (ou equivalentes) estejam configuradas. Utilize `vercel env pull .env.development.local` para sincronizar as variáveis em desenvolvimento.

## Tabelas principais

- `users`: dados de profissionais/empresas, com campos opcionais (`bio`, `stack`, etc.) e `profile_photo`.
- `jobs`: vagas publicadas. O campo `requirements` é armazenado como string JSON para manter compatibilidade com dados existentes.
- `applications`: candidaturas relacionando usuários e vagas.
- `experiences`: histórico profissional associado a um usuário.

Todos os timestamps usam `CURRENT_TIMESTAMP` como padrão. Flags booleanas utilizam `BOOLEAN` nativo do Postgres.

## Fluxo recomendado

1. Configure `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` e `POSTGRES_PRISMA_URL`.
2. Rode `npm run db:sync:postgres` (ou `npm run db:migrate`) para garantir que o schema está aplicado.
3. Utilize as funções de `lib/db/queries.ts` nas rotas e serviços.

Para instruções detalhadas sobre provisionamento, consulte `../../VERCEL_POSTGRES_SETUP.md`.

