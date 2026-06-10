"""
seed_db.py — Generador de datos sintéticos realistas para SaaS Analytics Platform.
Cada bloque de datos modela un comportamiento de negocio específico e incluye
simulación de actividad de usuario (user_activity_logs).
"""

import os
import uuid
import random
from pathlib import Path
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta

import psycopg2
from faker import Faker

# *************************************************************************************
# CARGA DE CONFIGURACIÓN DESDE EL ARCHIVO .ENV
# *************************************************************************************

# Se resuelve la ruta absoluta al .env ubicado en la raíz del proyecto
base_path = Path(__file__).resolve().parent.parent.parent
env_path  = base_path / '.env'

if env_path.exists():
    # Se parsea el archivo línea por línea e inyectan las variables al entorno del proceso
    with open(env_path, 'r', encoding="cp1252", errors="ignore") as archivo:
        for linea in archivo:
            linea = linea.strip()
            if not linea or linea.startswith("#") or "=" not in linea:
                continue
            key, value = linea.split('=', 1)
            value = value.strip().strip('"').strip("'")
            os.environ[key] = value
else:
    raise FileNotFoundError(f"Error crítico: no se encontró el archivo .env en {env_path}")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("Error crítico: DATABASE_URL no está definida en el archivo .env.")

# Se limpia el dialecto de SQLAlchemy (+psycopg2) para que psycopg2 nativo pueda interpretarlo
CLEAN_DB_URL = DATABASE_URL.replace("+psycopg2", "")

# *************************************************************************************
# CONFIGURACIÓN GLOBAL
# *************************************************************************************

# Se establece locale explícito para evitar tildes o caracteres especiales que rompan UTF-8
fake = Faker("en_US")
NOW  = datetime.now(tz=timezone.utc)

# *************************************************************************************
# MÓDULO 1: DISTRIBUCIÓN DE FECHAS DE REGISTRO
#*************************************************************************************

def generate_registration_date() -> datetime:
    """
    Se genera una fecha de registro con distribución exponencial para simular
    el crecimiento orgánico acelerado típico de un SaaS en expansión.
    """
    WINDOW_DAYS = 180    # Ventana de historia: 6 meses hacia atrás
    LAMBDA      = 0.018  # Controla la tasa de aceleración del crecimiento

    # Se truncan los outliers extremos para mantener la coherencia temporal
    days_ago = min(random.expovariate(LAMBDA), WINDOW_DAYS)
    return NOW - timedelta(days=days_ago)

# *************************************************************************************
# MÓDULO 2: MODELADO DE PLANES Y PRECIOS
# *************************************************************************************

# Se define la distribución de planes según el modelo Pareto:
# mayoría en Basic (masa), minoría en Enterprise (alto LTV)
PLANES = {
    "Basic":      {"price": 29.00,  "prob": 0.70},
    "Pro":        {"price": 79.00,  "prob": 0.20},
    "Enterprise": {"price": 249.00, "prob": 0.10},
}

def pick_plan() -> str:
    """Se selecciona un plan de forma aleatoria respetando la distribución de probabilidad definida."""
    r = random.random()
    if r < 0.70: return "Basic"
    if r < 0.90: return "Pro"
    return "Enterprise"

# *************************************************************************************
# MÓDULO 3: SIMULACIÓN DEL CICLO DE VIDA (SUBSCRIPTION STATUS)
# *************************************************************************************

def build_subscription(user_id: str, reg_date: datetime) -> dict:
    """
    Se construye la suscripción de un usuario modelando la probabilidad de churn
    en función de su antigüedad: las cohortes más viejas tienen mayor tasa de cancelación.
    """
    plan_name = pick_plan()
    price     = PLANES[plan_name]["price"]

    # Se incrementa la tasa de churn para usuarios con más de 90 días en la plataforma
    days_active    = (NOW - reg_date).days
    churn_baseline = 0.05
    if days_active > 90:
        churn_baseline += 0.10  # Tasa ajustada al 15% para cohortes antiguas

    is_canceled = random.random() < churn_baseline

    if is_canceled:
        # Se calcula una fecha de cancelación aleatoria dentro del periodo activo del usuario
        duration_days = random.randint(1, max(1, days_active))
        canceled_at   = reg_date + timedelta(days=duration_days)
        status        = "canceled"
    else:
        status      = "active"
        canceled_at = None

    return {
        "id":            str(uuid.uuid4()),
        "user_id":       user_id,
        "plan_name":     plan_name,
        "status":        status,
        "monthly_price": price,
        "started_at":    reg_date,
        "canceled_at":   canceled_at
    }

# *************************************************************************************
# MÓDULO 4: HISTORIAL DE PAGOS (FINANCIAL DATA ENGINE)
# *************************************************************************************

def build_payments(sub: dict) -> list[dict]:
    """
    Se genera el historial de pagos mensuales de una suscripción.
    Se introduce un 3% de probabilidad de fallo para simular datos financieros sucios.
    """
    payments    = []
    start_dt    = sub["started_at"]
    end_dt      = sub["canceled_at"] if sub["status"] == "canceled" else NOW
    current_pay = start_dt

    while current_pay <= end_dt:
        # Se simula un fallo de tarjeta con probabilidad del 3%
        pay_status = "success" if random.random() > 0.03 else "failed"

        payments.append({
            "id":              str(uuid.uuid4()),
            "subscription_id": sub["id"],
            "amount":          sub["monthly_price"] if pay_status == "success" else 0.00,
            "status":          pay_status,
            "processed_at":    current_pay
        })

        # Se avanza al siguiente ciclo de facturación mensual
        current_pay += relativedelta(months=1)

    return payments

