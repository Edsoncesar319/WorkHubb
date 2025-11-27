# 📖 Guia Visual: Como Configurar Vercel Postgres - Passo a Passo

Este guia vai te mostrar **exatamente** como configurar o Vercel Postgres para o WorkHubb.

## 🎯 Objetivo

Configurar o banco de dados PostgreSQL na Vercel para que sua aplicação funcione corretamente em produção.

---

## 📋 Passo 1: Acessar o Dashboard da Vercel

1. Acesse: **https://vercel.com/dashboard**
2. Faça login na sua conta
3. Você verá a lista de seus projetos

---

## 📋 Passo 2: Criar o Banco Postgres

### 2.1. Acessar Storage

1. No menu lateral esquerdo, clique em **"Storage"** (ou **"Storage"** no topo)
2. Você verá uma lista de seus bancos de dados (se tiver algum)

### 2.2. Criar Novo Banco

1. Clique no botão **"Create Database"** (ou **"Add"** > **"Database"**)
2. Uma lista de opções aparecerá
3. Selecione **"Postgres"**

### 2.3. Configurar o Banco

Você verá um formulário com as seguintes opções:

**Name** (Nome do banco):
- Digite: `workhubb-db` (ou qualquer nome que preferir)
- Exemplo: `workhubb-production`

**Region** (Região):
- Selecione a região mais próxima dos seus usuários
- Recomendações:
  - **Brasil**: `South America (São Paulo)`
  - **EUA**: `US East (N. Virginia)`
  - **Europa**: `Europe (Frankfurt)`

**Plan** (Plano):
- Para começar, selecione **"Hobby"** (plano gratuito)
- Este plano é suficiente para desenvolvimento e pequenos projetos

### 2.4. Criar

1. Revise as configurações
2. Clique no botão **"Create"** (ou **"Create Database"**)
3. Aguarde alguns segundos enquanto o banco é criado

---

## 📋 Passo 3: Conectar o Banco ao Projeto

### 3.1. Acessar Settings do Banco

Após criar o banco, você será redirecionado para o dashboard do Postgres.

1. No menu lateral do banco, clique em **"Settings"** (Configurações)

### 3.2. Conectar ao Projeto

1. Na seção **"Projects"** (Projetos), você verá uma lista
2. Procure pelo seu projeto **WorkHubb** na lista
3. Se o projeto **não estiver conectado**:
   - Clique em **"Connect"** ou **"Add Project"**
   - Selecione seu projeto **WorkHubb** da lista
   - Confirme a conexão

**✅ Importante**: Quando você conecta o banco ao projeto, a variável `POSTGRES_URL` é configurada **automaticamente**. Você não precisa fazer nada manualmente!

### 3.3. Verificar Conexão

1. Volte para o dashboard do seu projeto WorkHubb
2. Vá em **Settings** > **Environment Variables**
3. Você deve ver `POSTGRES_URL` listada
4. Se estiver lá, está tudo certo! ✅

---

## 📋 Passo 4: Criar as Tabelas

### 4.1. Acessar SQL Editor

1. No dashboard do Postgres, vá em **"Data"** (no menu lateral)
2. Clique em **"SQL Editor"** (ou **"Query"**)

### 4.2. Executar o Script SQL

1. Você verá um editor de SQL (área de texto grande)
2. Abra o arquivo `scripts/create-postgres-tables.sql` do seu projeto
3. **Copie TODO o conteúdo** do arquivo
4. **Cole** no editor SQL da Vercel
5. Clique no botão **"Run"** (ou **"Execute"**)

### 4.3. Verificar Sucesso

Após executar, você deve ver:
- ✅ Mensagem de sucesso
- ✅ Lista das tabelas criadas:
  - `users`
  - `jobs`
  - `applications`
  - `experiences`

---

## 📋 Passo 5: Fazer Novo Deploy

### 5.1. Redeploy

1. No dashboard da Vercel, vá em **"Deployments"**
2. Encontre o deployment mais recente
3. Clique nos **três pontos (...)** ao lado do deployment
4. Selecione **"Redeploy"**
5. Confirme o redeploy

### 5.2. Ou Fazer Commit

Se preferir, faça um commit vazio para forçar um novo deploy:

```bash
git commit --allow-empty -m "Trigger redeploy after Postgres setup"
git push
```

---

## ✅ Verificação Final

### Como Saber se Está Funcionando?

