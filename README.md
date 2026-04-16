# Plataforma de Analítica y Métricas SaaS

Este repositorio contiene el núcleo del backend para una plataforma de Inteligencia de Negocios (BI) especializada en modelos basados en suscripciones. El sistema está diseñado para transformar datos transaccionales en métricas financieras accionables.

## Resumen del Proyecto

El objetivo principal es proporcionar una API robusta para monitorear la salud financiera de un servicio digital. Gestiona el ciclo de vida completo de usuarios, suscripciones y pagos para calcular métricas complejas como el Ingreso Mensual Recurrente (MRR) y la tasa de cancelación de clientes (Churn).

## Stack Técnico

* Framework: FastAPI
* Validación de Datos: Pydantic v2
* ORM: SQLAlchemy
* Base de Datos: PostgreSQL
* Gestión de Entorno: Python Dotenv
* Servidor: Uvicorn / FastAPI CLI

## Características Clave

* Inicialización Automatizada de Base de Datos: Generación automática de esquemas relacionales en PostgreSQL.
* Integridad de Datos: Implementación de tipos Decimal para todas las transacciones financieras para asegurar precisión y prevenir errores de redondeo.
* Validación de Esquemas: Contratos estrictos de entrada y salida mediante modelos de Pydantic.
* Documentación Automatizada: Documentación interactiva de la API proporcionada por OpenAPI/Swagger.

## Estructura del Proyecto

* database.py: Configuración del motor y gestión de sesiones.
* models.py: Definición de la capa de persistencia y entidades de la base de datos.
* schemas.py: Implementación de DTOs para la validación de peticiones y respuestas.
* main.py: Punto de entrada de la aplicación y orquestación de rutas.

## Instrucciones de Configuración

1. Clonar el repositorio.
2. Crear un entorno virtual: python -m venv venv.
3. Activar el entorno e instalar dependencias: pip install -r requirements.txt.
4. Configurar el archivo .env con sus credenciales de PostgreSQL.
5. Iniciar el servidor de desarrollo: fastapi dev main.py.