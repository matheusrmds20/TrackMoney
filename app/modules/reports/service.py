from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from app.db.session import get_db
from app.repository.reports_repository import ReportsRepository


class ReportService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.repository = ReportsRepository(db)

    def balance(self, user_id: int, year: int, month: int):

        if year < 2000 or year > 2100:
            raise ValueError("Ano fora dos limites")
        
        if not 1 <= month <= 12:
            raise ValueError("Mes invalido")


        start = datetime(year,month, 1)
        if month == 12:
            end = datetime(year + 1 , 1, 1)

        else:
            end = datetime(year, month + 1, 1)

        transaction = self.repository.transactions(user_id, start, end)

        print("Retorno do repositório:", transaction)


        result = {"income": 0, "expense": 0}

        for t_type, total in transaction:

            type_str = str(t_type.value if hasattr(t_type, "value") else t_type)
            type_str = type_str.lower()

            if type_str in result:
                result[type_str] = float(total or 0)    

        result["balance"] = round(result["income"] - result["expense"], 2)

        return result

    def by_category(self, user_id: int, year: int, month: int):

        if year < 2000 or year > 2100:
            raise ValueError("Ano fora dos limites")
        
        if not 1 <= month <= 12:
            raise ValueError(detail="Mes invalido")
            
        start = datetime(year, month, 1)
            
        if month == 12:
            end = datetime(year + 1, 1 ,1)
        else:
            end =  datetime(year, month + 1, 1)

        category = self.repository.categorys(user_id, start, end)
        
        if not category:
            raise ValueError("Nao ha gasto neste mes")
        
        return {name: float(total) for name, total in category}

    def monthly_report(self, user_id: int, year: int, month: int):
        balance_monthly = self.balance(user_id, year, month)
        category_monthly = self.by_category(user_id, year, month)
        
        if not balance_monthly:
            raise ValueError("Nao ha gasto neste mes")

        return{
            **balance_monthly,
                "by_category": category_monthly
        }

    def top_expense(self, user_id: int, year: int, month: int):
        bigger_expense = self.repository.top_expense(user_id, month, year)

        if not bigger_expense or None:
            raise HTTPException(status_code=404, detail="Nao ha gasto neste mes")


        return bigger_expense

    def average_expense(self, user_id: int, year: int, month: int):
        average = self.repository.the_average(user_id, month, year)
        
        if not average or None:
            raise ValueError("Nao ha gasto neste mes")

        
        return {"mes" : month, "ano": year, "media" : round(average)}