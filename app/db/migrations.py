"""Aplicacao de migrations no boot da app.

Existe porque o Render (plano free) nao oferece Shell nem Pre-Deploy Command,
entao `alembic upgrade head` precisa rodar junto com o start da aplicacao.

Seguranca:
- Desligado por padrao (`RUN_MIGRATIONS=false`); nada roda em dev/testes.
- Falhas sao registradas e propagadas apenas quando `strict=True`.
- Idempotente: o Alembic so aplica revisoes que ainda faltam.
"""

from __future__ import annotations

import logging
from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from sqlalchemy import engine_from_config, pool

from alembic import command
from app.core.config import settings

logger = logging.getLogger("ledger.migrations")

_REPO_ROOT = Path(__file__).resolve().parents[2]
_ALEMBIC_INI = _REPO_ROOT / "alembic.ini"


def _alembic_config() -> Config:
    """Monta o Config do Alembic apontando para o .ini do repo e o banco atual."""
    cfg = Config(str(_ALEMBIC_INI))
    cfg.set_main_option("script_location", str(_REPO_ROOT / "alembic"))
    # URL vem do settings (.env / env vars do Render), nunca do .ini.
    cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    return cfg


def current_revision() -> str | None:
    """Revisao aplicada no banco (None se nunca migrado)."""
    cfg = _alembic_config()
    engine = engine_from_config(
        cfg.get_section(cfg.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    try:
        with engine.connect() as conn:
            return MigrationContext.configure(conn).get_current_revision()
    finally:
        engine.dispose()


def run_migrations(*, strict: bool = False) -> bool:
    """Aplica `upgrade head`. Retorna True se concluiu sem erro.

    Com `strict=False` (padrao no lifespan) um erro de migration nao derruba a
    app, apenas registra um log de erro - evita que um problema pontual de
    schema torne o servico indisponivel. Use `strict=True` em scripts/CI.
    """
    if not settings.RUN_MIGRATIONS:
        logger.debug("migrations_skipped: RUN_MIGRATIONS=false")
        return True

    if not _ALEMBIC_INI.exists():  # pragma: no cover - guarda de deploy
        logger.error("migrations_failed: alembic.ini nao encontrado em %s", _ALEMBIC_INI)
        if strict:
            raise FileNotFoundError(_ALEMBIC_INI)
        return False

    try:
        before = current_revision()
        command.upgrade(_alembic_config(), "head")
        after = current_revision()
        if before == after:
            logger.info("migrations_up_to_date", extra={"revision": after})
        else:
            logger.info(
                "migrations_applied",
                extra={"from": before, "to": after},
            )
        return True
    except Exception as exc:
        logger.error("migrations_failed: %s", exc, exc_info=True)
        if strict:
            raise
        return False
