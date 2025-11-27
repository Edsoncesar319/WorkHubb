# 🔍 Troubleshooting: Erro 404

Se você está vendo erros **"Failed to load resource: the server responded with a status of 404"**, este guia vai te ajudar a identificar e resolver o problema.

## 🔴 Possíveis Causas

### 1. Favicon ou Recursos Estáticos

O navegador tenta carregar automaticamente o `favicon.ico`. Se não existir, você verá um 404.

**✅ Solução**: 
- O favicon já foi adicionado ao projeto
- Se ainda aparecer o erro, limpe o cache do navegador (Ctrl+Shift+Delete)

### 2. Rota de API Não Encontrada

Uma rota de API está sendo chamada mas não existe.

**✅ Como Verificar**:
1. Abra o DevTools (F12)
2. Vá em **Network** (Rede)
3. Procure por requisições com status 404
4. Veja qual URL está retornando 404

**✅ Soluções Comuns**:

#### `/api/users/email/[email]` retorna 404
- **Causa**: Usuário não existe (isso é normal)
- **Solução**: Não é um erro - é o comportamento esperado quando o email não está cadastrado

#### Outras rotas de API retornam 404
- Verifique se a rota existe em `app/api/`
- Verifique se o arquivo `route.ts` existe na pasta correta

### 3. Página Não Encontrada

Você está tentando acessar uma página que não existe.

**✅ Rotas Disponíveis**:
- `/` - Home
- `/jobs` - Lista de vagas
- `/jobs/[id]` - Detalhes da vaga
- `/login` - Login
- `/register` - Cadastro
- `/profile` - Perfil
- `/dashboard` - Dashboard (apenas empresas)

### 4. Recurso Estático Não Encontrado

Uma imagem ou arquivo está sendo referenciado mas não existe.

**✅ Como Verificar**:
1. Veja no console qual arquivo está retornando 404
2. Verifique se o arquivo existe em `public/`
3. Verifique se o caminho está correto

## 🔧 Soluções Rápidas

### Limpar Cache do Navegador

1. Pressione `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
2. Selecione "Imagens e arquivos em cache"
3. Clique em "Limpar dados"

### Verificar no DevTools

1. Abra o DevTools (F12)
2. Vá em **Console**
3. Veja se há erros específicos
4. Vá em **Network**
5. Filtre por "Failed" ou "404"
6. Veja qual recurso está falhando

### Verificar Logs no Vercel

1. Acesse o dashboard da Vercel
2. Vá em **Deployments**
3. Clique no deployment mais recente
4. Vá em **Functions** > **View Function Logs**
5. Procure por erros 404

## 📋 Checklist de Verificação

- [ ] O erro aparece no console do navegador?
- [ ] Qual URL está retornando 404?
- [ ] É uma rota de API? (`/api/...`)
- [ ] É uma página? (`/alguma-pagina`)
- [ ] É um recurso estático? (`/imagem.png`)
- [ ] O recurso deveria existir?

## 🎯 Erros 404 Comuns e Soluções

### `/favicon.ico` - 404

**Causa**: Navegador tentando carregar favicon automaticamente.

**Solução**: 
- Já foi adicionado ao projeto
- Limpe o cache do navegador
- Ou ignore (não afeta a funcionalidade)

### `/api/users/email/[email]` - 404

**Causa**: Email não encontrado no banco.

**Solução**: 
- Isso é **normal** quando o email não está cadastrado
- Não é um erro - é o comportamento esperado
- Crie uma conta primeiro

### `/api/...` - 404

**Causa**: Rota de API não existe.

**Solução**:
1. Verifique se a rota existe em `app/api/`
2. Verifique se o arquivo `route.ts` existe
3. Verifique se o método HTTP está correto (GET, POST, etc.)

### Página - 404

**Causa**: Página não existe.

**Solução**:
1. Verifique se a página existe em `app/`
2. Verifique se o nome do arquivo está correto
3. Verifique se está usando a rota correta

## 🔍 Como Identificar o Problema

### Passo 1: Abrir DevTools

1. Pressione `F12` no navegador
2. Vá na aba **Console**
3. Veja os erros listados

### Passo 2: Verificar Network

1. Vá na aba **Network** (Rede)
2. Recarregue a página (F5)
3. Procure por requisições com status **404**
4. Clique na requisição para ver detalhes

### Passo 3: Identificar o Recurso

Veja a coluna **Name** (Nome) para identificar qual recurso está retornando 404:
- `favicon.ico` = Favicon
- `/api/...` = Rota de API
- `/alguma-pagina` = Página
- `/imagem.png` = Recurso estático

## 💡 Dicas

1. **Erros 404 no console não são sempre problemas**: Alguns são esperados (como quando um email não existe)

2. **Favicon 404 é comum**: Não afeta a funcionalidade da aplicação

3. **Verifique os logs**: Os logs no Vercel mostram erros do servidor, não do cliente

4. **Cache do navegador**: Sempre limpe o cache ao testar mudanças

## 🆘 Ainda com Problemas?

1. **Verifique os logs completos** no dashboard da Vercel
2. **Compartilhe o erro específico**: Qual URL está retornando 404?
3. **Verifique se o recurso deveria existir**: É um erro real ou comportamento esperado?

## 📚 Documentação Relacionada

- [ERRO_EMAIL_NAO_ENCONTRADO.md](./ERRO_EMAIL_NAO_ENCONTRADO.md) - Erro relacionado a email
- [QUICK_FIX_POSTGRES.md](./QUICK_FIX_POSTGRES.md) - Correção rápida do Postgres
- [CONFIGURACAO_RAPIDA.md](./CONFIGURACAO_RAPIDA.md) - Configuração do Postgres

---

**Lembre-se**: Nem todos os erros 404 são problemas. Alguns são comportamentos esperados da aplicação (como quando um email não existe no banco).

