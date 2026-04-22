from fastapi import FastAPI
from app.db.session import Base, engine
from app.modules.user.routes import router_user
from app.modules.categories.routes import router_category
from app.modules.transactions.routes import router_transaction
from app.modules.reports.routes import router_reports

Base.metadata.create_all(bind=engine)



app = FastAPI()


app.include_router(router_user)
app.include_router(router_category)
app.include_router(router_transaction)
app.include_router(router_reports)


@app.get("/")
def root():
    return {"status":"ok"}