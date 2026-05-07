from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.modules.user.service import UserService 
from app.modules.user.schemas import UserResponse, CreateUser
from app.db.session import get_db
from app.core.auth import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from app.db.models.user import UserDB

router_user = APIRouter(prefix="/auth", tags=["auth"])


@router_user.post("/register", response_model=UserResponse)
def register_user(user_data: CreateUser, service: UserService = Depends()):
    try:
        return service._create(user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

        raise HTTPException(status_code=500, detail="Erro interno no servidor")

@router_user.post("/login")
def authenticate(form_data: OAuth2PasswordRequestForm = Depends(), service: UserService = Depends()):

    try:
        return service._login(form_data)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router_user.delete("/delete_user")
def delete_user_URL(
    user_id: int,
    service: UserService = Depends(), 
    user: UserDB = Depends(get_current_user)):

    try:
        return service._delete(user_id)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno no servidor")