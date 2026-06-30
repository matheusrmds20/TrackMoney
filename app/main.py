from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.db.session import Base, engine
from app.modules.user.routes import router_user
from app.modules.categories.routes import router_category
from app.modules.transactions.routes import router_transaction
from app.modules.reports.routes import router_reports
from app.core.exceptions.base import ItemNaoEncontrado
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)


app = FastAPI()

origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://trackmoney.fly.dev",
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

@app.options("/{path:path}")
async def handle_options(path: str):
    return {"status": "ok"}

@app.get("/")
def root():
    return {"status":"ok"}

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


