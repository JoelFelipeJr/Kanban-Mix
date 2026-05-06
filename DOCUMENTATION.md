# Documentação do Stratos Kanban

## 1. Visão Geral (Overview)

O KanbanMIX é um clone de Trello/Jira focado em performance, design moderno Dark Mode e sincronização de dados utilizando Supabase. 

Esta documentação serve para embasar novos desenvolvedores ou atuar como guia de manutenção da arquitetura e das regras de negócio do sistema.

## 2. Tecnologias Utilizadas

- **React 18+** utilizando Functional Components e Hooks.
- **Vite** como Build Tool e Development Server.
- **Tailwind CSS v4** para estilização utilitária (*design-system-in-code*). Use e abuse das configurações de tema no `@theme` dentro do `index.css`.
- **Supabase** (PostgreSQL + Auth + Storage). Usado tanto para autenticação como para banco de dados e Row Level Security (RLS).
- **Lucide React** para iconografia unificada.
- **@hello-pangea/dnd** para lidar com Drag and Drop acessível e de alta performance no board.

## 3. Arquitetura do Projeto

Abaixo estão os diretórios cruciais da aplicação:

```
src/
├── components/          # Componentes visuais.
│   ├── Auth.tsx         # Fluxo de login/registro.
│   ├── KanbanBoard.tsx  # Board principal que gerencia o Drag and Drop e os status.
│   ├── TaskCard.tsx     # O card visual renderizado com os dados resumidos.
│   ├── Sidebar.tsx      # Barra de navegação lateral (boards, membros e links limpos).
│   ├── SidebarModals.tsx# Modais isolados para melhorar code-splitting e organização.
│   └── CardModal.tsx    # Modal de detalhes ricos do card (descrição, comentários, etc).
├── hooks/               # Hooks customizados para regras de negócio (e.g. useBoardAccess).
├── lib/                 # Integrações globais (Supabase client e utils).
├── services/            # Serviços de controle de dados:
│   ├── api.ts           # Intermediário condicional que direciona Supabase ou Mock.
│   ├── mockData.ts      # Dados de fallback.
│   └── supabaseApi.ts   # Implementações da lógica em banco via Supabase JS Client.
├── types.ts             # Tipagens estritas das entidades do sistema.
└── App.tsx              # Componente raiz, gestor de estado auth e router simples.
```

## 4. Gerenciamento de Estado

O estado é gerenciado principalmente por meio de `useState`, `useEffect` e `useMemo` com passagens de callback descendentes (*prop drilling controlado*).

Os dados do Board ficam contidos no `KanbanBoard` e são refetched do banco toda vez ou sincronizados optimisticamente quando um drag ocorre (`onDragEnd`).

**Dica de Performance**: Cuidado ao passar novos arrays/objetos criados inline nas propriedades. Prefira `useCallback` ou `useMemo` (por exemplo, foi aplicado `useMemo` na lista `filteredCards` para que buscas no board não fiquem re-rankeando a lista o tempo todo na UI).

## 5. Como o Banco de Dados (Supabase) Funciona

Temos arquivos essenciais para consultar o schema: `supabase_schema.sql`.
A estrutura básica e relacionamentos do modelo lógico:
- `profiles`: Amarrado ao trigger do Auth (`auth.users`), armazena metadados do usuário (nome, avatar).
- `boards`: Container mestre.
- `board_members`: Junta Usuários a Boards e atribui uma `role` ('admin', 'member', 'reader').
- `columns`: As colunas de estado de um board. Relaciona 1:N ao board.
- `swimlanes`: As raias (para separação vertical). Relaciona 1:N ao board.
- `cards`: O ticket real. Relaciona a uma coluna e uma swimlane.
- `card_assignees`: Relação N:N de cards para usuários.
- `comments`: Relaciona `cards` e `auth.users`.
- `useful_links`: Apenas marcadores para o painel lateral do board.

### **Row Level Security (RLS)**
A segurança do banco é 100% amarrada com tokens de sessão e funções RPC:
- Apenas membros do Board veem os Cards através de RLS como `is_board_member()` acoplada as Policies.
- O delete em cascata já esta ativado: excluir um board exclui magicamente cards, membros e subcolunas pelo Postgres `ON DELETE CASCADE`.

## 6. Procedimentos e Manutenções

### 6.1 Adicionando um novo campo no Banco de Dados
1. Execute a query de `ALTER TABLE` no Editor SQL do seu Supabase.
   Ex: `ALTER TABLE cards ADD COLUMN estimate integer default 0;`
2. Modifique o modelo na interface do frontend em `src/types.ts`.
3. Ajuste `src/services/supabaseApi.ts` no `getBoardData` para resgatar este novo form, além de prever em queries como (`addCard`, `updateCard`).
4. Atualize a UI nos componentes Modais ou formulários.

### 6.2 Como investigar falhas de Drag and Drop (DnD)
O DnD ocorre na interface `@hello-pangea/dnd`. 
Sempre que uma transição for feita, nós:
1. Reestruturamos a lista de itens localmente `setCards(...)`.
2. Validamos e chamamos o envio pro banco (`api.moveCard`).

Se algo saltar ou falhar, verifique se o DropResult de Destino retornou os IDs correspondentes corretamente formatados no Split do Droppable `destination.droppableId.split("|")`.

## 7. Clean Code e Anti-patterns Evitados

- **Componentes monolíticos**: Os Modais viraram um agrupamento de pedaços organizados.
- **Segurança vs Rapidez**: RLS no PostgreSQL (backend) significa que APIs expostas não vazam dados, então a interface apenas consome tudo validado. Falhas de carregamento em deleção de boards agora exibem `try/catch` visual.
- **Tipagem (Type Safety)**: Evite usar o `any` sempre que possível para refatorações sem trauma.
