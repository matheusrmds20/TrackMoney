from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.db.models.user import UserDB
from app.modules.reports.service import ReportService



router_reports = APIRouter(prefix="/report", tags=["report"])


@router_reports.get("/balance")
def list_balance(
    month: int,
    year: int,
    service: ReportService = Depends(),
    user: UserDB =  Depends(get_current_user)
):

    return service.balance(user.id, year, month)



@router_reports.get("/by_category")
def list_category(
    month: int,
    year: int,
    service: ReportService = Depends(),
    user: UserDB = Depends(get_current_user)
):

    return service.by_category(user.id, year, month)


@router_reports.get("/monthly_report")
def list_monthly(
    month: int,
    year: int,
    service: ReportService = Depends(),
    user: UserDB = Depends(get_current_user)
):
    

    return service.monthly_report(user.id, year, month)


@router_reports.get("/top")
def list_top_expense(
    month: int,
    year: int,
    service: ReportService = Depends(),
    user: UserDB = Depends(get_current_user)
):
    

    return service.top_expense(user.id, year, month)

@router_reports.get("/average")
def list_average(
    month: int,
    year: int,
    service: ReportService = Depends(),
    user: UserDB = Depends(get_current_user)
):

    return service.average_expense(user.id, year, month)
