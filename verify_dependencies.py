#!/usr/bin/env python3
"""
verify_dependencies.py - Verifica que todas las dependencias estén instaladas
"""

import sys
import importlib
from pathlib import Path

# Librerías requeridas según el análisis del código
REQUIRED_PACKAGES = {
    'fastapi': 'fastapi==0.110.0',
    'uvicorn': 'uvicorn==0.27.0',
    'sqlalchemy': 'sqlalchemy==2.0.49',
    'psycopg2': 'psycopg2-binary==2.9.11',
    'pydantic': 'pydantic==2.6.3',
    'pydantic_core': 'pydantic==2.6.3',
    'email_validator': 'email-validator==2.3.0',
    'pandas': 'pandas==3.0.1',
    'numpy': 'numpy==2.4.2',
    'scipy': 'scipy==1.17.0',
    'pytz': 'pytz==2025.2',
    'dateutil': 'python-dateutil==2.9.0.post0',
    'requests': 'requests==2.32.5',
    'faker': 'Faker==40.13.0',
    'pytest': 'pytest==7.4.4',
    'dotenv': 'python-dotenv==1.0.1',
}

def check_dependencies():
    """Verifica si las librerías están instaladas"""
    missing = []
    installed = []

    print("=" * 70)
    print("VERIFICACIÓN DE DEPENDENCIAS DEL PROYECTO")
    print("=" * 70)
    print()

    for package_name, requirement in REQUIRED_PACKAGES.items():
        try:
            importlib.import_module(package_name)
            installed.append((package_name, requirement))
            print(f"✅ {package_name:<20} - INSTALADO")
        except ImportError:
            missing.append((package_name, requirement))
            print(f"❌ {package_name:<20} - FALTANTE")

    print()
    print("=" * 70)
    print(f"RESUMEN: {len(installed)} instaladas, {len(missing)} faltantes")
    print("=" * 70)

    if missing:
        print("\n📦 Librerías faltantes a instalar:")
        print()
        for package_name, requirement in missing:
            print(f"  pip install {requirement}")
        print()
        print("Para instalar todas de una vez:")
        print("  pip install -r backend/requirements.txt")
        return False
    else:
        print("\n✨ ¡TODAS LAS DEPENDENCIAS ESTÁN INSTALADAS!")
        return True

if __name__ == "__main__":
    success = check_dependencies()
    sys.exit(0 if success else 1)

