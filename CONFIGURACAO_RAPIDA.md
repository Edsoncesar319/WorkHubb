# ⚡ Configuração Rápida - Vercel Postgres (5 minutos)

## 🎯 Resumo Ultra-Rápido

1. **Criar Postgres**: Dashboard Vercel > Storage > Create Database > Postgres
2. **Conectar ao Projeto**: Settings do Postgres > Projects > Connect
3. **Criar Tabelas**: Data > SQL Editor > Colar script SQL > Run
4. **Redeploy**: Deployments > Redeploy

---

## 📝 Passo a Passo Detalhado

### 1️⃣ Criar o Banco (2 min)

```
Dashboard Vercel → Storage → Create Database → Postgres
```

**Configurações**:
- **Name**: `workhubb-db`
- **Region**: Escolha a mais próxima
- **Plan**: Hobby (gratuito)
- Clique em **Create**

### 2️⃣ Conectar ao Projeto (30 seg)

```
Dashboard do Postgres → Settings → Projects → Connect
```

Selecione seu projeto **WorkHubb** e confirme.

**✅ A variável POSTGRES_URL será configurada automaticamente!**

### 3️⃣ Criar Tabelas (1 min)

```
Dashboard do Postgres → Data → SQL Editor
```

1. Abra o arquivo: `scripts/create-postgres-tables.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **Run**

### 4️⃣ Redeploy (30 seg)

```
Dashboard do Projeto → Deployments → ... → Redeploy
```

Ou faça um commit:

```bash
git commit --allow-empty -m "Redeploy after Postgres setup"
git push
```

---

## ✅ Verificar se Funcionou

1. Acesse: https://work-hubb.vercel.app
2. Tente criar uma conta
3. Se funcionar = ✅ Sucesso!

---

## 🔍 Verificar Configuração

### Via Dashboard

```
Projeto → Settings → Environment Variables
```

Você deve ver `POSTGRES_URL` listada.

### Via Logs

```
Deployments → [último deployment] → Functions → View Logs
```

Procure por:
- ✅ `Vercel Postgres initialized successfully`

---

## ❌ Problemas Comuns

### "POSTGRES_URL não encontrada"
→ Banco não está conectado ao projeto. Vá em Settings do Postgres > Projects e conecte.

### "relation does not exist"
→ Tabelas não foram criadas. Execute o SQL novamente.

### Erro persiste
→ Aguarde 2-3 min e faça um novo deploy.

---

## 📚 Mais Detalhes

- **Guia Visual Completo**: [CONFIGURAR_POSTGRES_PASSO_A_PASSO.md](./CONFIGURAR_POSTGRES_PASSO_A_PASSO.md)
- **Guia de Deploy**: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- **Setup Detalhado**: [VERCEL_POSTGRES_SETUP.md](./VERCEL_POSTGRES_SETUP.md)

---

**Tempo total**: ~5 minutos ⏱️

