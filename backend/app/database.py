import os
from pathlib import Path
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base  # Necesario para la 'Base'
from sqlalchemy.orm import sessionmaker

# --- PASO 1: UBICACIÓN ---
# .resolve() es más robusto que .absolute() para evitar rutas raras
base_path = Path(__file__).resolve().parent.parent.parent
env_path = base_path / '.env'

# --- PASO 2 y 3: PARSER E INYECCIÓN (Todo junto en el bucle) ---
if env_path.exists():
    with open(env_path, 'r', encoding="utf-8") as archivo:
        for linea in archivo:
            linea = linea.strip() # Elimina espacio extra al principio y al final de la linea

            # Filtros de seguridad
            if not linea or linea.startswith("#") or "=" not in linea: # Ignora líneas vacías, comentarios y líneas sin '='
                continue

            # Separamos y guardamos CADA variable en el sistema
            key, value = linea.split('=', 1)
            # Eliminar comillas si existen (para mayor robustez)
            value = value.strip().strip('"').strip("'")
            os.environ[key] = value
else:
    raise FileNotFoundError(f" Error Crítico: No encontré el archivo .env en {env_path}")

# --- PASO 4: CONSTRUCCIÓN DE LA URL Y SQLAlchemy ---
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(" DATABASE_URL no está definida en el archivo .env")

# Procesar la URL para manejar caracteres especiales en la contraseña
# Formato: postgresql+psycopg2://user:password@host:port/database
if "://" in DATABASE_URL:
    scheme, rest = DATABASE_URL.split("://", 1)
    if "@" in rest:
        credentials, host_db = rest.split("@", 1)
        if ":" in credentials:
            user, password = credentials.split(":", 1)
            # Codificar la contraseña para caracteres especiales
            password_encoded = quote_plus(password)
            DATABASE_URL = f"{scheme}://{user}:{password_encoded}@{host_db}"

# El motor (Engine)
engine = create_engine(DATABASE_URL)

# La fábrica de sesiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# La Clase Base (La 'madre' de tus modelos)
Base = declarative_base()

# --- PASO 5: La llave de paso (Dependencia para FastAPI) ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() # Cerramos la conexión SIEMPRE para no agotar la RAM