# 📊 Kanban Mix

Um **Kanban board moderno e de alta performance**, similar a Trello/Jira, com autenticação segura, gerenciamento em tempo real via Supabase e interface Dark Mode elegante.

**🚀 Live:** https://kanbanmix.web.app

---

## 📋 Índice

- [Requisitos](#requisitos)
- [Setup Local](#setup-local)
- [Deploy em Produção](#deploy-em-produção)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Arquitetura](#arquitetura)
- [Documentação Técnica](#documentação-técnica)

---

## 🔧 Requisitos

- **Node.js** 16+ (recomendado: 18+)
- **npm** ou **yarn**
- Conta **Supabase** configurada (PostgreSQL + Auth)
- Conta **Firebase** para deploy

---

## 🚀 Setup Local

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/JoelFelipeJr/Kanban-Mix.git
cd kanban-mix
npm install
```

### 2. Configurar variáveis de ambiente

Criar arquivo `.env.production` na raiz do projeto:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

> **Nota:** Substitua pelos valores reais do seu projeto Supabase (obtém em **Settings > API** no console Supabase)

### 3. Executar em desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

---

## 🌐 Deploy em Produção

### Via Firebase Hosting (Recomendado)

```bash
# Build para produção
npm run build

# Deploy
firebase deploy
```

**Processo automático:**
- ✓ Build executado automaticamente (`predeploy` no firebase.json)
- ✓ Variáveis de `.env.production` são injetadas no build
- ✓ Deploy para Firebase Hosting

---

## 🔐 Variáveis de Ambiente

### Desenvolvimento (`.env`)

Para ambiente local com dados mock, copie `.env` de um build anterior ou use dados mock do projeto.

### Produção (`.env.production`)

Obrigatória para deploy em produção. Contém credenciais do Supabase:

```
VITE_SUPABASE_URL=<URL_SUPABASE>
VITE_SUPABASE_ANON_KEY=<CHAVE_ANONIMA_SUPABASE>
```

**⚠️ Segurança:**
- Nunca commitar `.env.production` com dados reais
- `.env*` está no `.gitignore`
- Chaves são seguras (ANON_KEY permite apenas leitura com RLS)

---

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor Vite em localhost:3000 |
| `npm run build` | Build otimizado para produção |
| `npm run preview` | Prévia local do build de produção |
| `npm run lint` | Validação TypeScript (sem emit) |
| `npm run clean` | Remove pasta `dist/` |

---

## 🏗️ Arquitetura

**Estrutura resumida:**

```
src/
├── components/      # Componentes React (Auth, Board, Cards, Sidebar)
├── hooks/           # Hooks customizados (useBoardAccess)
├── lib/             # Integrações (Supabase client, utilities)
├── services/        # Lógica de dados (API, Supabase, Mock)
├── types.ts         # Tipagens TypeScript
└── App.tsx          # Componente raiz
```

**Stack de Tecnologias:**
- **React 19** - Framework UI
- **Vite 6** - Build tool e dev server
- **TypeScript 5.8** - Type safety
- **Tailwind CSS 4** - Estilização
- **Supabase** - Backend (Auth + Database)
- **@hello-pangea/dnd** - Drag and Drop acessível
- **Lucide React** - Ícones
- **Motion** - Animações

---

## 📖 Documentação Técnica

Para informações detalhadas sobre gerenciamento de estado, banco de dados e arquitetura do sistema, consulte o código-fonte:

- **`src/components/`** - Implementação dos componentes React
- **`src/services/`** - Lógica de integração com Supabase e mock data
- **`src/hooks/`** - Custom hooks para lógica compartilhada

---

## 🎯 Tipos de Cards

O sistema suporta os seguintes tipos de tarefas:

- **INI** - Iniciativa (roxo)
- **EPI** - Epic (laranja)
- **STY** - Story (azul)
- **TSK** - Task (verde)
- **BUG** - Bug (vermelho)
- **REV** - Review (ciano)
- **IMP** - Improvement (amarelo)

---

## 🔗 Links Úteis

- **GitHub:** https://github.com/JoelFelipeJr/Kanban-Mix
- **Live:** https://kanbanmix.web.app
- **Supabase Docs:** https://supabase.com/docs
- **Firebase Docs:** https://firebase.google.com/docs

---

## 📄 Licença

Projeto pessoal. Todos os direitos reservados.

---

**Última atualização:** Maio 2026
