import models
import schemas
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

#Crear la variable App
app = FastAPI(title="Dashboard de Métricas SaaS", version="1.0.0")

#Definir función sencilla
@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de Analítica"}

# Ruta de las métricas
@app.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    return []