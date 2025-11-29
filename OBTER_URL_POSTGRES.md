# Como Obter a URL Direta do Postgres

## ⚠️ Problema

As URLs do Prisma Accelerate (`prisma+postgres://...` ou `postgres://...@db.prisma.io`) **não funcionam** com:
- `pg_dump` (ferramenta de backup)
- `postgres-js` (biblioteca que o Drizzle usa)
- Conexões diretas ao Postgres

## ✅ Solução: Obter URL Direta do Postgres

### Método 1: Dashboard da Vercel (Recomendado)

1. **Acesse o Dashboard da Vercel**
   - https://vercel.com/dashboard
   - Selecione seu projeto **WorkHubb**

2. **Vá para Storage**
   - Menu lateral > **Storage**
   - Clique no banco **Postgres** que você criou

3. **Obtenha a Connection String**
   - Vá em **Settings** (no menu do banco)
   - Procure por **Connection String** ou **Connection Pooling**
   - Copie a URL que começa com `postgres://` (NÃO a que começa com `prisma+`)
   - Procure especificamente por **"Non-pooling"** ou **"Direct connection"**

4. **Configure no projeto**
   - Adicione ao `.env.development.local`:
     ```env
     POSTGRES_URL_NON_POOLING=postgres://usuario:senha@host:5432/database?sslmode=require
     ```

### Método 2: Dashboard do Prisma

Se você está usando Prisma, pode obter a URL direta:

1. Acesse o [Prisma Dashboard](https://console.prisma.io)
2. Selecione seu projeto
3. Vá em **Settings** > **Database**
4. Procure por **"Direct Connection URL"** ou **"Connection Pooling"**
5. Use a URL que **não** seja do Accelerate

### Método 3: Usar pg_dump

Se você já tem acesso ao banco, pode usar o `pg_dump` diretamente:

```bash
# Substitua __DATABASE_URL__ pela URL direta do Postgres
pg_dump \
  -Fc \
  -v \
  -d "postgres://usuario:senha@host:5432/database?sslmode=require" \
  -n public \
  -f db_dump.bak
```

**Formato da URL direta:**
```
postgres://usuario:senha@host.vercel-storage.com:5432/database?sslmode=require
```

**NÃO funciona:**
```
prisma+postgres://accelerate.prisma-data.net/?api_key=...
postgres://...@db.prisma.io:5432/...
```

## 🔍 Verificar se a URL está correta

Execute o script de verificação:
```bash
npx tsx scripts/check-postgres-config.ts
```

Você deve ver:
```
✅ URLs diretas do Postgres encontradas:
  - POSTGRES_URL_NON_POOLING: postgres://...
```

## 📝 Após Configurar

1. **Teste a conexão:**
   ```bash
   npm run db:sync:postgres
   ```

2. **Verifique se funciona:**
   ```bash
   npx tsx scripts/dump-database.ts
   ```

3. **Use pg_dump:**
   ```bash
   pg_dump -Fc -v -d $POSTGRES_URL_NON_POOLING -n public -f db_dump.bak
   ```

## 🆘 Ainda com problemas?

Se você não conseguir encontrar a URL direta:

1. **Verifique se o banco Postgres foi criado na Vercel**
   - Dashboard > Storage > Deve aparecer um banco Postgres listado

2. **Crie um novo banco se necessário**
   - Storage > Create Database > Postgres
   - Isso criará automaticamente as variáveis `POSTGRES_URL` e `POSTGRES_URL_NON_POOLING`

3. **Verifique as variáveis de ambiente**
   ```bash
   vercel env ls
   vercel env pull .env.development.local
   ```

