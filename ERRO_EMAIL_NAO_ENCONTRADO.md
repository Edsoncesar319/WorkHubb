# 🔍 Erro: "Email não encontrado" - O que fazer?

Se você está vendo a mensagem **"Email não encontrado"** ao tentar fazer login, pode ser por duas razões:

## 🔴 Possível Causa 1: Banco de Dados Não Configurado

Se você acabou de fazer o deploy e ainda não configurou o Vercel Postgres, essa mensagem aparece porque o banco de dados não está funcionando.

### ✅ Solução: Configurar o Vercel Postgres

Siga o guia rápido:

1. **Criar Postgres**: Dashboard Vercel → Storage → Create Database → Postgres
2. **Conectar ao Projeto**: Settings do Postgres → Projects → Connect
3. **Criar Tabelas**: Data → SQL Editor → Executar script SQL
4. **Redeploy**: Deployments → Redeploy

📖 **Guia Completo**: Veja [CONFIGURACAO_RAPIDA.md](./CONFIGURACAO_RAPIDA.md)

---

## 🔴 Possível Causa 2: Email Realmente Não Existe

Se o banco está configurado e funcionando, mas você ainda vê essa mensagem, significa que:

- O email digitado não está cadastrado no sistema
- Você precisa criar uma conta primeiro

### ✅ Solução: Criar uma Conta

1. Vá em **"Cadastrar"** (ou acesse `/register`)
2. Preencha o formulário com seus dados
3. Clique em **"Cadastrar"**
4. Depois, faça login com o email cadastrado

---

## 🔍 Como Identificar Qual é o Problema?

### Verificar se o Banco Está Configurado

1. Acesse o dashboard da Vercel
2. Vá em **Settings** > **Environment Variables**
3. Procure por `POSTGRES_URL`
4. Se **não estiver lá** = Banco não configurado ❌
5. Se **estiver lá** = Banco configurado ✅

### Verificar os Logs

1. No dashboard da Vercel, vá em **Deployments**
2. Clique no deployment mais recente
3. Vá em **Functions** > **View Function Logs**
4. Procure por:
   - ❌ `Vercel Postgres não configurado` = Banco não configurado
   - ✅ `Vercel Postgres initialized successfully` = Banco funcionando

---

## 🎯 Passos Rápidos para Resolver

### Se o Banco NÃO Está Configurado:

1. **Configure o Postgres** (5 minutos):
   - Veja: [CONFIGURACAO_RAPIDA.md](./CONFIGURACAO_RAPIDA.md)
   
2. **Faça um Redeploy**:
   - Dashboard → Deployments → Redeploy

3. **Teste novamente**:
   - Tente criar uma conta primeiro
   - Depois faça login

### Se o Banco JÁ Está Configurado:

1. **Crie uma conta**:
   - Vá em "Cadastrar"
   - Preencha o formulário
   - Clique em "Cadastrar"

2. **Faça login**:
   - Use o email que você acabou de cadastrar

---

## ⚠️ Mensagens de Erro Relacionadas

### "Banco de dados não configurado"

**Significado**: O Vercel Postgres não foi configurado ainda.

**Solução**: Siga o guia [CONFIGURACAO_RAPIDA.md](./CONFIGURACAO_RAPIDA.md)

---

### "Erro ao fazer login. Tente novamente."

**Significado**: Ocorreu um erro inesperado.

**Solução**: 
1. Verifique os logs no dashboard da Vercel
2. Certifique-se de que o banco está configurado
3. Tente novamente

---

## 📋 Checklist de Verificação

Antes de reportar o problema, verifique:

- [ ] O Vercel Postgres está criado?
- [ ] O Postgres está conectado ao projeto?
- [ ] As tabelas foram criadas (executou o SQL)?
- [ ] `POSTGRES_URL` aparece nas variáveis de ambiente?
- [ ] Um novo deploy foi feito após configurar?
- [ ] Você já criou uma conta com esse email?

---

## 🆘 Ainda com Problemas?

1. **Verifique os logs** no dashboard da Vercel
2. **Consulte os guias**:
   - [CONFIGURACAO_RAPIDA.md](./CONFIGURACAO_RAPIDA.md)
   - [CONFIGURAR_POSTGRES_PASSO_A_PASSO.md](./CONFIGURAR_POSTGRES_PASSO_A_PASSO.md)
   - [QUICK_FIX_POSTGRES.md](./QUICK_FIX_POSTGRES.md)

3. **Teste criando uma conta primeiro**:
   - Se conseguir criar conta = banco está funcionando ✅
   - Se não conseguir criar conta = banco não está configurado ❌

---

## 💡 Dica

**Sempre crie uma conta primeiro** antes de tentar fazer login. O sistema não tem usuários pré-cadastrados - você precisa criar sua conta primeiro!

---

**Resumo**: Se você vê "Email não encontrado", provavelmente precisa:
1. Configurar o Postgres (se ainda não fez)
2. Criar uma conta primeiro (se o banco já está configurado)

