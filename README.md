# TrackMoney · Ledger

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Pydantic](https://img.shields.io/badge/pydantic-%23E92063.svg?style=for-the-badge&logo=pydantic&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

Aplicação **full-stack de finanças pessoais** (*TrackMoney*, redimensionada como **Ledger**). O backend é uma **API RESTful** em **FastAPI** + **SQLAlchemy** com autenticação **JWT**; o frontend é um **SPA em React + Vite + Tailwind CSS v4** com design system *Papel / Noir*.

O frontend React fica em `web/` (stack atual). Existe também um frontend antigo em HTML/CSS/JS estático dentro de `frontend/`, que foi substituído pelo novo SPA em React.

---

## 🏗️ Arquitetura

```
FinanceApp
├── app/                    # Backend (FastAPI)
│   ├── core/               # config, security (JWT/bcrypt), auth, exceções
│   ├── db/                 # sessão SQLAlchemy + models (user, category, transactions)
│   ├── modules/            # regras de negócio por domínio
│   │   ├── user/           #   /auth
│   │   ├── categories/     #   /category
│   │   ├── transactions/   #   /transactions
│   │   └── reports/        #   /report
│   ├── repository/         # camada de acesso a dados (repositórios)
│   └── tests/              # pytest (services + endpoints)
├── alembic/                # migrações de banco de dados
├── web/                    # Frontend React + Vite (SPA)
│   └── src/
│       ├── components/     # AppShell, dialogs, StatCard, ui/ (shadcn)
│       ├── context/        # ThemeContext (Papel/Noir), AuthContext
│       ├── lib/            # api.js (axios), schemas.js (zod), utils.js
│       └── pages/          # Auth, Dashboard, Transactions, Categories, Settings
├── frontend/               # (legado) frontend estático HTML/CSS/JS
├── Dockerfile              # build da API
├── docker-compose.yml      # banco PostgreSQL isolado
└── requirements.txt
```

**Backend** (arquitetura modular):

```
app/
├── core/
│   ├── config.py           # pydantic-settings (lê .env)
│   ├── security.py         # hash/verificação bcrypt + criação de JWT
│   ├── auth.py             # dependência get_current_user (OAuth2 / auth/login)
│   └── exceptions/base.py  # ItemNaoEncontrado, NaoAutenticado
├── db/
│   ├── session.py          # engine, Base, Session, get_db
│   └── models/             # user.py, categories.py, trasactions.py
├── modules/                # routes.py + schema(s).py + service.py por domínio
├── repository/             # category, transactions, reports, user_repository
├── tests/                  # conftest.py, test_transaction.py
└── main.py                 # app FastAPI + CORS + handlers de erro
```

---

## 🔒 Autenticação JWT

- Access Token gerado no login (`/auth/login`), enviado no header:

```text
Authorization: Bearer <token>
```

- Token possui tempo de expiração de **30 minutos** (configurável via `ACCESS_TOKEN_EXPIRE_MINUTES`). Ao expirar, é necessário novo login.
- Senhas são protegidas com **bcrypt**.
- Rotas protegidas exigem o usuário autenticado via dependência `get_current_user`.

---

## 📦 API (endpoints)

| Módulo | Método | Rota | Descrição |
| ------ | ------ | ---- | --------- |
| **auth** | POST | `/auth/register` | Criar usuário |
| | POST | `/auth/login` | Login (OAuth2 form → JWT) |
| | DELETE | `/auth/delete_user` | Excluir usuário |
| **category** | POST | `/category/create` | Criar categoria |
| | GET | `/category/list` | Listar categorias do usuário |
| | PATCH | `/category/update/{id}` | Atualizar categoria |
| | DELETE | `/category/delete/{id}` | Excluir categoria |
| **transactions** | POST | `/transactions/` | Criar transação |
| | GET | `/transactions/list` | Listar (paginado, filtro por tipo/categoria) |
| | GET | `/transactions/monthly_transactions` | Transações do mês |
| | GET | `/transactions/expense_month` | Despesas do mês |
| | GET | `/transactions/income_month` | Receitas do mês |
| | PATCH | `/transactions/update/{id}` | Atualizar transação |
| | DELETE | `/transactions/delete/{id}` | Excluir transação |
| **report** | GET | `/report/balance` | Saldo do mês |
| | GET | `/report/by_category` | Resumo por categoria |
| | GET | `/report/monthly_report` | Relatório mensal |
| | GET | `/report/top` | Maior despesa |
| | GET | `/report/average` | Média de despesas |

Documentação interativa (Swagger/OpenAPI) disponível em `/docs`.

---

## ⚙️ Tecnologias

**Backend:** Python 3.12+ · FastAPI · SQLAlchemy 2.0 · Pydantic v2 · python-jose (JWT) · passlib/bcrypt · Pytest · Alembic

**Frontend:** React 19 · Vite · Tailwind CSS v4 · shadcn/ui (Radix) · react-hook-form + zod · axios · React Router 7 · sonner · lucide-react

---

## 🐳 Infraestrutura com Docker

O banco de dados (**PostgreSQL 16**) roda isolado em um container Docker.

### Pré-requisitos
- **Docker** e **Docker Compose** instalados.

---

## 🚀 Como rodar o projeto (desenvolvimento)

### 1️⃣ Clonar o repositório
```bash
git clone https://github.com/matheusrmds20/TrackMoney
cd TrackMoney
```

### 2️⃣ Criar ambiente virtual (somente backend)
```bash
python -m venv venv

# Linux/macOS/PowerShell
source venv/bin/activate

# Windows (CMD)
venv\Scripts\activate
```

### 3️⃣ Configurar variáveis de ambiente
```bash
# Windows (CMD)
copy .env.example .env

# Linux/macOS/PowerShell
cp .env.example .env
```
Preencha o `.env` com a sua `DATABASE_URL` (opcional) e `SECRET_KEY`.

### 4️⃣ Instalar dependências do backend
```bash
pip install -r requirements.txt
```

### 5️⃣ Subir o banco de dados
```bash
docker compose up -d        # inicia o PostgreSQL em segundo plano
docker compose down         # para o banco e remove os containers
```

### 6️⃣ Rodar a API
```bash
uvicorn app.main:app --reload
```
A API fica em `http://127.0.0.1:8000` e a documentação em `http://127.0.0.1:8000/docs`.

### 7️⃣ Rodar o frontend (SPA em React)
```bash
cd web
npm install
npm run dev                 # http://localhost:5173
```

> Em desenvolvimento, sem `VITE_API_URL`, o frontend usa o **proxy do Vite**
> (`web/vite.config.js`) que encaminha `/auth`, `/category`, `/transactions` e
> `/report` ao backend — funcionando sem erros de CORS.

**Build de produção do frontend:**
```bash
npm run build               # gera web/dist
npm run preview
```

Para apontar para outra API em produção, crie `web/.env` a partir de `.env.example`:
```bash
cp .env.example .env        # VITE_API_URL=https://...
```

---

## 🧪 Testes

Os testes cobrem tanto as regras de negócio puras (Services) quanto os endpoints de entrada. Para rodar todos os testes com o Pytest:

```bash
python -m pytest
```

---

## 🗄️ Migrações (Alembic)

As migrações de banco ficam em `alembic/versions/`. Exemplo de aplicação de uma migração:

```bash
alembic upgrade head
```

---

## 🌐 Deploy (provisionamento)

- **API:** hospedada na **Render** (`trackmoney-jjnl.onrender.com`) com proxy de headers.
- **Frontend:** publicado na **Vercel** (`track-money-blue.vercel.app`).
- A lista de origens permitidas pelo **CORS** está em `app/main.py` (origens de produção já incluídas).