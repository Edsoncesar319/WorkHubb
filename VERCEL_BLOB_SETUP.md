# Configuração do Vercel Blob - WorkHubb

Este projeto usa **Vercel Blob** para armazenar fotos de perfil dos usuários, substituindo o armazenamento em base64 no banco de dados.

## 🎯 Benefícios

- ✅ **Performance**: Imagens servidas via CDN global
- ✅ **Escalabilidade**: Não aumenta o tamanho do banco de dados
- ✅ **Custo**: Mais econômico para armazenamento de arquivos
- ✅ **Otimização**: Cache automático e distribuição global

## 📋 Configuração

### 1. Criar um Blob Store na Vercel

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Vá em **Storage** > **Create Database** > **Blob**
3. Escolha um nome para o seu Blob Store
4. Selecione a região (recomendado: mais próxima dos seus usuários)
5. Clique em **Create**

### 2. Obter o Token de Acesso

Após criar o Blob Store:

1. No dashboard do Blob Store, vá em **Settings**
2. Copie o **Token** (BLOB_READ_WRITE_TOKEN)
3. Adicione ao seu arquivo `.env.local`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Conectar ao Projeto

1. No dashboard do Blob Store, vá em **Settings**
2. Na seção **Projects**, adicione seu projeto Vercel
3. Ou use a CLI:

```bash
vercel link
vercel env pull
```

## 🚀 Uso

O sistema automaticamente:

1. **Faz upload** de novas fotos de perfil para o Vercel Blob
2. **Armazena apenas a URL** no banco de dados
3. **Mantém compatibilidade** com fotos antigas em base64
4. **Faz fallback** para base64 se o upload falhar

## 📝 Estrutura

- **API Route**: `app/api/upload/route.ts` - Endpoint para upload de imagens
- **Função de Upload**: `app/profile/page.tsx` - Funções `uploadToBlob()` e `uploadBase64ToBlob()`
- **Organização**: Imagens são armazenadas em `profile-photos/` no Blob Store

## 🔧 Desenvolvimento Local

Para desenvolvimento local, você ainda precisa:

1. Criar um Blob Store na Vercel (mesmo para desenvolvimento)
2. Configurar a variável `BLOB_READ_WRITE_TOKEN` no `.env.local`
3. O sistema funcionará normalmente

## ⚠️ Importante

- **Fotos antigas**: Fotos em base64 continuarão funcionando normalmente
- **Migração**: Fotos antigas serão migradas automaticamente para Blob quando o usuário atualizar o perfil
- **Fallback**: Se o upload para Blob falhar, o sistema usa base64 como fallback

## 📊 Monitoramento

Você pode monitorar o uso do Blob Store no dashboard da Vercel:

- **Armazenamento**: Tamanho total dos arquivos
- **Operações**: Número de uploads/downloads
- **Transferência**: Dados transferidos

## 💰 Custos

Consulte a [página de preços do Vercel Blob](https://vercel.com/pricing) para informações sobre custos.

Para projetos pequenos/médios, o plano Hobby geralmente é suficiente.

