import pytest
from decimal import Decimal
from app.db.models.trasactions import TransactionsDB
from app.modules.transactions.service import TransactionService
from app.modules.transactions.schemas import TransactionUpdate
from app.core.exceptions.base import ItemNaoEncontrado

# ----------------------------------------------------------------------
#  TESTES DE FUNCIONAMENTO (SERVICE)
# ----------------------------------------------------------------------

def test_criar_transacao(db_session, default_category):
    service_t = TransactionService(db_session)
    data = TransactionsDB(
        title="teste",
        value=100,
        type="income",
        user_id=1,
        category_id=default_category.id
    )

    transacao = service_t.create_transaction(1, data)

    assert transacao.id is not None
    assert transacao.value == 100
    assert transacao.type.value == "income"


def test_listar_transacoes(db_session, default_transaction):
    service_t = TransactionService(db_session)
    default_transaction()

    listagem = service_t.list_transaction(user_id=1, limit=1, page=1)

    assert isinstance(listagem, dict)
    assert len(listagem["items"]) == 1
    assert listagem["limit"] == 1
    assert listagem["page"] == 1


def test_listar_por_id(db_session, default_transaction):
    service_t = TransactionService(db_session)
    tx1 = default_transaction()

    listar = service_t.list_transaction_id(user_id=1, transaction_id=tx1.id)

    assert listar.id == tx1.id
    assert listar.title == tx1.title
    assert listar.value == tx1.value
    assert listar.user_id == 1


def test_atualizar_transacao(db_session, default_category, default_transaction):
    service_t = TransactionService(db_session)
    tx1 = default_transaction()

    atualizar = TransactionUpdate(
        title="testando",
        value=300,
        type="expense",
        category_id=default_category.id
    )

    transacao_atualizada = service_t.update_transaction(user_id=1, transaction_id=tx1.id, data=atualizar)

    assert transacao_atualizada.title == "testando"
    assert transacao_atualizada.value == 300
    assert transacao_atualizada.type.value == "expense"
    assert transacao_atualizada.category_id == default_category.id


def test_deletar_transacao(db_session, default_transaction):
    service_t = TransactionService(db_session)
    tx1 = default_transaction()

    task_deletada = service_t.delete_transaction(user_id=1, transaction_id=tx1.id)

    assert task_deletada is None


# ----------------------------------------------------------------------
#  TESTES DE FUNCIONAMENTO HTTP
# ----------------------------------------------------------------------

def test_criar_transacao_HTTP(auth_client, default_category):
    payload = {
        "title": "Netflix",
        "value": 59.90,
        "type": "expense",
        "category_id": default_category.id
    }

    response = auth_client.post("transactions/?user_id=1", json=payload)
    assert response.status_code == 200


def test_listar_transacoes_HTTP(auth_client, default_transaction):
    tx1 = default_transaction()

    response = auth_client.get("transactions/list?user_id=1")
    assert response.status_code == 200

    json_data = response.json()
    assert "items" in json_data
    assert len(json_data["items"]) == 1
    assert json_data["items"][0]["title"] == tx1.title
    assert f"{Decimal(str(json_data['items'][0]['value'])):.2f}" == f"{tx1.value:.2f}"

def test_atualizar_transacao_HTTP(auth_client, default_transaction, default_category):
    tx1 = default_transaction()
    payload = {
        "title": "Netflix",
        "value": 59.90,
        "type": "expense",
        "category_id": default_category.id
    }

    response = auth_client.patch(f"transactions/update/{tx1.id}?user_id=1", json=payload)
    assert response.status_code == 200

    json_data = response.json()
    assert json_data["title"] == "Netflix"  # Corrigido: Deve validar o valor do payload enviado
    assert f"{json_data['value']:.2f}" == "59.90"


def test_deletar_transacao_HTTP(auth_client, default_transaction, db_session):
    tx1 = default_transaction()

    response = auth_client.delete(f"transactions/delete/{tx1.id}?user_id=1")
    assert response.status_code == 200

    db_session.expire_all()
    tx_deletada = db_session.query(TransactionsDB).filter_by(id=tx1.id).first()
    assert tx_deletada is None


# ----------------------------------------------------------------------
#  TESTES DE ERROS (SERVICE)
# ----------------------------------------------------------------------

def test_transacao_existente_erro(db_session, default_transaction):
    service_t = TransactionService(db_session)
    tx1 = default_transaction()

    with pytest.raises(ValueError) as excinfo:
        service_t.create_transaction(1, tx1)
    
    assert str(excinfo.value) == "Transacao ja existente"


