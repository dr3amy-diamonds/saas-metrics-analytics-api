"""
seed_db.py — Generador de datos realistas para SaaS Analytics Platform
Senior Data Engineer pattern: cada bloque de datos cuenta una historia de negocio.
"""

import uuid
import random
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta

import psycopg3
from faker import Faker

# ── Configuración de conexión ─────────────────────────────────────────────────
DB_CONFIG = {
    "host":     "localhost",
    "port":     5432,
    "dbname":   "your_database",
    "user":     "your_user",
    "password": "your_password",
}

fake = Faker("en_US")   # Locale explícito → sin tildes ni ñ que rompan UTF-8
NOW  = datetime.now(tz=timezone.utc)

# ── 1. DISTRIBUCIÓN DE FECHAS DE REGISTRO ────────────────────────────────────
# Usamos random.expovariate para sesgar las fechas hacia el presente:
# un λ alto produce la mayoría de valores cerca de 0 (= hoy),
# mientras que los outliers llegan hasta 180 días atrás.
# Resultado: curva de crecimiento exponencial invertida → pocos al inicio,
# muchos en los últimos 2 meses.
def generate_registration_date() -> datetime:
    WINDOW_DAYS = 180                        # 6 meses de historia
    LAMBDA      = 0.018                      # controla la "aceleración" del crecimiento
    days_ago    = min(WINDOW_DAYS, int(random.expovariate(LAMBDA)))
    jitter_secs = random.randint(0, 86_400)  # hora aleatoria dentro del día
    return NOW - timedelta(days=days_ago, seconds=jitter_secs)


# ── 2. DISTRIBUCIÓN DE PLANES (Pareto 70/20/10) ──────────────────────────────
PLANS = [
    {"name": "Basic",      "price": 29.00},
    {"name": "Pro",        "price": 99.00},
    {"name": "Enterprise", "price": 499.00},
]
PLAN_WEIGHTS = [0.70, 0.20, 0.10]   # Pareto: la masa se concentra en el tier base

def pick_plan() -> dict:
    return random.choices(PLANS, weights=PLAN_WEIGHTS, k=1)[0]


# ── 3. LÓGICA DE CHURN (15 %) ────────────────────────────────────────────────
CHURN_RATE = 0.15

def build_subscription(user_id: uuid.UUID, reg_date: datetime) -> dict:
    plan   = pick_plan()
    sub_id = uuid.uuid4()

    # La suscripción empieza el mismo día del registro (flujo de onboarding)
    started_at  = reg_date
    is_canceled = random.random() < CHURN_RATE

    canceled_at = None
    status      = "active"

    if is_canceled:
        status = "canceled"
        # Churn lógico: al menos 15 días después de started_at, antes de hoy
        min_cancel = started_at + timedelta(days=15)
        if min_cancel < NOW:
            delta_seconds = int((NOW - min_cancel).total_seconds())
            canceled_at   = min_cancel + timedelta(seconds=random.randint(0, delta_seconds))

    return {
        "id":            sub_id,
        "user_id":       user_id,
        "plan_name":     plan["name"],
        "price":         plan["price"],
        "status":        status,
        "started_at":    started_at,
        "canceled_at":   canceled_at,
    }


# ── 4 & 5. GENERACIÓN DE PAGOS (uno por mes activo + 3 % de fallos) ──────────
FAILED_RATE = 0.03

def build_payments(sub: dict) -> list[dict]:
    payments   = []
    start      = sub["started_at"]
    # El ciclo de pagos termina cuando se cancela o en el mes actual
    end        = sub["canceled_at"] if sub["canceled_at"] else NOW

    billing_date = start
    while billing_date <= end:
        # 3 % de probabilidad de pago fallido → pérdida de ingreso analizable
        status = "failed" if random.random() < FAILED_RATE else "success"

        payments.append({
            "id":              uuid.uuid4(),
            "subscription_id": sub["id"],
            "amount":          sub["price"],
            "status":          status,
            "processed_at":    billing_date,
        })
        billing_date = billing_date + relativedelta(months=1)

    return payments


# ── INSERCIÓN EN BASE DE DATOS ───────────────────────────────────────────────
INSERT_USER = """
    INSERT INTO core.users (id, email, full_name, registration_date)
    VALUES (%s, %s, %s, %s)
"""

INSERT_SUB = """
    INSERT INTO core.subscriptions
        (id, user_id, plan_name, status, monthly_price, started_at, canceled_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
"""

INSERT_PAY = """
    INSERT INTO core.payments (id, subscription_id, amount, status, processed_at)
    VALUES (%s, %s, %s, %s, %s)
"""

def run_seed(n_users: int = 50) -> None:
    conn   = None
    cursor = None
    try:
        conn   = psycopg2.connect(**DB_CONFIG)
        conn.set_client_encoding("UTF8")   # Negocia UTF-8 explícitamente con el servidor
        cursor = conn.cursor()

        total_payments = 0
        canceled_count = 0

        for i in range(n_users):
            # ── Usuario ──────────────────────────────────────────────────────
            user_id   = uuid.uuid4()
            reg_date  = generate_registration_date()
            email     = fake.unique.email()
            full_name = fake.name()

            cursor.execute(INSERT_USER, (user_id, email, full_name, reg_date))

            # ── Suscripción ──────────────────────────────────────────────────
            sub = build_subscription(user_id, reg_date)
            cursor.execute(INSERT_SUB, (
                sub["id"],
                sub["user_id"],
                sub["plan_name"],
                sub["status"],
                sub["price"],
                sub["started_at"],
                sub["canceled_at"],
            ))

            if sub["status"] == "canceled":
                canceled_count += 1

            # ── Pagos ────────────────────────────────────────────────────────
            payments = build_payments(sub)
            for pay in payments:
                cursor.execute(INSERT_PAY, (
                    pay["id"],
                    pay["subscription_id"],
                    pay["amount"],
                    pay["status"],
                    pay["processed_at"],
                ))
            total_payments += len(payments)

            print(f"  [{i+1:>3}/{n_users}] user={email[:30]:<30} "
                  f"plan={sub['plan_name']:<10} "
                  f"status={sub['status']:<8} "
                  f"payments={len(payments)}")

        conn.commit()
        print("\n✅ Seed completado:")
        print(f"   • Usuarios:       {n_users}")
        print(f"   • Cancelaciones:  {canceled_count}  ({canceled_count/n_users:.0%} churn)")
        print(f"   • Pagos totales:  {total_payments}")

    except psycopg2.Error as e:
        print(f"\n❌ Error de base de datos: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("   Conexión cerrada.")


if __name__ == "__main__":
    run_seed(n_users=50)