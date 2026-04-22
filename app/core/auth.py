from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.db.session import get_db
from app.core.security import create_token
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.db.models.user import UserDB
from app.core.config import settings

oauth2_schema =  OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
        token: str = Depends(oauth2_schema),
        db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, settings.ALGORITHM)
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalido")
        
    except JWTError:
        raise HTTPException(status_code=401)
    

    user = db.query(UserDB).filter(UserDB.id == int(user_id)).first()

    return user