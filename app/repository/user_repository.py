from app.db.models.user import UserDB
from sqlalchemy.orm import Session
from app.core.security import hash_password
from sqlalchemy.exc import IntegrityError




class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_email(self, email: str):

        return self.db.query(UserDB).filter(UserDB.email == email).first()



    def create(self, data):
        user = UserDB(
            email = data.email,
            hashed_password = hash_password(data.password)
        )
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except IntegrityError as e:
            self.db.rollback()
            raise e


    def get_user_id(self, user_id: int):
        user = self.db.query(UserDB).filter(UserDB.id == user_id).first()

        return user
    

        
    def delete(self, user_id: int):
        user = self.db.query(UserDB).filter(UserDB.id == user_id).first()

        try:
            self.db.delete(user)
            self.db.commit()
        except ValueError as e:
            self.db.rollback()
            raise e