# Ledger · TrackMoney (frontend React)

Frontend do fintech **Ledger** — redesenhado do zero em React + Vite, com o design
system **Ledger Paper (claro) / Noir (escuro)** com toggle. Mantém a essência do
TrackMoney (finanças pessoais) e o tema, mudando stack, fluxo e arquitetura.

## Stack

- React 19 + Vite + Tailwind CSS v4 (config via CSS-first)
- **shadcn/ui** (primitivos: Dialog, Select, Tabs, Switch, Badge, etc. — JSX adaptado)
- `react-hook-form` + `zod` (validação de formulários)
- `axios` (client com interceptors de token e 401)
- `react-router-dom` (rotas protegidas)
- `sonner` (toasts), `lucide-react` (ícones)

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de produção
npm run preview
```

Para apontar para outra API, crie `web/.env` a partir de `.env.example`:

```bash
cp .env.example .env   # VITE_API_URL=https://...
```

> Em desenvolvimento, sem `VITE_API_URL`, o app usa o **proxy do Vite** (veja
> `vite.config.js`) e chama a API via caminho relativo — sem erros de CORS.

## Estrutura

```
src/
  lib/            api.js (axios + interceptors), schemas.js (zod), utils.js (formatadores)
  context/        ThemeContext (Noir/Papel), AuthContext (login/registro/logout)
  components/     AppShell (sidebar+topbar), dialogs (despesa/categoria), StatCard, etc.
  components/ui/  primitivos shadcn (button, input, dialog, select, tabs, ...)
  pages/          Auth, Dashboard, Transactions, Categories, Settings
```

## Rotas

| Rota         | Acesso | Descrição                          |
| ------------ | ------ | ---------------------------------- |
| `/login`     | guest  | Autenticação (tabs Entrar/Criar)   |
| `/register`  | guest  | Registro (mesma tela)              |
| `/dashboard` | auth   | KPIs + lançamentos + por categoria |
| `/despesas`  | auth   | CRUD de despesas/receitas          |
| `/categorias`| auth   | CRUD de categorias                 |
| `/ajustes`   | auth   | Conta, tema, preferências          |

## Design tokens (`src/index.css`)

O toggle troca a classe `.dark` no `<html>`:
- **`:root`** = Ledger **Papel** (claro): petróleo `#0e7a66`, papel `#f3f1ea`, Fraunces + Inter.
- **`.dark`** = Ledger **Noir** (escuro): grafite quente `#0e0d0b`, brass `#c7a45d`,
  petróleo `#5f8f7a`, rosa-museu `#cf7b7b`.

## Estado atual

- Telas e CRUDs implementados e validados (via build + testes Playwright com mocks).
- **Limitações do backend** (não há endpoint na API atual): troca de senha e
  atualização de perfil ficam como placeholder/"em breve"; "excluir conta" usa
  `/auth/delete_user` com o id decodificado do JWT.
- **CORS (dev):** um proxy do Vite (`vite.config.js`) encaminha `/auth`, `/category`,
  `/transactions` e `/report` ao backend — assim o desenvolvimento local funciona **sem**
  depender de redeploy do CORS. Em produção, defina `VITE_API_URL` (ex.: a URL hospedada)
  e garanta que a origem do deploy esteja na lista CORS do `app/main.py`
  (`http://localhost:5173` já foi adicionado).