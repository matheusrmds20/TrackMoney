from jose import jwt, JWSError
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from app.core.config import settings
import bcrypt


SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES =  settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context =  CryptContext(schemes=["bcrypt"], deprecated="auto")

def  hash_password(password: str) -> str:

    pwd_bytes = password.encode("utf-8")

    salt = bcrypt.gensalt()

    hashed_password = bcrypt.hashpw(pwd_bytes, salt)

    return hashed_password.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    
    return bcrypt.checkpw(
        password.encode("utf-8"), 
        hashed_password.encode("utf-8")
)


def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})


    return jwt.encode(to_encode, settings.SECRET_KEY, settings.ALGORITHM)