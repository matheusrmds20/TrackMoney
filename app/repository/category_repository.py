from app.db.models.categories import CategoryDB
from sqlalchemy import func 
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, data):

        category = CategoryDB(
            name=data.name,
            type=data.type,
            user_id=user_id
        )

        try:
            self.db.add(category)
            self.db.commit()
            self.db.refresh(category)
            return category

        except IntegrityError as e:
            self.db.rollback()
            raise e
    
    def category_exist(self, name: str, user_id: int):

        category = self.db.query(CategoryDB).filter(
        func.lower(CategoryDB.name) == func.lower(name),
        CategoryDB.user_id == user_id
).first()
            
        return category
    
    def list_all_category(self, user_id: int):
        category = self.db.query(CategoryDB).filter(
            CategoryDB.user_id == user_id,
            CategoryDB.is_activated  == True
).all()

        return category
    
    def category_id(self, user_id: int, category_id: int):
        category = self.db.query(CategoryDB).filter(
            CategoryDB.id == category_id,
            CategoryDB.user_id == user_id
).first()

        return category
    
    def update(self, category):
        try:
            self.db.commit()
            self.db.refresh(category)
            return category

        except IntegrityError as e:
            self.db.rollback()
            raise e
        
    def delete(self, user_id: int, category_id: int):
        category = self.category_id(user_id, category_id)

        try:
            category.is_activated = False
            self.db.commit()
        except IntegrityError as e:
            self.db.rollback()
            raise e