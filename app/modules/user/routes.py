from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.cookies import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    clear_auth_cookies,
    set_access_cookie,
    set_csrf_cookie,
    set_refresh_cookie,
)
from app.core.rate_limit import limiter, login_key
from app.core.security import create_csrf_token
from app.core.token_store import (
    decode_token,
    revoke_access_token,
    revoke_all_user_tokens,
    revoke_refresh_token,
)
from app.db.models.user import UserDB
from app.db.session import get_db
from app.modules.user.schemas import CreateUser, UserResponse
from app.modules.user.service import UserService

router_user = APIRouter(prefix="/auth", tags=["auth"])


@router_user.post("/register", response_model=UserResponse)
@limiter.limit("3/minute;20/hour")
def register_user(
    request: Request,
    user_data: CreateUser,
    service: UserService = Depends(),
):
    return service._create(user_data)


@router_user.post("/login")
@limiter.limit("5/minute;20/hour", key_func=login_key)
def authenticate(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: UserService = Depends(),
):
    result = service._login(form_data)
    set_access_cookie(response, result["access_token"])
    set_refresh_cookie(response, result["refresh_token"])
    set_csrf_cookie(response, result["csrf_token"])
    return {"token_type": "cookie", "csrf_token": result["csrf_token"]}


@router_user.post("/refresh")
@limiter.limit("20/hour")
def refresh_session(request: Request, response: Response, service: UserService = Depends()):
    result = service._refresh(request.cookies.get(REFRESH_COOKIE))
    if result is None:
        clear_auth_cookies(response)
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Nao autenticado")
    set_access_cookie(response, result["access_token"])
    set_refresh_cookie(response, result["refresh_token"])
    set_csrf_cookie(response, result["csrf_token"])
    return {"token_type": "cookie"}


@router_user.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    # O CSRFMiddleware ja exige X-CSRF-Token == cookie assinado antes de chegar aqui.
    # Aqui o cookie de REFRESH pode nao vir (Path=/auth/refresh): o JWT dele e
    # revogado, mas por garantia revogamos toda a familia de refresh do usuario.
    access_payload = decode_token(request.cookies.get(ACCESS_COOKIE, ""), "access")
    if access_payload:
        revoke_access_token(db, access_payload)
        revoke_all_user_tokens(db, int(access_payload["sub"]))

    refresh_payload = decode_token(request.cookies.get(REFRESH_COOKIE, ""), "refresh")
    if refresh_payload:
        revoke_refresh_token(db, refresh_payload)

    clear_auth_cookies(response)
    return {"status": "ok"}


@router_user.get("/me", response_model=UserResponse)
@limiter.limit("60/minute")
def me(request: Request, user: UserDB = Depends(get_current_user)):
    return user


@router_user.get("/csrf")
def refresh_csrf(response: Response, user: UserDB = Depends(get_current_user)):
    token = create_csrf_token()
    set_csrf_cookie(response, token)
    return {"csrf_token": token}


@router_user.delete("/me", status_code=204)
def delete_me(
    response: Response,
    request: Request,
    service: UserService = Depends(),
    user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exclui a PROPRIA conta. O alvo vem da sessao, nunca de um parametro (anti-IDOR)."""
    access_payload = decode_token(request.cookies.get(ACCESS_COOKIE, ""), "access")
    if access_payload:
        revoke_access_token(db, access_payload)
    service._delete(user.id)
    clear_auth_cookies(response)
    response.status_code = 204
    return response


@router_user.delete("/delete_user", deprecated=True)
def delete_user_URL(
    user_id: int,
    service: UserService = Depends(),
    user: UserDB = Depends(get_current_user),
):
    """Compatibilidade com o frontend legado (`frontend/`).

    So permite excluir a propria conta: qualquer outro user_id e negado.
    Remover quando `frontend/` for descontinuado — usar DELETE /auth/me.
    """
    if user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Nao autorizado")
    return service._delete(user.id)
