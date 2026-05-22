# Erros no console — o que é do WorkHubb e o que ignorar

## Não são do seu app WorkHubb

Se você abriu o **console do navegador na página da Vercel** (`vercel.com/.../edson-cesars-projects`), estes avisos são do **painel da Vercel**, não do site em produção:

| Erro | Significado |
|------|-------------|
| `font-src` + `blob.vercel-storage.com/.../space-mono` | CSP do dashboard da Vercel bloqueia fonte de outro projeto/template |
| `/api/chat/.../stream` 404 | Assistente/Chat da Vercel (Omni) — não existe no seu app |
| `/api/v6/deployments/.../turborepo-summary` 404 | Dashboard espera Turborepo; seu app não usa Turbo |
| `cdn1.vercel.com` ERR_CERT_DATE_INVALID | Certificado/CDN da Vercel ou relógio do PC — tente outro navegador ou limpar cache |
| Centenas de `preload was not used` | Otimização interna do dashboard Vercel |

**Conclusão:** esses erros **não impedem** o WorkHubb de funcionar. Para testar o app, abra a **URL de produção** do deploy (ex.: `https://work-hubb-xxx.vercel.app`), não o console do dashboard.

---

## Testar o WorkHubb em produção

1. Vercel → projeto **WorkHubb** → **Deployments** → clique no último deploy → **Visit**
2. Ou abra: `https://SEU-DOMINIO/api/health/db`  
   - Esperado: `{"ok":true,"host":"...neon.tech",...}`

3. Console **nessa URL** (F12): erros relevantes seriam só chamadas para `/api/users`, `/api/jobs`, etc.

---

## Aviso do Next.js: dois `package-lock.json`

Existe `D:\PROJETOS\WorkHubb\package-lock.json` (pasta pai) e `WorkHubb\package-lock.json`.

**Na Vercel:** Settings → General → **Root Directory** = `WorkHubb` (subpasta do repositório, se o Git tiver essa estrutura).

**Local:** o `next.config.mjs` já define `outputFileTracingRoot` para corrigir o aviso.

---

## Checklist deploy WorkHubb

- [ ] Storage **Neon** conectado (não Prisma Postgres legado)
- [ ] Variáveis `POSTGRES_PRISMA_URL`, `DATABASE_URL`, `POSTGRES_URL_NON_POOLING` em Production
- [ ] Apagar variáveis `WORKHUB_*` antigas
- [ ] Redeploy após salvar env vars
- [ ] Build logs sem erro em `prisma migrate deploy`
