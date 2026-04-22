from pydantic import BaseModel, ConfigDict

class BalanceResponse(BaseModel):
    income: float
    expense: float
    balance: float

    model_config = ConfigDict(from_attributes=True)

class CategoryExpense(BaseModel):
    category: str
    total: float
    
