# Camada de dados (`lib/db`)

- **`prisma.ts`** — cliente Prisma (runtime)
- **`queries.ts`** — operações de leitura/escrita
- **`types.ts`** — tipos TypeScript (`User`, `Job`, etc.)
- **`env.ts`** — resolução de URLs Neon/Vercel

Schema e migrations: `prisma/schema.prisma` e `prisma/migrations/`.

## Comandos

```bash
npm run prisma:setup-env
npm run db:validate
npm run prisma:migrate:deploy
npm run prisma:studio
npm run db:seed
```
