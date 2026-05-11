from fastapi import APIRouter, Depends, HTTPException
from app.modules.categories.service import CategoryService
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
    service: CategoryService = Depends(), 
    user: UserDB = Depends(get_current_user)
    
):
    
    try:
        return service.create_category(data, user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as m:
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor {str(m)}")

@router_category.get("/", response_model=list[CategoryResponse])
def list_category_route(
        service: CategoryService = Depends(),
        user: UserDB = Depends(get_current_user)
):
    try:
        return service.list_all_category(user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as m:
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor {str(m)}")


@router_category.patch("/update/{category_id}")
def update_category_route(
    data: CategoryUpdate,    
    category_id: int,
    service: CategoryService = Depends(),
    user: UserDB = Depends(get_current_user)

):
    try:
        return service.update_category(user.id, category_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as m:
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor {str(m)}")

@router_category.delete("/delete/{category_id}")
def delete_category_route(
    category_id: int,
    service: CategoryService = Depends(),
    user: UserDB = Depends(get_current_user)
):

    try:   
        return service.delete_category(user.id, category_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as m:
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor {str(m)}")