import pytest
from app.modules.transactions.service import TransactionService
from app.db.models.trasactions import TransactionsDB

# Create

def test_criar_usuario(db_session, default_category):
    service_t = TransactionService(db_session)
    data = TransactionsDB(
        title = "teste",
        value = 100,
        type = "income",
        user_id = 1,
        category_id  = default_category.id
    )

    transacao = service_t.create_transaction(1, data)

    assert transacao.id == 1
    assert transacao.id is not None

def test_transacao_existente(db_session, default_category):
    service_t = TransactionService(db_session)
    data = TransactionsDB(
        title = "teste",
        value = 100,
        type = "income",
        user_id = 1,
        category_id  = default_category.id
    )

    service_t.create_transaction(1, data)

    with pytest.raises(ValueError) as excinfo:
        service_t.create_transaction(1, data)
    

    assert str(excinfo.value) == "Transacao ja existente"


def test_titulo_vazio(db_session, default_category):
    service_t = TransactionService(db_session)
    data = TransactionsDB(
        title = "",
        value = 100,
        type = "income",
        user_id = 1,
        category_id  = default_category.id
    )

    with pytest.raises(ValueError) as excinfo:
        transacao = service_t.create_transaction(1, data)

    assert str(excinfo.value) == "O titulo da transacao nao pode estar vazio"

def test_valor_menor_0(db_session, default_category):
    service_t = TransactionService(db_session)
    data = TransactionsDB(
        title = "teste",
        value = 0,
        type = "income",
        user_id = 1,
        category_id  = default_category.id
    )

    with pytest.raises(ValueError) as excinfo:
        transacao = service_t.create_transaction(1, data)

    assert str(excinfo.value) == "O valor precisa ser maior do zero"

def test_sem_categoria(db_session, default_category):
    service_t = TransactionService(db_session)
    data = TransactionsDB(
        title = "teste",
        value = 1,
        type = "income",
        user_id = 1,
    )

    with pytest.raises(ValueError) as excinfo:
        transacao = service_t.create_transaction(1, data)

    assert str(excinfo.value) == "ID de Categoria nao se coicidem"

def test_limite_maior_0(db_session, default_category):
    pass