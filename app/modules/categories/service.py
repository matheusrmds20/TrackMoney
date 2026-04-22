from app.modules.categories.schema import CategoryCreate, CategoryUpdate
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.models.categories import CategoryDB
from fastapi import HTTPException
from sqlalchemy import func



def create_category(db: Session, data: CategoryCreate, user_id: int):
    category_ja_existente = db.query(CategoryDB).filter(
        func.lower(CategoryDB.name) == func.lower(data.name)
).first()
    
    if category_ja_existente:
        raise HTTPException(status_code=400, detail="Categoria ja existente")
    
    if not data.name or data.name.strip() == "":
        raise HTTPException(status_code=400, detail="O name nao pode estar vazio")


    category = CategoryDB(
        name=data.name,
        type=data.type,
        user_id=user_id
    )


    try:
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Algo deu errado tente novamente")

def list_all_category(db: Session, user_id: int):

    listar = db.query(CategoryDB).filter(CategoryDB.user_id == user_id).all()

    return listar


def update_category(db: Session, user_id: int, category_id: int, data: CategoryUpdate):
    category = db.query(CategoryDB).filter(
        CategoryDB.id == category_id
).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category nao encontrada")
    
    if category.user_id != user_id:
        raise HTTPException(status_code=403, detail="id da Category incorreta")
    
    try:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(category, field, value)

        db.commit()
        db.refresh(category)
        return category
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Falha ao tentar atualizar category")


def delete_category(db: Session, user_id: int, category_id: int):
    category = db.query(CategoryDB).filter(
        CategoryDB.id == category_id,
        CategoryDB.user_id == user_id
).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category nao encontrada")
    
    if category.user_id != user_id:
        raise HTTPException(status_code=403, detail="id da Category incorreta")
    

    db.delete(category)
    db.commit()