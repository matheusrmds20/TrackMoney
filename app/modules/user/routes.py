from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.modules.user.service import create_user, login_user, delete_user
from app.modules.user.schemas import UserResponse, CreateUser
from app.db.session import get_db
from app.core.auth import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from app.db.models.user import UserDB

router_user = APIRouter(prefix="/auth", tags=["auth"])


@router_user.post("/register", response_model=UserResponse)
def register_user(user_data: CreateUser, db: Session = Depends(get_db)):
    try:
        return create_user(db, user_data)
    except:
        raise HTTPException(status_code=400, detail="Algo deu errado")

    
@router_user.post("/login")
def authenticate(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    return login_user(db, form_data)


@router_user.delete("/delete_user")
def delete_user_URL(db: Session = Depends(get_db), user: UserDB = Depends(get_current_user)):

    return delete_user(db, user.id)
