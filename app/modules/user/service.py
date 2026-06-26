from app.modules.user. schemas import CreateUser
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_token
from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.repository.user_repository import UserRepository
from app.db.session import get_db


class UserService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.repository = UserRepository(db)

    def _create(self, data: CreateUser):
        
        exist = self.repository.get_email(data.email)

        if exist:
            raise ValueError("Usuario ja existente")
        
        user = self.repository.create(data)

        return user

    def _login(self, form_data: OAuth2PasswordRequestForm):

        user = self.repository.get_email(form_data.username)

        if not user:
            raise ValueError("Usuario nao encontrado")

        if not verify_password(form_data.password, user.hashed_password):
            return None

        token = create_token({"sub": str(user.id)})
        return {"access_token" : token, "token_type" : "bearer"}


    def _delete(self, user_id: int):
        user_exist = self.repository.get_user_id(user_id)

        if not user_exist:
            raise ValueError("Usuario nao encontrado")
        
        user = self.repository.delete(user_id)

        return user