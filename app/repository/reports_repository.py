from app.db.models.trasactions import TransactionsDB
from app.db.models.categories import CategoryDB
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract

class ReportsRepository:
    def __init__(self, db: Session):
        self.db = db

    def transactions(self, user_id: int, start, end):
         
         transaction = self.db.query(
            CategoryDB.type,
            func.sum(TransactionsDB.value)
        ).join(CategoryDB).filter(
            TransactionsDB.user_id == user_id,
            TransactionsDB.transaction_date >= start,
            TransactionsDB.transaction_date < end
        ).group_by(CategoryDB.type).all()
         
         return transaction
    
    def categorys(self, user_id: int, start, end):
        category = self.db.query(
            CategoryDB.name,
            func.sum(TransactionsDB.value)
        ).join(
                CategoryDB, TransactionsDB.category_id ==  CategoryDB.id
            ).filter(
                TransactionsDB.user_id == user_id,
                TransactionsDB.transaction_date >= start,
                TransactionsDB.transaction_date < end
            ).group_by(CategoryDB.name).all()
        
        return category
    
    def top_expense(self, user_id: int, month, year):
        bigger_expense = self.db.query(TransactionsDB).filter(
            TransactionsDB.user_id == user_id,
            TransactionsDB.type == "expense",
            extract("month", TransactionsDB.transaction_date) == month,
            extract("year", TransactionsDB.transaction_date) == year
        ).order_by(desc(TransactionsDB.value)).first()

        return bigger_expense
    
    def the_average(self, user_id: int, month, year):
        average = self.db.query(func.avg(TransactionsDB.value)).filter(
            TransactionsDB.type == 'expense',
            TransactionsDB.user_id == user_id,
            extract("month", TransactionsDB.transaction_date) == month,
            extract("year", TransactionsDB.transaction_date) == year
        ).scalar()

        return average