from app.modules.user. schemas import CreateUser, LoginUser
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models.user import UserDB
from app.core.security import hash_password, verify_password, create_token
from app.modules.user.schemas import CreateUser, LoginUser
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.repository.user_repository import create_user_repo, delete_user_repo


 
def create_user(db: Session, data: CreateUser):
    
    
    exist = db.query(UserDB).filter(func.lower(UserDB.email) == func.lower(data.email)).first()


    if exist:
        raise ValueError("Usuario ja existente")
    
    user = create_user_repo(db, data)

    return user

def login_user(db: Session, form_data: OAuth2PasswordRequestForm):

    user = db.query(UserDB).filter(UserDB.email == form_data.username).first()

    if not user:
        raise ValueError("Usuario nao encontrado")

    if not verify_password(form_data.password, user.hashed_password):
        return None

    token = create_token({"sub": str(user.id)})
    return {"access_token" : token, "token_type" : "bearer"}


def delete_user(db: Session, user_id: int):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()

    if not user:
        raise ValueError("Usuario nao encontrado")
    
    user = delete_user_repo(db, user_id)

    return user