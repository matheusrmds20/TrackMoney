from fastapi import APIRouter, Depends, Request

from app.core.auth import get_current_user
from app.core.rate_limit import limiter, user_key
from app.db.models.user import UserDB
from app.modules.transactions.schemas import (
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)
from app.modules.transactions.service import TransactionService

router_transaction = APIRouter(prefix="/transactions", tags=["transactions"])


@router_transaction.post("/", response_model=TransactionResponse)
@limiter.limit("30/minute", key_func=user_key)
def create_tranaction_route(
    request: Request,
    data: TransactionCreate,
    user: UserDB = Depends(get_current_user),
    service: TransactionService = Depends(),
):
    return service.create_transaction(user.id, data)


@router_transaction.get("/list")
def list_transaction_route(
    limit: int = 5,
    page: int = 1,
    service: TransactionService = Depends(),
    user: UserDB = Depends(get_current_user),
    type: str | None = None,
    category_id: int | None = None,
):
    return service.list_transaction(user.id, limit, page, type, category_id)


@router_transaction.get("/list/{transaction_id}")
def list_transaction_id_route(
    month: int,
    year: int,
    service: TransactionService = Depends(),
    user: UserDB = Depends(get_current_user),
):
    return service.list_transaction_id(user.id, month, year)


@router_transaction.get("/monthly_transactions")
def list_monthly_transactions_route(
    month: int,
    year: int,
    service: TransactionService = Depends(),
    user: UserDB = Depends(get_current_user),
):
    return service.list_monthly_transactions(user.id, month, year)


@router_transaction.patch("/update/{transaction_id}", response_model=TransactionResponse)
def update_transaction_route(
    transaction_id: int,
    data: TransactionUpdate,
    service: TransactionService = Depends(),
    user: UserDB = Depends(get_current_user),
):
    return service.update_transaction(user.id, transaction_id, data)


@router_transaction.delete("/delete/{transaction_id}")
def delete_transaction_route(
    transaction_id: int,
    service: TransactionService = Depends(),
    user: UserDB = Depends(get_current_user),
):
    return service.delete_transaction(user.id, transaction_id)