1. **Acesse sua aplicação**: https://work-hubb.vercel.app
2. **Tente criar uma conta**:
   - Vá em "Cadastrar"
   - Preencha o formulário
   - Clique em "Cadastrar"
3. **Se funcionar**: ✅ Tudo configurado corretamente!
4. **Se ainda der erro**: Veja a seção de Troubleshooting abaixo

### Verificar Logs

1. No dashboard da Vercel, vá em **Deployments**
2. Clique no deployment mais recente
3. Vá em **Functions** > **View Function Logs**
4. Procure por:
   - ✅ `Initializing Vercel Postgres database...`
   - ✅ `Vercel Postgres initialized successfully`
   - ❌ Se aparecer erro, veja a mensagem

---

## 🔧 Troubleshooting (Solução de Problemas)

### ❌ Problema: "POSTGRES_URL não encontrada"

**Causa**: O banco não está conectado ao projeto.

**Solução**:
1. Vá em Settings do Postgres > Projects
2. Verifique se o projeto WorkHubb está listado
3. Se não estiver, clique em "Connect" e adicione o projeto
4. Faça um novo deploy

---

### ❌ Problema: "relation does not exist"

**Causa**: As tabelas não foram criadas.

**Solução**:
1. Vá em Data > SQL Editor no dashboard do Postgres
2. Execute novamente o script de `scripts/create-postgres-tables.sql`
3. Verifique se todas as tabelas foram criadas

---

### ❌ Problema: Erro persiste após configurar

**Causa**: As variáveis de ambiente podem não ter sido propagadas.

**Solução**:
1. Aguarde 2-3 minutos após conectar o banco
2. Faça um novo deploy (Redeploy)
3. Verifique os logs do deployment

---

### ❌ Problema: Não consigo encontrar "Storage"

**Causa**: Pode estar em um local diferente na interface.

**Solução**:
- Procure por "Storage" no menu lateral
- Ou acesse diretamente: https://vercel.com/dashboard/stores
- Ou vá em seu projeto > Settings > Storage

---

## 📸 Onde Encontrar Cada Coisa

### Dashboard do Projeto
- **URL**: `https://vercel.com/dashboard/[seu-projeto]`
- **O que tem aqui**: Deployments, Settings, Analytics

### Dashboard do Postgres
- **URL**: `https://vercel.com/dashboard/stores/[id-do-banco]`
- **O que tem aqui**: Data, Settings, SQL Editor

### Environment Variables
- **Onde**: Projeto > Settings > Environment Variables
- **O que tem aqui**: Todas as variáveis de ambiente (incluindo POSTGRES_URL)

---

## 🎯 Checklist Rápido

Antes de considerar concluído, verifique:

- [ ] Postgres criado na Vercel
- [ ] Postgres conectado ao projeto WorkHubb
- [ ] `POSTGRES_URL` aparece em Environment Variables
- [ ] Tabelas criadas (executou o SQL)
- [ ] Novo deploy feito
- [ ] Testou criar uma conta na aplicação
- [ ] Funcionou! ✅

---

## 💡 Dicas Importantes

1. **Variáveis Automáticas**: Quando você conecta o Postgres ao projeto, a `POSTGRES_URL` é adicionada automaticamente. Não precisa configurar manualmente!

2. **Tempo de Propagação**: Após conectar o banco, pode levar alguns minutos para as variáveis serem propagadas. Faça um redeploy após configurar.

3. **Plano Hobby**: O plano gratuito (Hobby) é suficiente para começar. Você pode fazer upgrade depois se precisar.

4. **Região**: Escolha a região mais próxima dos seus usuários para melhor performance.

5. **Backup**: O Vercel Postgres faz backup automático. Você não precisa se preocupar com isso.

---

## 📚 Documentação Adicional

- **Guia Completo**: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- **Setup Detalhado**: [VERCEL_POSTGRES_SETUP.md](./VERCEL_POSTGRES_SETUP.md)
- **Correção Rápida**: [QUICK_FIX_POSTGRES.md](./QUICK_FIX_POSTGRES.md)

---

## 🆘 Ainda Precisa de Ajuda?

1. Verifique os logs completos no dashboard da Vercel
2. Consulte a documentação oficial: https://vercel.com/docs/storage/vercel-postgres
3. Verifique se todas as etapas foram seguidas corretamente

---

**Pronto!** Agora você sabe exatamente como configurar o Vercel Postgres. Siga os passos acima e sua aplicação estará funcionando! 🚀

