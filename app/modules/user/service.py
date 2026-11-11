from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import (
    create_csrf_token,
    create_refresh_token,
    create_token,
    verify_password_or_dummy,
)
from app.core.security_limits import is_locked, register_failure, reset
from app.core.token_store import consume_refresh_token, decode_token, store_refresh_token
from app.db.session import get_db
from app.modules.user.schemas import CreateUser
from app.repository.user_repository import UserRepository


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

    def _login(self, form_data: OAuth2PasswordRequestForm) -> dict:
        username = form_data.username.lower() if form_data.username else ""
        if is_locked(username):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Conta temporariamente bloqueada por excesso de tentativas. "
                    "Tente novamente mais tarde."
                ),
                headers={"Retry-After": "900"},
            )

        user = self.repository.get_email(form_data.username)

        # verify_password_or_dummy sempre executa bcrypt (mesmo custo com ou sem
        # usuario) para nao vazar, por timing, se o e-mail existe.
        password_ok = verify_password_or_dummy(
            form_data.password, user.hashed_password if user else None
        )

        if not user or not password_ok:
            register_failure(username)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais invalidas",
                headers={"WWW-Authenticate": "Bearer"},
            )

        reset(username)
        return self._create_session(user.id)

    def _create_session(self, user_id: int) -> dict:
        refresh_token = create_refresh_token(user_id)
        refresh_payload = decode_token(refresh_token, "refresh")
        if refresh_payload is None:  # defensive guard; a locally issued JWT must decode
            raise RuntimeError("Nao foi possivel criar a sessao")
        store_refresh_token(self.db, refresh_payload)
        return {
            "access_token": create_token({"sub": str(user_id)}),
            "refresh_token": refresh_token,
            "csrf_token": create_csrf_token(),
        }

    def _refresh(self, raw_refresh_token: str | None) -> dict | None:
        if not raw_refresh_token:
            return None
        payload = decode_token(raw_refresh_token, "refresh")
        if payload is None or not consume_refresh_token(self.db, payload):
            return None
        if not self.repository.get_user_id(int(payload["sub"])):
            return None
        return self._create_session(int(payload["sub"]))

    def _delete(self, user_id: int):
        user_exist = self.repository.get_user_id(user_id)

        if not user_exist:
            raise ValueError("Usuario nao encontrado")
        
        user = self.repository.delete(user_id)
        return user
