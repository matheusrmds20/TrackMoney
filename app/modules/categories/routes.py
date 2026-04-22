from fastapi import APIRouter, Depends
from app.modules.categories.service import create_category, list_all_category, delete_category, update_category
from app.modules.categories.schema import CategoryCreate, CategoryResponse, CategoryUpdate
from app.core.auth import get_current_user
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import UserDB
from app.db.models.categories import CategoryDB


router_category = APIRouter(prefix="/category", tags=["category"])



@router_category.post("/", response_model=CategoryResponse)
def create_category_route(
    data: CategoryCreate,
    db: Session = Depends(get_db), 
    user: UserDB = Depends(get_current_user)
    
):

    return create_category(db, data, user.id)


@router_category.get("/", response_model=list[CategoryResponse])
def list_category_route(
        db: Session = Depends(get_db),
        user: UserDB = Depends(get_current_user)
):

    return list_all_category(db, user.id)

@router_category.patch("/update/{category_id}")
def update_category_route(
    data: CategoryUpdate,    
    category_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)

):
    
    return update_category(db, user.id, category_id, data)


@router_category.delete("/delete/{category_id}")
def delete_category_route(
    category_id: int,
    db: Session = Depends(get_db),
    user: UserDB = Depends(get_current_user)
):
    
    return delete_category(db, user.id, category_id)