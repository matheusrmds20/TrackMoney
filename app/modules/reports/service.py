from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.models.categories import CategoryDB
from app.db.models.trasactions import TransactionsDB

def balance(db: Session, user_id: int, year, month):

    start = datetime(year,month, 1)
    if month == 12:
        end = datetime(year + 1 , 1, 1)

    else:
        end = datetime(year, month + 1, 1)

    transaction = db.query(
        CategoryDB.type,
        func.sum(TransactionsDB.value)
    ).join(CategoryDB).filter(
        TransactionsDB.user_id == user_id,
        TransactionsDB.transaction_date >= start,
        TransactionsDB.transaction_date < end
    ).group_by(CategoryDB.type).all()

    result = {"income": 0, "expense": 0}

    for t_type, total in transaction:
        result[t_type.value] = float(total)

    result["balance"] = result["income"] - result["expense"]

    return result


def by_category(db: Session, user_id: int, year: int, month: int):
        
    start = datetime(year, month, 1)
        
    if month == 12:
        end = datetime(year + 1, 1 ,1)
    else:
        end =  datetime(year, month + 1, 1)

    categoria = db.query(
        CategoryDB.name,
        func.sum(TransactionsDB.value)
    ).join(
            CategoryDB, TransactionsDB.category_id ==  CategoryDB.id
        ).filter(
            TransactionsDB.user_id == user_id,
            TransactionsDB.transaction_date >= start,
            TransactionsDB.transaction_date < end
        ).group_by(CategoryDB.name).all()
    
    return {name: float(total) for name, total in categoria}

def monthly_report(db: Session, user_id: int, year: int, month: int):
    balance_monthly = balance(db, user_id, year, month)
    category_monthly = by_category(db, user_id, year, month)

    return{
        **balance_monthly,
            "by_category": category_monthly
    }
