# Finance App
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) ![Pydantic](https://img.shields.io/badge/pydantic-%23E92063.svg?style=for-the-badge&logo=pydantic&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)

## Api RESTful para controle de financas pessoais com **FastAPI**, **SQLAlchemy** e autenticação com **JWT**. utilizando arquitetura modular, tratamento de exceções e testes automatizados.

## 🔒 Autenticação JWT

Access Token gerado no login

Enviado no header:
```text
Authorization: Bearer <token>
```
Token possui tempo de expiração de 30 minutos

Ao expirar, é necessário novo login## 🔒 Autenticação JWT

Access Token gerado no login

Enviado no header:
```text
Authorization: Bearer <token>
```
Token possui tempo de expiração de 30 minutos

Ao expirar, é necessário novo login

## 🐳 Infraestrutura com Docker

O banco de dados da aplicação (PostgreSQL/MySQL) roda de forma isolada em um container Docker. 

### Pré-requisitos
* **Docker** e **Docker Compose** instalados na sua máquina.

### Como subir o Banco de Dados
Na raiz do projeto (onde está o arquivo `docker-compose.yml`), execute o comando abaixo para iniciar o banco de dados em segundo plano:

```
docker compose up -d
```
Se precisar parar o banco de dados e remover os containers, utilize:

```
docker compose down
```

## ⚙️ Tecnologias

Python

FastAPI

SQLAlchemy

Pydantic

JWT

Pytest

## ⚙️ Requisitos
Python 3.13.2+

Docker

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
git clone https://github.com/matheusrmds20/FastAPI_FInanceiro
cd FastAPI_FInanceiro
```

### 2️⃣ Criar ambiente virtual
```text

Primeiro crie o ambiente
python -m venv venv

Depois ative o ambiente
# No Linux/macOS:
source .venv/bin/activate

# Windows
venv\Scripts\activate

```
### 3️⃣ Configurar variaveis de ambiente
Copie o arquivo de exemplo e preencha com as suas configurações locais:

```
codigo para criar o aquivo .env

copy .env.example .env
```
E preencha o arquivo .env gerado com a sua DATABASE_URL e SECRET_KEY.

### 4️⃣ Instalar dependências
```text
pip install -r requirements.txt

```

### 5️ Subir o Banco de Dados
Na raiz do projeto (onde está o arquivo `docker-compose.yml`), execute o comando abaixo para iniciar o banco de dados em segundo plano:

```
docker compose up -d
```
Se precisar parar o banco de dados e remover os containers, utilize:

```
docker compose down
```

### 6️⃣ Rodar a API
```text
uvicorn app.main:app --reload
```
### acesse:

```text
A API esta disponivel em: http://127.0.0.1:8000. Para acessar a documentacao acesse http://127.0.0.1:8000/docs
```

## 🧪 Testes

Os testes cobre tanto as regras de negócio puras (Services) quanto os endpoints de entrada
Para rodar todos os testes executados pelo Pytest:

```text
python -m pytest
```
