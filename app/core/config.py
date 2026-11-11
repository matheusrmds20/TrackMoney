from pydantic import ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

# Chave efemera: permite importar a app sem .env (testes, CI, build docker).
# Em ENV=production a validacao abaixo aborta o processo, entao nunca roda
# em producao com essa chave.
_DEFAULT_DEV_SECRET = "dev-only-insecure-secret-change-me"  # noqa: S105 (placeholder, nao e segredo real)
_DEFAULT_DEV_DB = "postgresql+psycopg2://postgres:postgres@localhost:5432/financeiro"


class Settings(BaseSettings):
    APP_NAME: str = "Finance app"
    DEBUG: bool = False
    ENV: str = "development"
    FORCE_HTTPS: bool = False

    SECRET_KEY: str = _DEFAULT_DEV_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    DATABASE_URL: str = _DEFAULT_DEV_DB

    FRONTEND_ORIGINS: str = "http://localhost:5173,https://ledger.matheuslab.xyz"
    ALLOWED_HOSTS: str = (
        "localhost,127.0.0.1,testserver,trackmoney-jjnl.onrender.com,api.matheuslab.xyz,https://api.ledger.matheuslab.xyz"
    )

    COOKIE_DOMAIN: str | None = None
    COOKIE_SECURE: bool = False   # o .env de producao sobrescreve para true
    COOKIE_SAMESITE: str = "lax"
    COOKIE_PATH: str = "/"

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_STORAGE_URI: str = "memory://"

    ENABLE_DOCS: bool = True
    LOG_LEVEL: str = "INFO"
    ALLOW_INSECURE_CONFIG: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def frontend_origins(self) -> list[str]:
        return [o.strip() for o in self.FRONTEND_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_hosts(self) -> list[str]:
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]

    def validate_production_requirements(self) -> None:
        if self.ENV != "production" or self.ALLOW_INSECURE_CONFIG:
            return

        problems: list[str] = []
        if self.SECRET_KEY in (_DEFAULT_DEV_SECRET, "") or len(self.SECRET_KEY) < 32:
            problems.append("SECRET_KEY ausente ou fraca (use >= 32 chars aleatorios)")
        if self.DATABASE_URL == _DEFAULT_DEV_DB:
            problems.append("DATABASE_URL ainda no default de desenvolvimento")
        if not self.COOKIE_SECURE:
            problems.append("COOKIE_SECURE precisa ser true em producao")
        if self.COOKIE_SAMESITE == "none" and not self.COOKIE_SECURE:
            problems.append("SameSite=None exige Secure")
        if problems:
            raise ValueError("Configuracao insegura: " + "; ".join(problems))


try:
    settings = Settings()
except ValidationError as exc:  # pragma: no cover - mensagem amigavel
    raise SystemExit(f"Falha ao carregar configuracao (.env): {exc}") from exc

settings.validate_production_requirements()
