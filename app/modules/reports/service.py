from datetime import datetime
from sqlalchemy import func, desc, extract
from sqlalchemy.orm import Session
from app.db.models.categories import CategoryDB
from app.db.models.trasactions import TransactionsDB
from fastapi import HTTPException

def balance(db: Session, user_id: int, year, month):

    if year < 2000 or year > 2100:
        raise HTTPException(status_code=400, detail="Ano fora dos limites")
    
    if not 1 <= month <= 12:
        raise HTTPException(status_code=400, detail="Mes invalido")


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
        if t_type.value in result:
            result[t_type.value] = float(total or 0)

    result["balance"] = round(result["income"] - result["expense"], 2)

    return result


def by_category(db: Session, user_id: int, year: int, month: int):

    if year < 2000 or year > 2100:
        raise HTTPException(status_code=400, detail="Ano fora dos limites")
    
    if not 1 <= month <= 12:
        raise HTTPException(status_code=400, detail="Mes invalido")
        
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
    
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria nao encontrada")
    
    return {name: float(total) for name, total in categoria}

def monthly_report(db: Session, user_id: int, year: int, month: int):
    balance_monthly = balance(db, user_id, year, month)
    category_monthly = by_category(db, user_id, year, month)

    return{
        **balance_monthly,
            "by_category": category_monthly
    }

def top_expense(db: Session, user_id: int, year: int, month: int):
    bigger_expense = db.query(TransactionsDB).filter(
        TransactionsDB.user_id == user_id,
        TransactionsDB.type == "expense",
        extract("month", TransactionsDB.transaction_date) == month,
        extract("year", TransactionsDB.transaction_date) == year
    ).order_by(desc(TransactionsDB.value)).first()

    if not bigger_expense or None:
        raise HTTPException(status_code=404, detail="Nao ha gasto neste mes")


    return bigger_expense

def average_expense(db: Session, user_id: int, year: int, month: int):
    average = db.query(func.avg(TransactionsDB.value)).filter(
        TransactionsDB.type == 'expense',
        TransactionsDB.user_id == user_id,
        extract("month", TransactionsDB.transaction_date) == month,
        extract("year", TransactionsDB.transaction_date) == year
     ).scalar()
    
    if not average or None:
        raise HTTPException(status_code=404, detail="Nao ha gasto neste mes")

    
    return {"mes" : month, "ano": year, "media" : round(average)}