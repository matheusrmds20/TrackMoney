from app.modules.user. schemas import CreateUser, LoginUser
from sqlalchemy.orm import Session
from app.db.models.user import UserDB
from app.core.security import hash_password, verify_password, create_token
from app.modules.user.schemas import CreateUser, LoginUser
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm


 
def create_user(db: Session, data: CreateUser):
    exist = db.query(UserDB).filter(UserDB.email == data.email).first()

    if exist:
        raise HTTPException(status_code=400, detail="usuario ja existente")


    user = UserDB(
        email=data.email,
        hashed_password=hash_password(data.password)
    )


    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    except IntegrityError:
        db.rollback()

    return user

def login_user(db: Session, form_data: OAuth2PasswordRequestForm):

    user = db.query(UserDB).filter(UserDB.email == form_data.username).first()

    if not user:
        raise HTTPException(status_code=404, detail="usuario nao existente")

    if not verify_password(form_data.password, user.hashed_password):
        return None
    
    token = create_token({"sub": str(user.id)})
    return {"access_token" : token, "token_type" : "bearer"}


def delete_user(db: Session, user_id: int):
    user = db.query(UserDB).filter(UserDB.id == user_id)

    if not user:
        raise HTTPException(status_code=401,detail="usuario nao se coincidem")
    

    try: 
        db.delete(user)
        db.commit()
    
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Algo deu errado")