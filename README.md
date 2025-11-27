# WorkHubb - Job Board

Uma plataforma moderna e intuitiva que conecta talentos de tecnologia com as melhores oportunidades do mercado brasileiro.

## 🚀 Sobre o Projeto

O WorkHubb é uma aplicação web desenvolvida em Next.js que facilita a conexão entre profissionais de tecnologia e empresas que buscam talentos. A plataforma oferece uma experiência completa para candidatos e recrutadores, com funcionalidades como busca de vagas, perfis profissionais e sistema de candidaturas.

## ✨ Funcionalidades

### Para Profissionais
- 🔍 **Busca de Vagas**: Sistema de busca avançado com filtros por localização (remoto/presencial)
- 👤 **Perfil Profissional**: Criação de perfil completo com stack tecnológica, projetos e experiências
- 📝 **Candidatura Rápida**: Sistema simplificado para candidatura às vagas
- 📊 **Acompanhamento**: Visualização das candidaturas realizadas

### Para Empresas
- 🏢 **Cadastro de Empresa**: Registro e gerenciamento de perfil empresarial
- 📋 **Publicação de Vagas**: Interface para criação e publicação de novas oportunidades
- 👥 **Gestão de Candidatos**: Acompanhamento das candidaturas recebidas

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15.2.4, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form, Zod
- **State Management**: React Hooks
- **Database**: SQLite (desenvolvimento) / Vercel Postgres (produção)
- **File Storage**: Vercel Blob (fotos de perfil)

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Passos para instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd workhubb-job-board
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Execute a aplicação em modo de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

4. **Acesse a aplicação**
   - Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 🏗️ Estrutura do Projeto

```
workhubb-job-board/
├── app/                    # Páginas da aplicação (App Router)
│   ├── dashboard/         # Dashboard do usuário
│   ├── jobs/             # Páginas relacionadas às vagas
│   ├── login/            # Página de login
│   ├── register/         # Página de registro
│   ├── profile/          # Página de perfil
│   └── layout.tsx        # Layout principal
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes de UI base
│   ├── navbar.tsx       # Barra de navegação
│   ├── footer.tsx       # Rodapé
│   └── job-card.tsx     # Card de vaga
├── lib/                 # Utilitários e lógica de negócio
│   ├── types.ts         # Definições de tipos TypeScript
│   ├── data.ts          # Funções de manipulação de dados
│   ├── auth.ts          # Lógica de autenticação
│   └── utils.ts         # Funções utilitárias
├── hooks/               # Custom hooks
├── styles/              # Estilos globais
└── public/              # Arquivos estáticos
```

## 🎨 Design System

O projeto utiliza um design system consistente baseado em:
- **Cores**: Sistema de cores com suporte a tema claro/escuro
- **Tipografia**: Fonte Inter para melhor legibilidade
- **Componentes**: Biblioteca de componentes baseada em Radix UI
- **Layout**: Design responsivo com Tailwind CSS

## 📱 Páginas Principais

- **Home** (`/`): Landing page com apresentação da plataforma
- **Vagas** (`/jobs`): Listagem e busca de vagas disponíveis
- **Detalhes da Vaga** (`/jobs/[id]`): Visualização completa de uma vaga
- **Login** (`/login`): Autenticação de usuários
- **Registro** (`/register`): Cadastro de novos usuários
- **Perfil** (`/profile`): Gerenciamento do perfil do usuário
- **Dashboard** (`/dashboard`): Painel de controle do usuário

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia o servidor de desenvolvimento

# Produção
npm run build        # Gera build de produção
npm run start        # Inicia o servidor de produção

# Qualidade de código
npm run lint         # Executa o linter ESLint
```

## 🚀 Deploy

Para fazer deploy da aplicação:

1. **Build de produção**
   ```bash
   npm run build
   ```

2. **Inicie o servidor de produção**
   ```bash
   npm run start
   ```

A aplicação estará disponível na porta 3000 por padrão.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

Para dúvidas ou sugestões, entre em contato através dos canais:
- Email: contato@workhubb.com
- LinkedIn: [WorkHubb](https://linkedin.com/company/workhubb)

---

Desenvolvido com ❤️ para conectar talentos tech com oportunidades incríveis.
