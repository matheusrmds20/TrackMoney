# FastAPI Auth API (JWT + CLI)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) ![Pydantic](https://img.shields.io/badge/pydantic-%23E92063.svg?style=for-the-badge&logo=pydantic&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)

## Api RESTful para controle de financas pessoais com **FastAPI**, **SQLAlchemy** e autenticação com **JWT**. utilizando arquitetura modular, tratamento de exceções e testes automatizados.

## ✨ Funcionalidades


## 🛠️ Tecnologias

Python 3.13.2

FastAPI

SQLAlchemy

Pydantic

JWT

Pytest
## Estrutura do projeto

```text
FinanceApp/app
├── core/
│   ├── security.py
│   ├── auth.py
│   ├── config.py
│   └── exceptions/
│
├── db/
│   ├── session.py
│   └── models/
│
├── modules/
│   ├── categories/
│   ├── reports/
│   ├── transactions/
│   └── user/
│
├── repository/
│   ├── categories_repository.py
│   ├── reports_repository.py
│   ├── transactions_repository.py
│   └── user_repository.py
├── tests/
│   ├── coftest.py
│   └──  test_transaction.py
│ 
├── main.py
│ 
└── requirements.txt

```

## Como rodar o projeto

### 1️⃣ Clonar o repositório
```text
git clone <https://github.com/matheusrmds20/FastAPI_FInanceiro>
cd FastAPI_FInanceiro
```
### 2️⃣ Criar ambiente virtual
```text
python -m venv venv

# No Linux/macOS:
source .venv/bin/activate

# Windows
venv\Scripts\activate

```
### 3️⃣ Instalar dependências
```text
pip install -r requirements.txt
```
### 4️⃣ Rodar a API
```text
uvicorn main:app --reload
```
### acesse:

```text
A API esta disponivel em: http://127.0.0.1:8000 .Para acessar a documentacao acesse http://127.0.0.1:8000/docs
```

## Autenticação JWT

Access Token gerado no login

Enviado no header:
```text
Authorization: Bearer <token>
```
Token possui tempo de expiração de 30 minutos

Ao expirar, é necessário novo login

🧪 Testes




