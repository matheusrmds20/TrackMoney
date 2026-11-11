import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session as OrmSession

from app.core.config import settings
from app.core.exceptions.base import ItemNaoEncontrado
from app.core.logging import configure_logging
from app.core.middlewares import register_middlewares
from app.core.rate_limit import limiter
from app.core.token_store import purge_expired_tokens
from app.db.migrations import run_migrations
from app.db.session import Session, get_db
from app.modules.categories.routes import router_category
from app.modules.reports.routes import router_reports
from app.modules.transactions.routes import router_transaction
from app.modules.user.routes import router_user

configure_logging()
logger = logging.getLogger("ledger.app")

def purge_expired_auth_state() -> None:
    """Retencao: remove tokens expirados/revogados a cada boot (ver SECURITY.md §8)."""
    db = Session()
    try:
        removed = purge_expired_tokens(db)
        logger.info("token_retention_purge", extra=removed)
    except Exception as exc:  # nao impede o boot por causa de limpeza
        logger.warning("token_retention_purge_failed: %s", exc)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Migrations antes de qualquer query: em PaaS sem shell (Render free) e o
    # unico ponto de execucao. Controlado por RUN_MIGRATIONS.
    run_migrations()
    purge_expired_auth_state()
    yield

fastapi_app = app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None,
    openapi_url="/openapi.json" if settings.ENABLE_DOCS else None,
    lifespan=lifespan,
)

register_middlewares(fastapi_app)

fastapi_app.include_router(router_user)
fastapi_app.include_router(router_category)
fastapi_app.include_router(router_transaction)
fastapi_app.include_router(router_reports)


@fastapi_app.get("/")
def root():
    return {"status": "ok"}


@fastapi_app.get("/health")
@limiter.exempt
def health(db: OrmSession = Depends(get_db)):
    db.execute(text("SELECT 1")).scalar()
    return {"status": "ok"}


@fastapi_app.exception_handler(ValueError)
def badrequest(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )


@fastapi_app.exception_handler(ItemNaoEncontrado)
def notfound(request: Request, exc: ItemNaoEncontrado):
    return JSONResponse(
        status_code=404,
        content={"detail": str(exc)},
    )
