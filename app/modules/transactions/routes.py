from fastapi import APIRouter
from app.modules.transactions.schemas import TransactionCreate, TransactionResponse, TransactionUpdate
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import UserDB
from app.core.auth import get_current_user
from fastapi import Depends
from datetime import datetime
from app.modules.transactions.service import create_transaction, list_transaction, list_transaction_id, update_transaction, delete_transaction



router_transaction = APIRouter(prefix="/transactions", tags=["transactions"])


@router_transaction.post("/", response_model=TransactionResponse)
def create_tranaction_route(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)    
):

    transaction = create_transaction(db, user.id, data)

    return transaction

@router_transaction.get("/list")
def list_transaction_route(
    limit: int = 5,
    page: int = 1,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user),
    type: str | None = None,
    category_id: int | None = None,
):
    
    print("TYPE:", type)
    print("CATEGORY:", category_id)
    
    return list_transaction(db, user.id, limit, page, type, category_id)

@router_transaction.get("list/{transaction_id}")
def list_transaction_id_route(
    transaction_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)
):
    
    
    return list_transaction_id(db, user.id, transaction_id)

@router_transaction.patch("/update/{transaction_id}", response_model=TransactionResponse)
def update_transaction_route(
    data: TransactionUpdate,
    transaction_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)
):
    
    return update_transaction(db, user.id, transaction_id, data)

@router_transaction.delete("/delete/{transaction_id}")
def delete_transaction_route(
    transaction_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)
):

    return delete_transaction(db, user.id, transaction_id)