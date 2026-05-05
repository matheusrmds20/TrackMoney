from app.db.models.trasactions import TransactionsDB
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.db.models.categories import CategoryDB


class TransactionRepository:


    def create_transacation(db: Session, user_id: int, data):
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
            raise e
        

    def transaction_id_repo(db: Session, user_id: int, transaction_id: id):
        transaction = db.query(TransactionsDB).filter(
        TransactionsDB.id == transaction_id,
        TransactionsDB.user_id == user_id
).first() 
        
        return transaction
        

    def update_transaction_repo(db: Session, user_id: int,transaction_id: int, data):
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
        except IntegrityError as e:
            db.rollback()
            raise e
        

    def delete_transaction_repo(db: Session, user_id: int, transaction_id: int):
        transaction = db.query(TransactionsDB).filter(
            TransactionsDB.id == transaction_id,
            TransactionsDB.user_id == user_id            
).first()
        
        try:
            db.delete(transaction)
            db.commit()
        except IntegrityError as e:
            db.rollback()
            raise e
