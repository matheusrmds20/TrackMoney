from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Finance app"
    DEBUG: bool = True

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    model_config=SettingsConfigDict(env_file=".env")

    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/financeiro"

settings = Settings()