# Como Criar Tabelas no Postgres de Produção

## ⚠️ Problema

O erro `relation "users" does not exist` indica que as tabelas não foram criadas no banco de dados de produção da Vercel.

## ✅ Solução

### Passo 1: Acessar o Dashboard da Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto **WorkHubb**
3. Vá em **Storage** (menu lateral)
4. Clique no banco Postgres que você criou

### Passo 2: Executar o SQL no Console

1. No dashboard do Postgres, vá em **Data** > **SQL Editor**
2. Copie todo o conteúdo do arquivo `scripts/create-postgres-tables.sql`
3. Cole no editor SQL
4. Clique em **Run** ou **Execute**

### Passo 3: Verificar se Funcionou

Após executar o SQL, você deve ver mensagens de sucesso. Todas as tabelas serão criadas:
- ✅ `users`
- ✅ `jobs`
- ✅ `applications`
- ✅ `experiences`
- ✅ Índices para performance

### Alternativa: Usar o Script de Sincronização

Se você tiver as variáveis de ambiente de produção configuradas localmente, pode executar:

```bash
# Certifique-se de que as variáveis de produção estão configuradas
vercel env pull .env.production.local

# Execute o script de sincronização
npm run db:sync:postgres
```

**Nota**: O script usa as variáveis de ambiente do arquivo `.env.production.local` se estiverem configuradas.

## 📋 Checklist

- [ ] Acessei o dashboard da Vercel
- [ ] Encontrei o banco Postgres em Storage
- [ ] Abri o SQL Editor
- [ ] Executei o conteúdo de `scripts/create-postgres-tables.sql`
- [ ] Todas as tabelas foram criadas com sucesso
- [ ] A aplicação em produção está funcionando

## 🆘 Ainda com Problemas?

Se as tabelas ainda não funcionarem após executar o SQL:

1. Verifique os logs de produção:
   ```bash
   vercel logs work-hubb.vercel.app
   ```

2. Confirme que o banco Postgres está conectado ao projeto na Vercel

3. Verifique se as variáveis de ambiente estão configuradas corretamente no dashboard da Vercel

