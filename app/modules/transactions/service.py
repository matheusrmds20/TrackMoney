from app.modules.transactions.schemas import TransactionCreate, TransactionUpdate
from app.db.models.trasactions import TransactionsDB, TransactionType
from app.db.models.categories import CategoryDB
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime


def create_transaction(db: Session, user_id: int ,data: TransactionCreate):
    transaction_already_exist = db.query(TransactionsDB).filter(
        func.lower(TransactionsDB.title) == func.lower(data.title)
).first()

    category = db.query(CategoryDB).filter(CategoryDB.id == data.category_id).first()

    if transaction_already_exist:
        raise HTTPException(status_code=400, detail="Transacao ja existente")
    
    if not data.title or data.title.strip() == "":
        raise HTTPException(status_code=400, detail="A transicao precisa ter pelo menos um caracter")
    
    if not category:
        raise HTTPException(status_code=400, detail="Categoria nao encontrada")
    
    if category.type != data.type:
        raise HTTPException(status_code=400, detail="Categorias nao se coicidem")


    transaction = TransactionsDB(
        title = data.title,
        value = data.value,
        type = data.type,
        user_id = user_id,
        category_id = data.category_id
    )

    try:
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction
    
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro de integridade: {str(e.orig)}")
    

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
        raise HTTPException(status_code=404, detail="Transacao nao encontrada")
    
    if page < 1:
        raise HTTPException(400, "Paginacao tem que ser maior do que 1")

    if limit > 100:
        raise HTTPException(400, "Limite muito alto")


    return {
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,   
        "limit": limit,
        "data": data
    }


def list_transaction_id(db: Session, user_id: int, transaction_id: int):
    transaction = db.query(TransactionsDB).filter(
        TransactionsDB.id == transaction_id,
        TransactionsDB.user_id == user_id
).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacao nao encontrada")
    
    return transaction


def update_transaction(db: Session, user_id: int, transaction_id: int, data: TransactionUpdate):
    transaction = db.query(TransactionsDB).filter(
        TransactionsDB.id == transaction_id,
        TransactionsDB.user_id == user_id
).first()

    try:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(transaction, field, value)

        db.commit()
        db.refresh(transaction)
        return transaction
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Algo deu errado tente novamente")



def delete_transaction(db: Session, user_id:int, transaction_id: int):
    transaction = db.query(TransactionsDB).filter(
        TransactionsDB.id == transaction_id,
        TransactionsDB.user_id == user_id
).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacao nao encontrada")
    
    if transaction.user_id != user_id:
        raise HTTPException(status_code=403, detail="id da Category incorreta")
    
    try:
        db.delete(transaction)
        db.commit()
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Algo deu errado tente novamente")
    