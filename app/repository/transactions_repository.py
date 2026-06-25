from app.db.models.trasactions import TransactionsDB, TransactionType
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from app.db.models.categories import CategoryDB
from app.db.models.user import UserDB
from fastapi import Depends
from app.db.session import get_db
from datetime import datetime


class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def user_id_first(self, user_id: int):

        return self.db.query(TransactionsDB).filter(TransactionsDB.user_id == user_id).first()
    

    def user_id_all(self, user_id: int):

        return self.db.query(TransactionsDB).filter(TransactionsDB.user_id == user_id).all()
    

    def transaction_query(self, user_id: int):
        
        return self.db.query(TransactionsDB).filter(TransactionsDB.user_id == user_id)


    def get_title(self, title):

        return self.db.query(TransactionsDB).filter(TransactionsDB.title == title).first()


    def offset(self, query, offset, limit):

        return query.order_by(
            TransactionsDB.transaction_date.desc()        
        ).offset(offset).limit(limit).all()


    def create_transacation(self, user_id: int, data):
        transaction = TransactionsDB(
        title = data.title,
        value = data.value,
        type = data.type,
        user_id = user_id,
        category_id = data.category_id
    )

        try:
            self.db.add(transaction)
            self.db.commit()
            self.db.refresh(transaction)
            return transaction
    
        except IntegrityError as e:
            self.db.rollback()
            raise e
        

    def transaction_id_repo(self, user_id: int, transaction_id: id):
        transaction = self.db.query(TransactionsDB).filter(
        TransactionsDB.id == transaction_id,
        TransactionsDB.user_id == user_id
).first() 
        
        return transaction
        

    def update_transaction_repo(self, user_id: int,transaction_id: int, data):
        transaction = self.transaction_id_repo(user_id, transaction_id)
        try:
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(transaction, field, value)

            self.db.commit()
            self.db.refresh(transaction)
            return transaction
        except IntegrityError as e:
            self.db.rollback()
            raise e
        

    def delete_transaction_repo(self, user_id: int, transaction_id: int):
        transaction = self.transaction_id_repo(user_id, transaction_id)
        
        try:
            self.db.delete(transaction)
            self.db.commit()
        except IntegrityError as e:
            self.db.rollback()
            raise e

    def monthly_transactions_repo(self, user_id: int, start, end):
        transactions = self.db.query(TransactionsDB).filter(
            TransactionsDB.user_id == user_id,
            TransactionsDB.transaction_date >= start,
            TransactionsDB.transaction_date < end
        ).group_by(TransactionsDB).all()

        return transactions
    
    def expense_month_repo(self, user_id: int, start, end):
        transactions = self.db.query(TransactionsDB).filter(
            TransactionsDB.user_id == user_id,
            TransactionsDB.type == TransactionType.expense,
            TransactionsDB.transaction_date >= start,
            TransactionsDB.transaction_date < end
        ).all()

        return transactions
    
    def income_month_repo(self, user_id: int, start, end):
        transactions = self.db.query(TransactionsDB).filter(
            TransactionsDB.user_id == user_id,
            TransactionsDB.type == TransactionType.income,
            TransactionsDB.transaction_date >= start,
            TransactionsDB.transaction_date < end
        ).all()

        return transactions

    