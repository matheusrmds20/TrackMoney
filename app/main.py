from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from app.db.session import Base, engine, get_db
from app.modules.user.routes import router_user
from app.modules.categories.routes import router_category
from app.modules.transactions.routes import router_transaction
from app.modules.reports.routes import router_reports
from app.core.exceptions.base import ItemNaoEncontrado
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session



Base.metadata.create_all(bind=engine)


app = FastAPI()

@app.options("/{path:path}")
async def handle_options(path: str):
    return {"status": "ok"}


origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://track-money-blue.vercel.app",
    "https://track-money-blue.vercel.app/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_user)
app.include_router(router_category)
app.include_router(router_transaction)
app.include_router(router_reports)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def root(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1")).scalar()
    return {"status": "ok"}

@app.exception_handler(ValueError)
def badrequest(request: Request, exc: ValueError):
    
    return JSONResponse(
        status_code = 400,
        content ={"detail":str(exc)}
    )

@app.exception_handler(ItemNaoEncontrado)
def notfound(request: Request, exc: ItemNaoEncontrado):
    
    return JSONResponse(
        status_code = 404,
        content ={"detail":str(exc)}
    )