def test_titulo_vazio_erro(db_session, default_category):
    service_t = TransactionService(db_session)
    data = TransactionsDB(
        title="",
        value=100,
        type="income",
        user_id=1,
        category_id=default_category.id
    )

    with pytest.raises(ValueError) as excinfo:
        service_t.create_transaction(1, data)

    assert str(excinfo.value) == "O titulo da transacao nao pode estar vazio"


def test_valor_menor_0_erro(db_session, default_category):
    service_t = TransactionService(db_session)
    data = TransactionsDB(
        title="teste",
        value=0,
        type="income",
        user_id=1,
        category_id=default_category.id
    )

    with pytest.raises(ValueError) as excinfo:
        service_t.create_transaction(1, data)

    assert str(excinfo.value) == "O valor precisa ser maior do zero"


def test_sem_categoria_erro(db_session):
    service_t = TransactionService(db_session)
    data = TransactionsDB(
        title="teste",
        value=100,
        type="income",
        user_id=1,
        category_id=999
    )

    with pytest.raises(ValueError) as excinfo:
        service_t.create_transaction(1, data)

    assert str(excinfo.value) == "ID de Categoria nao se coicidem"


def test_limite_maior_0_erro(db_session):
    service_t = TransactionService(db_session)

    with pytest.raises(ValueError) as excinfo:
        service_t.list_transaction(user_id=1, limit=0, page=1)
    
    assert str(excinfo.value) == "Valor limite tem que ser maior do que 0"


def test_paginacao_maior_0_erro(db_session):
    service_t = TransactionService(db_session)

    with pytest.raises(ValueError) as excinfo:
        service_t.list_transaction(user_id=1, limit=1, page=0)

    assert str(excinfo.value) == "Valor de paginas tem ser maior do que 0"


def test_transacao_nao_encontrada_erro(db_session):
    service_t = TransactionService(db_session)

    with pytest.raises(ItemNaoEncontrado) as excinfo:
        service_t.list_transaction(user_id=1, limit=1, page=1)

    assert str(excinfo.value) == "Transacao nao encontrada"


def test_limite_alto_erro(db_session, default_transaction):
    service_t = TransactionService(db_session)
    default_transaction()
    
    with pytest.raises(ValueError) as excinfo:
        service_t.list_transaction(user_id=1, limit=101, page=1)
    
    assert str(excinfo.value) == "Limite muito alto"


def test_listagem_id_erro(db_session):
    service_t = TransactionService(db_session)

    with pytest.raises(ItemNaoEncontrado) as excinfo:
        service_t.list_transaction_id(user_id=1, transaction_id=999)

    assert str(excinfo.value) == "Transacao nao encontrada"


def test_atualizar_transacao_erro(db_session, default_category, default_transaction):
    service_t = TransactionService(db_session)
    data = TransactionUpdate(
        title="a",
        value=101,
        type="income",
        category_id=default_category.id
    )

    with pytest.raises(ItemNaoEncontrado) as excinfo:
        service_t.update_transaction(user_id=1, transaction_id=999, data=data)

    assert str(excinfo.value) == "Transacao nao encontrada"


def test_deleta_transacao_erro(db_session):
    service_t = TransactionService(db_session)

    with pytest.raises(ItemNaoEncontrado) as excinfo:
        service_t.delete_transaction(user_id=1, transaction_id=999)

    assert str(excinfo.value) == "Transacao nao encontrada"


# ----------------------------------------------------------------------
#  TESTES DE ERROS HTTP
# ----------------------------------------------------------------------

def test_erro_criar_transacao_HTTP(auth_client, default_category):
    payload = {
        "title": "Netflix",
        "value": "Texto",
        "type": "expense",
        "category_id": default_category.id
    }

    response = auth_client.post("transactions/?user_id=1", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "Input should be a valid number, unable to parse string as a number"


def test_erro_listar_sem_transacoes_HTTP(auth_client):

    response = auth_client.get("transactions/list?user_id=1")
    assert response.status_code == 404


def test_erro_listar_transacoes_id_nao_autenticado_HTTP(client, default_transaction):
    tx1 = default_transaction()


    response = client.get(f"transactions/list/{tx1.id}?user_id=1")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_erro_atualizar_transacao_HTTP(auth_client, default_transaction, default_category):
    tx1 = default_transaction()
    payload = {
        "title": "",
        "value": 100,
        "type": "expense",
        "category_id": default_category.id
    }

    response = auth_client.patch(f"transactions/update/{tx1.id}?user_id=1", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"][0]["msg"] == "String should have at least 1 character"


def test_erro_deletar_transacao_nao_existente_HTTP(auth_client):
    response = auth_client.delete("transactions/delete/9999?user_id=1")
    assert response.status_code == 404
    assert response.json()["detail"] == "Transacao nao encontrada"