from app.modules.transactions.schemas import TransactionCreate, TransactionUpdate
from app.db.models.trasactions import TransactionsDB, TransactionType
from app.db.models.categories import CategoryDB
from fastapi import HTTPException, Depends
from app.db.session import get_db
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from app.repository.transactions_repository import TransactionRepository

class TransactionService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.repository = TransactionRepository(db)


    def create_transaction(self, user_id: int ,data: TransactionCreate):
        transaction_already_exist = self.repository.get_title(data.title)
        
        category = self.db.query(CategoryDB).filter(CategoryDB.id == data.category_id).first()


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
        
        transaction = self.repository.create_transacation(user_id, data)


        return transaction
    

    def list_transaction(
            self,
            user_id: int,
            limit: int = 5,
            page: int = 1,
            type: str | None = None,
            category_id: int | None = None,
            start_date: datetime | None = None,
            end_date: datetime | None = None
    ):
        
        offset = (page - 1) * limit
        
        query = self.repository.transaction_query(user_id)

        if type:
            query = query.filter(TransactionsDB.type == TransactionType(type))

        if category_id:
            query = query.filter(TransactionsDB.category_id == category_id)
        
        if start_date:
            query = query.filter(TransactionsDB.transaction_date >= start_date)
        
        if end_date:
            query = query.filter(TransactionsDB.transaction_date <= end_date)

        if limit <= 0:
            raise ValueError("Valor limite tem que ser maior do que 0")
        
        if page <= 0:
            raise ValueError("Valor de paginas tem ser maior do que 0")

        total = query.count()

        data = self.repository.offset(query, offset, limit)


        transactions = self.repository.user_id_all(user_id)

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


    def list_transaction_id(self, user_id: int, transaction_id: int):
        transaction = self.repository.transaction_id_repo(user_id, transaction_id)
        
        if not transaction:
            raise ValueError("Transacao nao encontrada")
        
        return transaction


    def update_transaction(self, user_id: int, transaction_id: int, data: TransactionUpdate):
        transaction = self.repository.update_transaction_repo(user_id, transaction_id, data)

        if not data.title or data.title.strip() == "":
            raise ValueError("O titulo da transacao nao pode estar vazio")

        if not transaction:
            raise ValueError("Transacao nao encontrada")

        return transaction


    def delete_transaction(self, user_id:int, transaction_id: int):

        transaction_exist = self.repository.transaction_id_repo(user_id, transaction_id)
        
        if not transaction_exist:
            raise ValueError("Transacao nao encontrada")

        transaction = self.repository.delete_transaction_repo(user_id, transaction_id)

        return transaction