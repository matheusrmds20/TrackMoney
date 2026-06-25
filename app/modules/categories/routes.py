from fastapi import APIRouter, Depends, HTTPException
from app.modules.categories.service import CategoryService
from app.modules.categories.schema import CategoryCreate, CategoryResponse, CategoryUpdate
from app.core.auth import get_current_user
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import UserDB
from app.db.models.categories import CategoryDB


router_category = APIRouter(prefix="/category", tags=["category"])



@router_category.post("/create", response_model=CategoryResponse)
def create_category_route(
    data: CategoryCreate,
    service: CategoryService = Depends(), 
    user: UserDB = Depends(get_current_user)
    
):
    return service.create_category(data, user.id)


@router_category.get("/list", response_model=list[CategoryResponse])
def list_category_route(
        service: CategoryService = Depends(),
        user: UserDB = Depends(get_current_user)
):
     return service.list_all_category(user.id)



@router_category.patch("/update/{category_id}")
def update_category_route(
    data: CategoryUpdate,    
    category_id: int,
    service: CategoryService = Depends(),
    user: UserDB = Depends(get_current_user)

):
    return service.update_category(user.id, category_id, data)


@router_category.delete("/delete/{category_id}")
def delete_category_route(
    category_id: int,
    service: CategoryService = Depends(),
    user: UserDB = Depends(get_current_user)
):

    return service.delete_category(user.id, category_id)
