from app.modules.transactions.schemas import TransactionCreate, TransactionUpdate
from app.db.models.trasactions import TransactionsDB, TransactionType
from app.db.models.categories import CategoryDB
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from app.repository.transactions_repository import TransactionRepository


def create_transaction(db: Session, user_id: int ,data: TransactionCreate):
    transaction_already_exist = db.query(TransactionsDB).filter(
        func.lower(TransactionsDB.title) == func.lower(data.title)
).first()
    
    category = db.query(CategoryDB).filter(CategoryDB.id == data.category_id).first()


    if transaction_already_exist:
        raise ValueError("Transacao ja existente")
    
    if not data.title or data.title.strip() == "":
        raise ValueError("O titulo da transacao nao pode estar vazio")
    
    if data.value <= 0:
        raise ValueError("O valor precisa ser maior do zero")
    
    if data.type not in TransactionType:
        raise ValueError("O tipo da transacao precisa ser 'income' ou 'expense")
    
    if not category:
       raise ValueError("ID de Categoria nao se coicidem")
    
    transaction = TransactionRepository.create_transacation(db, user_id, data)


    return transaction
    

def list_transaction(
        db: Session,
        user_id: int,
        limit: int = 5,
        page: int = 1,
        type: str | None = None,
        category_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None
):
    
    offset = (page - 1) * limit
    
    query = db.query(TransactionsDB).filter(
        TransactionsDB.user_id == user_id
    )

    if type:
        query = query.filter(TransactionsDB.type == TransactionType(type))

    if category_id:
        query = query.filter(TransactionsDB.category_id == category_id)
    
    if start_date:
        query = query.filter(TransactionsDB.transaction_date >= start_date)
    
    if end_date:
        query = query.filter(TransactionsDB.transaction_date <= end_date)

    total = query.count()

    data = query.order_by(
        TransactionsDB.transaction_date.desc()        
    ).offset(offset).limit(limit).all()


    transactions = db.query(TransactionsDB).filter(TransactionsDB.user_id == user_id).all()

    if not transactions:
        raise ValueError("Transacao nao econtrada")

    if limit > 100:
        raise ValueError("Limite muito alto")


    return {
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,   
        "limit": limit,
        "data": data
    }


def list_transaction_id(db: Session, user_id: int, transaction_id: int):
    transaction = TransactionRepository.transaction_id_repo(db, user_id, transaction_id)
    
    if not transaction:
        raise ValueError("Transacao nao encontrada")
    
    
    return transaction


def update_transaction(db: Session, user_id: int, transaction_id: int, data: TransactionUpdate):
    transaction = TransactionRepository.update_transaction_repo(db, user_id, transaction_id, data)

    if not transaction:
        raise ValueError("Transacao nao encontrada")

    return transaction


def delete_transaction(db: Session, user_id:int, transaction_id: int):

    transaction_exist = db.query(TransactionsDB).filter(
        TransactionsDB.id == transaction_id
).first()
    
    if not transaction_exist:
        raise ValueError("Transacao nao encontrada")

    transaction = TransactionRepository.delete_transaction_repo(db, user_id, transaction_id)
    
    return transaction
