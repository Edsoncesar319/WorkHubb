# Vercel Blob — fotos e currículos

O erro `No blob credentials found` significa que falta o **Blob Store** ligado ao projeto.

## 1. Criar Blob na Vercel

1. Acesse [vercel.com](https://vercel.com) → projeto **work-hubb**
2. Aba **Storage** → **Create Database** / **Create Store**
3. Escolha **Blob**
4. Nome sugerido: `workhubb-blob`
5. **Connect to Project** → marque **Production** e **Preview**

A Vercel cria automaticamente:

- `BLOB_READ_WRITE_TOKEN`
- (às vezes) `BLOB_STORE_ID`

## 2. Desenvolvimento local

No terminal, na pasta do projeto:

```bash
vercel link
vercel env pull .env.development.local
```

Confirme que existe a linha (valor começa com `vercel_blob_rw_`):

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Reinicie o servidor:

```bash
npm run dev
```

## 3. Verificar

```bash
npm run blob:check
```

Ou abra: `http://localhost:3000/api/health/blob` → deve retornar `{ "ok": true }`.

## 4. Produção

Após conectar o Blob ao projeto, faça **Redeploy** (deploy novo do `main`, não só “Redeploy” de commit antigo).

As variáveis `BLOB_*` devem aparecer em **Settings → Environment Variables**.

## O que usa Blob no WorkHubb

| Recurso        | Rota                    |
|----------------|-------------------------|
| Foto de perfil | `POST /api/upload`      |
| Currículo      | `POST /api/upload/resume` |

Sem o token, upload de imagem e currículo falham; o restante do app (vagas, login, banco) continua funcionando.
