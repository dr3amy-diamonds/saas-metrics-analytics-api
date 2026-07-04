import os
from pathlib import Path
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Ruta a la carpeta /sql, relativa a este archivo
sql_path = Path(__file__).resolve().parent / "sql"

# --- PASO 1: UBICACIÓN ---
# .resolve() convierte la ruta a absoluta y resuelve symlinks, más robusto que .absolute()
base_path = Path(__file__).resolve().parent.parent.parent
env_path = base_path / '.env'

# --- PASO 2 y 3: PARSER E INYECCIÓN ---
if env_path.exists():
    with open(env_path, 'r', encoding="cp1252", errors="ignore") as archivo:
        for linea in archivo:
            linea = linea.strip()  # elimina espacios y saltos de línea al inicio y al final

            # ignora líneas vacías, comentarios y líneas sin '='
            if not linea or linea.startswith("#") or "=" not in linea:
                continue

            # separa clave y valor en el primer '=' que encuentre (el 1 evita partir valores que contengan '=')
            key, value = linea.split('=', 1)
            value = value.strip().strip('"').strip("'")  # elimina espacios y comillas si existen
            os.environ[key] = value  # inyecta la variable en el entorno del proceso
else:
    raise FileNotFoundError(f"Error Crítico: No encontré el archivo .env en {env_path}")

# --- PASO 4: CONSTRUCCIÓN DE LA URL Y SQLAlchemy ---
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está definida en el archivo .env")

# Si la contraseña contiene caracteres especiales (@, #, etc.), la URL se rompe sin este encoding
# Formato esperado: postgresql+psycopg2://user:password@host:port/database
if "://" in DATABASE_URL:
    scheme, rest = DATABASE_URL.split("://", 1)
    if "@" in rest:
        credentials, host_db = rest.split("@", 1)  # separa credenciales del host
        if ":" in credentials:
            user, password = credentials.split(":", 1)
            password_encoded = quote_plus(password)  # codifica caracteres especiales en la contraseña
            DATABASE_URL = f"{scheme}://{user}:{password_encoded}@{host_db}"

# Motor de conexión a la BD — gestiona el pool de conexiones internamente
engine = create_engine(DATABASE_URL)

# Fábrica de sesiones — cada llamada a SessionLocal() abre una sesión nueva
# autocommit=False: los cambios no se guardan hasta hacer db.commit() explícito
# autoflush=False: SQLAlchemy no sincroniza el estado antes de cada query automáticamente
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base de la que heredan todos los modelos ORM del proyecto
Base = declarative_base()

# --- PASO 5: DEPENDENCIA DE SESIÓN PARA FASTAPI ---
def get_db():
    # abre una sesión por request y la cierra siempre al terminar, con o sin error
    db = SessionLocal()
    try:
        yield db       # FastAPI inyecta esta sesión en el endpoint que la pida (Depends)
    finally:
        db.close()     # se ejecuta siempre, evita conexiones abiertas que agoten el pool

# --- PASO 6: LECTOR AUTOMÁTICO DE ARCHIVOS SQL ---
def leer_sql(nombres_archivo: str) -> str:
    """
    Busca un archivo .sql en la carpeta app/sql y devuelve su contenido como texto.
    """
    ruta_del_archivo = sql_path / nombres_archivo  # construye la ruta completa al archivo

    if not ruta_del_archivo.exists():
        raise FileNotFoundError(f"Error Crítico: No se encontró el archivo SQL en: {ruta_del_archivo}")

    return ruta_del_archivo.read_text(encoding="utf-8")  # lee y devuelve el contenido completo