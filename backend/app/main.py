from datetime import datetime, timezone
from decimal import Decimal
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from . import models
from . import schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

# Crear la variable App
app = FastAPI(title="Dashboard de Métricas SaaS", version="1.0.0")

# Configuración de CORS para React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Definir función sencilla
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


# ── 1. ENDPOINT: MÉTRICAS GLOBALES ──────────────────────────────────────────
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


# ── 2. ENDPOINT ANALÍTICO: CLIENTES EN RIESGO DE CHURN ──────────────────────
@app.get("/metrics/at-risk")
def get_at_risk_clients(db: Session = Depends(get_db)):
    """
    Identifica proactivamente clientes con suscripción activa pero con alto riesgo de abandono.
    Criterio de segmentación: No han registrado actividad en los últimos 15 días.
    """
    query = text("""
                 SELECT u.full_name,
                        u.email,
                        s.plan_name,
                        s.monthly_price,
                        MAX(l.event_date) as last_activity
                 FROM core.users u
                          JOIN core.subscriptions s ON u.id = s.user_id
                          LEFT JOIN core.user_activity_logs l ON u.id = l.user_id
                 WHERE s.status = 'active'
                 GROUP BY u.id, u.full_name, u.email, s.plan_name, s.monthly_price
                 HAVING MAX(l.event_date) < NOW() - INTERVAL '15 days'
                     OR MAX (l.event_date) IS NULL
                 ORDER BY last_activity ASC;
                 """)

    result = db.execute(query).fetchall()

    riesgo_list = []
    dinero_en_riesgo = Decimal('0.0')
    hoy = datetime.now(timezone.utc)

    for row in result:
        dinero_en_riesgo += Decimal(row.monthly_price)

        # Calcular días de inactividad de forma segura
        dias_inactivo = "Nunca ingresó"
        if row.last_activity:
            dias_inactivo = (hoy - row.last_activity).days

        riesgo_list.append({
            "cliente": row.full_name,
            "email": row.email,
            "plan": row.plan_name,
            "dias_inactivo": dias_inactivo,
            "ultima_conexion": row.last_activity.strftime("%Y-%m-%d") if row.last_activity else "N/A"
        })

    return {
        "resumen_ejecutivo": {
            "total_clientes_en_riesgo": len(riesgo_list),
            "mrr_en_riesgo_usd": float(dinero_en_riesgo)
        },
        "detalle_clientes": riesgo_list
    }