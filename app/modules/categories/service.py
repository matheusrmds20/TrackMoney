from app.modules.categories.schema import CategoryCreate, CategoryUpdate
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.models.categories import CategoryDB
from fastapi import HTTPException
from sqlalchemy import func
from fastapi import Depends
from app.db.session import get_db
from app.repository.category_repository import CategoryRepository

class CategoryService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.repository = CategoryRepository(db)

    def create_category(self, data: CategoryCreate, user_id: int):
        category_ja_existente = self.repository.category_exist(data.name, user_id)
        
        if category_ja_existente:
            raise HTTPException(status_code=400, detail="Categoria ja existente")
        
        if not data.name or data.name.strip() == "":
            raise HTTPException(status_code=400, detail="O name nao pode estar vazio")
        
        category = self.repository.create(user_id, data)


        return category


    def list_all_category(self, user_id: int):

        listar = self.repository.list_all_category(user_id)

        return listar


    def update_category(self, user_id: int, category_id: int, data: CategoryUpdate):
        category = self.repository.category_id(user_id, category_id)

        if not category:
            raise HTTPException(status_code=404, detail="Category nao encontrada")
        
        if category.user_id != user_id:
            raise HTTPException(status_code=403, detail="id da Category incorreta")
        

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(category, field, value)

        updated_category = self.repository.update(category)

        return updated_category


    def delete_category(self, user_id: int, category_id: int):
        category = self.repository.category_id(user_id, category_id)

        if not category:
            raise HTTPException(status_code=404, detail="Category nao encontrada")
        
        if category.user_id != user_id:
            raise HTTPException(status_code=403, detail="id da Category incorreta")
        
        delete = self.repository.delete(user_id, category_id)

        return delete