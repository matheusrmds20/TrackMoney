from app.db.models.user import UserDB
from sqlalchemy.orm import Session
from app.core.security import hash_password
from sqlalchemy.exc import IntegrityError



def create_user_repo(db: Session, data):
    user = UserDB(
        email = data.email,
        hashed_password = hash_password(data.password)
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

        return user
    except IntegrityError as e:
        db.rollback()
        raise e
    
def delete_user_repo(db: Session, user_id: int):
    user = db.query(UserDB).filter(UserDB.id == user_id)

    try:
        db.delete(user)
        db.commit()
    except ValueError as e:
        db.rollback()
        raise e