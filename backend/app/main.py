from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import generator

app = FastAPI(
    title="CRUD API Generator",
    description="Сервис для автоматической генерации CRUD REST API на FastAPI.",
    version="0.1.0",
)


origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],    
)


app.include_router(generator.router, prefix="/api/v1", tags=["Generator"])


@app.get("/")
def read_root():
    """
    Корневой эндпоинт. Возвращает приветственное сообщение.
    """
    return {"message": "CRUD API Generator Backend is running!"}