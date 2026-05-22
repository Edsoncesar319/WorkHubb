# Troubleshooting - Erro de Conexão com Banco de Dados

## Erro: "Erro de conexão com o banco de dados"

Este erro geralmente ocorre quando:

1. **Variáveis de ambiente não estão configuradas**
2. **URL do banco está incorreta ou expirada**
3. **URL do Prisma Accelerate sendo usada incorretamente**

## 🔍 Diagnóstico

### 1. Verificar Variáveis de Ambiente

Execute no terminal:

```bash
# Windows PowerShell
Get-Content .env | Select-String -Pattern "(POSTGRES|DATABASE)"

# Linux/Mac
grep -E "(POSTGRES|DATABASE)" .env
```

### 2. Variáveis Necessárias

O sistema precisa de pelo menos uma dessas variáveis:

- `POSTGRES_URL` (preferencial)
- `POSTGRES_URL_NON_POOLING` (para migrations)
- `DATABASE_URL` (fallback)

### 3. Tipos de URL

#### ✅ URL Direta do Vercel Postgres (Recomendada)
```
POSTGRES_URL="postgres://user:pass@host.vercel-storage.com:5432/database"
```

#### ⚠️ URL do Prisma Accelerate (Funciona, mas requer configuração especial)
```
DATABASE_URL="postgres://...@db.prisma.io:5432/postgres"
```

## 🔧 Soluções

### Solução 1: Configurar POSTGRES_URL da Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá em **Storage** > Seu banco Postgres
3. Em **Settings**, copie a **Connection String**
4. Adicione no `.env` ou `.env.local`:

```env
POSTGRES_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
```

### Solução 2: Usar Variáveis da Vercel

```bash
vercel env pull .env.development.local
```

Depois, verifique se as variáveis foram baixadas:

```bash
# Windows
Get-Content .env.development.local | Select-String "POSTGRES"

# Linux/Mac
grep POSTGRES .env.development.local
```

### Solução 3: Usar Prisma ao invés de Drizzle

Se você está usando URLs do Prisma Accelerate, considere usar o Prisma diretamente:

```typescript
import { prisma } from '@/lib/db/prisma';

// Ao invés de usar Drizzle queries
const users = await prisma.user.findMany();
```

### Solução 4: Configurar POSTGRES_URL a partir de DATABASE_URL

Se você só tem `DATABASE_URL`, configure:

```env
# No .env ou .env.local
POSTGRES_URL="${DATABASE_URL}"
POSTGRES_URL_NON_POOLING="${DATABASE_URL}"
```

## 🚨 Problemas Comuns

### Problema: URL do Prisma Accelerate não funciona

**Sintoma**: Erro de conexão com `db.prisma.io`

**Solução**: 
- URLs do Prisma Accelerate (`db.prisma.io`) não funcionam com `postgres-js`
- Use `@vercel/postgres` ou o Prisma Client
- Melhor: obtenha uma URL direta do Vercel Postgres

### Problema: "Environment variable not found"

**Sintoma**: Erro dizendo que variável não foi encontrada

**Solução**:
1. Verifique se o arquivo `.env` existe
2. Verifique se a variável está escrita corretamente
3. Reinicie o servidor de desenvolvimento (`npm run dev`)

### Problema: Conexão funciona mas queries falham

**Sintoma**: Conecta mas dá erro em queries

**Solução**:
1. Verifique se as tabelas foram criadas: `npm run db:sync:postgres`
2. Verifique o schema do banco: `npm run prisma:studio`

## 📋 Checklist

- [ ] Variáveis de ambiente configuradas
- [ ] URL do banco está correta e acessível
- [ ] Tabelas foram criadas no banco
- [ ] Servidor foi reiniciado após mudanças no `.env`
- [ ] Usando a URL correta (direta do Vercel, não Prisma Accelerate)

## 🔗 Links Úteis

- [Configuração do Vercel Postgres](./VERCEL_POSTGRES_SETUP.md)
- [Configuração do Prisma](./PRISMA_SETUP.md)
- [Documentação do @vercel/postgres](https://vercel.com/docs/storage/vercel-postgres/sdk)