# *************************************************************************************
# MÓDULO 5: QUERIES DE INSERCIÓN (BULK PATTERN)
# *************************************************************************************

INSERT_USER = """
    INSERT INTO core.users (id, email, full_name, registration_date)
    VALUES (%s, %s, %s, %s);
"""
INSERT_SUB = """
    INSERT INTO core.subscriptions (id, user_id, plan_name, status, monthly_price, started_at, canceled_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s);
"""
INSERT_PAY = """
    INSERT INTO core.payments (id, subscription_id, amount, status, processed_at)
    VALUES (%s, %s, %s, %s, %s);
"""
INSERT_LOG = """
    INSERT INTO core.user_activity_logs (id, user_id, event_type, event_date)
    VALUES (%s, %s, %s, %s);
"""

# *************************************************************************************
# MÓDULO 6: EJECUCIÓN DEL SEEDER
# *************************************************************************************

def run_seed(n_users: int = 100):
    conn   = None
    cursor = None

    try:
        print(f"Iniciando generación de datos sintéticos para {n_users} usuarios...")

        # Se establece la conexión a PostgreSQL usando la URL limpia del .env
        conn   = psycopg2.connect(CLEAN_DB_URL)
        cursor = conn.cursor()

        # Se truncan todas las tablas del schema para evitar colisiones de clave primaria
        print("Limpiando registros previos en el schema core...")
        cursor.execute("TRUNCATE core.user_activity_logs, core.payments, core.subscriptions, core.users CASCADE;")

        # Se generan emails únicos usando el generador de Faker para evitar duplicados
        emails = set()
        while len(emails) < n_users:
            emails.add(fake.unique.email())
        emails = list(emails)

        canceled_count = 0
        total_payments = 0
        total_logs     = 0

        for i, email in enumerate(emails):
            user_id  = str(uuid.uuid4())
            name     = fake.name()
            reg_date = generate_registration_date()

            # ── 1. Se inserta el usuario base ──
            cursor.execute(INSERT_USER, (user_id, email, name, reg_date))

            # ── 2. Se construye e inserta la suscripción con su ciclo de vida simulado ──
            sub = build_subscription(user_id, reg_date)
            cursor.execute(INSERT_SUB, (
                sub["id"], sub["user_id"], sub["plan_name"],
                sub["status"], sub["monthly_price"],
                sub["started_at"], sub["canceled_at"]
            ))

            if sub["status"] == "canceled":
                canceled_count += 1

            # ── 3. Se genera e inserta el historial de pagos mensuales ──
            payments = build_payments(sub)
            for pay in payments:
                cursor.execute(INSERT_PAY, (
                    pay["id"], pay["subscription_id"],
                    pay["amount"], pay["status"], pay["processed_at"]
                ))
            total_payments += len(payments)

            # ── 4. Se simulan los eventos de actividad del usuario ──
            n_logs         = 0
            total_days_active = 0

            if reg_date < NOW:
                # Se modela inactividad repentina: el 10% de usuarios activos
                # no registra eventos en los últimos 20 días
                is_inactive_user  = random.random() < 0.10 and sub["status"] == "active"
                end_activity_date = NOW - timedelta(days=20) if is_inactive_user else NOW

                n_logs            = random.randint(5, 30)
                total_days_active = (end_activity_date - reg_date).days

                if total_days_active > 0:
                    for _ in range(n_logs):
                        # Se distribuyen los eventos uniformemente a lo largo del periodo activo
                        log_date   = reg_date + timedelta(days=random.randint(0, total_days_active))
                        event_type = random.choice(['login', 'click_dashboard', 'export_data', 'view_report'])

                        cursor.execute(INSERT_LOG, (
                            str(uuid.uuid4()),
                            user_id,
                            event_type,
                            log_date
                        ))
                    total_logs += n_logs

            print(f"  [{i+1:>3}/{n_users}] email={email[:28]:<28} "
                  f"plan={sub['plan_name']:<10} "
                  f"status={sub['status']:<8} "
                  f"pagos={len(payments):<3} "
                  f"logs={n_logs if total_days_active > 0 else 0}")

        conn.commit()

        print("\n" + "=" * 55)
        print("  RESUMEN DE GENERACIÓN DE DATOS — COMPLETADO")
        print("=" * 55)
        print(f"  Usuarios generados          : {n_users}")
        print(f"  Cancelaciones (churn)       : {canceled_count} ({canceled_count/n_users:.1%})")
        print(f"  Pagos registrados           : {total_payments}")
        print(f"  Eventos de actividad (logs) : {total_logs}")
        print("=" * 55 + "\n")

    except psycopg2.Error as e:
        print(f"Error crítico de base de datos: {e}")
        if conn: conn.rollback()
    except Exception as e:
        print(f"Error inesperado durante la ejecución del seeder: {e}")
        if conn: conn.rollback()
    finally:
        if cursor: cursor.close()
        if conn:   conn.close()


# Se define este bloque como punto de entrada para ejecución directa desde consola
if __name__ == "__main__":
    run_seed(n_users=100)