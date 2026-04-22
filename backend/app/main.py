from . import models
from . import schemas
from fastapi import FastAPI, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from .database import engine, get_db
from decimal import Decimal

models.Base.metadata.create_all(bind=engine)

#Crear la variable App
app = FastAPI(title="Dashboard de Métricas SaaS", version="1.0.0")

#Definir función sencilla
@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de Analítica"}

# --- FUNCIÓN AUXILIAR: Calcular Market Share (Opción A - Python Nativo) ---
def calculate_market_share(results: list) -> list[schemas.MetricsWithMarketShare]:
    """
    Calcula el Market Share (%) para cada plan.
    
    Ventajas de Opción A (Python Nativo):
    - Latencia minimal (<1ms para <10 filas)
    - Sin overhead de librerías externas
    - Compatible nativo con Pydantic v2
    - Fácil debugging y mantención
    
    Nota: Para >100k filas, considera Pandas. Aquí no se justifica.
    """
    if not results:
        return []
    
    # Calcular total una sola vez (O(n) donde n < 10)
    total_revenue = sum(Decimal(row.plan_total_revenue) for row in results)
    
    # Iterar una sola vez para calcular market share
    metrics_list = []
    for row in results:
        market_share_pct = (
            (Decimal(row.plan_total_revenue) / total_revenue * 100)
            .quantize(Decimal('0.01'))  # Redondear a 2 decimales
        )
        
        metrics_list.append(
            schemas.MetricsWithMarketShare(
                plan_name=row.plan_name,
                plan_total_revenue=row.plan_total_revenue,
                total_subscribers=row.total_subscribers,
                market_share=str(market_share_pct)  # "35.50%"
            )
        )
    
    return metrics_list

# Ruta de las métricas - OPCIÓN A RECOMENDADA
# En main.py - Ajuste de la consulta
@app.get("/metrics", response_model=list[schemas.MetricsWithMarketShare])
def get_metrics(db: Session = Depends(get_db)):
    # Usamos la clase Subscription (mayúscula) definida en models.py
    results = db.query(
        models.Subscription.plan_name,
        func.sum(models.Subscription.monthly_price).label("plan_total_revenue"),
        func.count(models.Subscription.id).label("total_subscribers")
    ).group_by(
        models.Subscription.plan_name
    ).all()

    return calculate_market_share(results)
    ## 2. Cálculo de Market Share en Python (Opción A)
    return calculate_market_share(results)


