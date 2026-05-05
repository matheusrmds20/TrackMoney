from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.auth import get_current_user
from app.db.session import get_db
from app.db.models.user import UserDB
from app.modules.reports.service import balance, by_category, monthly_report, top_expense, average_expense



router_reports = APIRouter(prefix="/report", tags=["report"])


@router_reports.get("/balance")
def list_balance(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user: UserDB =  Depends(get_current_user)
):
    
    try:
        return balance(db, user.id, year, month)
    except HTTPException as m:
        raise m
    except Exception as e:
        print(f"Erro indesperado:{str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor")

@router_reports.get("/by_category")
def list_category(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)
):
    
    return by_category(db, user.id, year, month)

@router_reports.get("/monthly_report")
def list_monthly(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)
):
    
    return monthly_report(db, user.id, year, month)

@router_reports.get("/top")
def list_top_expense(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)
):
    
    return top_expense(db, user.id, year, month)

@router_reports.get("/average")
def list_average(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)
):
    return average_expense(db, user.id, year, month)