-- CÓDIGO FUENTE PARA CREAR LA BASE DE DATOS

CREATE DATABASE saas_core_db;

CREATE SCHEMA core;

SET search_path TO core;

-- 1. Tabla de Usuarios
CREATE TABLE users(
-- Identificador único universal: evita duplicados al escalar y mejora la seguridad.
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     -- Identidad de negocio: debe ser único para evitar cuentas duplicadas.
     email text UNIQUE NOT NULL,
     -- Atributo descriptivo: nombre del cliente para visualización en dashboards.
     full_name text,
     -- Métrica de tiempo: fundamental para calcular el User Growth y análisis de cohortes.
     registration_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Suscripciones
CREATE TABLE subscriptions(
-- Identificador único universal: evita duplicados al escalar y mejora la seguridad.
	id  uuid primary key default gen_random_uuid(),
-- Identificador de relación: vincula la suscripción con un usuario específico.
	user_id uuid not null,
-- Atributo descriptivo: nombre del plan para visualización en dashboards y análisis de popularidad.
	plan_name text not null,
-- Atributo de estado: esencial para calcular el MRR y entender la salud de la base de clientes.
	status text not null,
-- Métrica de valor: precio mensual para calcular el MRR y el LTV.
	monthly_price numeric(10,2) not null,
-- Métrica de tiempo: fecha de inicio para calcular el User Growth, análisis de cohortes y duración de la suscripción.
	started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
-- Métrica de tiempo: fecha de cancelación para calcular la tasa de cancelación y duración de la suscripción.
	canceled_at TIMESTAMPTZ,
-- Llave foránea: asegura la integridad referencial entre suscripciones y usuarios.
	CONSTRAINT fk_subscriptions_user
--  Puente de relación: conecta la columna user_id con la columna id de la tabla users.
		FOREIGN KEY(user_id) references users(id)
);

-- 3. Tabla de pagos
CREATE TABLE payments(
-- Identificador único universal: evita duplicados al escalar y mejora la seguridad.
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- Identificador de relación: vincula el pago con una suscripción específica.
	subscription_id UUID NOT NULL,
-- Métrica de valor: monto del pago para calcular el MRR, LTV y analizar ingresos.
	amount NUMERIC(10,2) NOT NULL,
-- Atributo de estado: esencial para entender el éxito de los pagos y calcular métricas como la tasa de éxito de pagos.
	status TEXT CHECK (status IN ('success', 'failed', 'pending')) NOT NULL,
-- Métrica de tiempo: fecha del pago para análisis de ingresos, cohortes y tendencias de pago.
	processed_at TIMESTAMPTZ DEFAULT NOW(),
	
-- Llave foránea: asegura la integridad referencial entre pagos y suscripciones.
	CONSTRAINT fk_payments_subscription
		FOREIGN KEY(subscription_id) REFERENCES subscriptions(id)
);

-- 4. Tabla de Logs de Actividad
CREATE TABLE user_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES core.users(id) NOT NULL,
    event_type text NOT NULL,
    event_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índice para optimizar consultas rápidas
CREATE INDEX idx_activity_user_date ON user_activity_logs(user_id, event_date DESC);

-- Esta tabla es para almacenar eventos relacionados con las suscripciones, como actualizaciones de plan, renovaciones, etc.
-- Paso 4: Crear el "Contenedor" (CTE)
WITH mrr_data AS (
	-- Paso 1: Definir la fuente y las columnas básicas
	SELECT plan_name,
	-- Instrucción 1: SUM para calcular el ingreso total por plan
		   SUM(monthly_price) as revenue_by_plan,
	-- Instrucción 2: COUNT para contar el número de suscriptores por plan
		   COUNT(*)           as subscribers_by_plan
	-- Fuente de datos: la tabla de suscripciones es la base para calcular el MRR, ya que contiene la información de los planes y precios.
	FROM subscriptions
	-- Paso 2: Aplicar la "Lógica de Negocio" (Filtros)
	-- Filtrar solo suscripciones activas para obtener un cálculo preciso del MRR, ya que las suscripciones canceladas no contribuyen al ingreso recurrente.
	WHERE status = 'active'
	-- Además, asegurarse de incluir solo suscripciones que no han sido canceladas o que se cancelarán en el futuro, para reflejar correctamente el MRR actual.
	  AND (canceled_at IS NULL OR canceled_at > NOW())
	-- Paso 3: Agrupar por categorías
	-- Agrupar por plan_name para obtener métricas específicas de cada plan, lo que es esencial para el análisis de la popularidad de los planes y la contribución al MRR.
	GROUP BY plan_name
)

-- Paso 5: Calcular el Porcentaje Global (Window Function)
-- Paso 6: Estética y Formateo
-- Paso 7: Ordenar por Importancia
-- En esta sección, se calcula el porcentaje que representa cada plan en el total del MRR utilizando una función de ventana para obtener el total global y luego formateando el resultado para una mejor presentación.
SELECT
    plan_name,
    revenue_by_plan,
    subscribers_by_plan,
    -- Instrucción 1 y 2: ROUND, multiplicar por 100 y concatenar '%'
    -- El cálculo del porcentaje se realiza dividiendo el revenue_by_plan por el total del revenue_by_plan (obtenido con la función de ventana SUM() OVER()) y luego multiplicando por 100 para obtener el porcentaje. Finalmente, se redondea a 2 decimales y se concatena el símbolo '%' para una presentación clara.
    ROUND((revenue_by_plan / SUM(revenue_by_plan) OVER()) * 100, 2) || '%' as percentage_of_total
FROM mrr_data
-- Paso 7: Ordenar por revenue_by_plan de forma descendente
-- Ordenar los resultados por revenue_by_plan en orden descendente para destacar los planes que generan más ingresos, lo que es crucial para la toma de decisiones estratégicas y el análisis de la rentabilidad de cada plan.
ORDER BY revenue_by_plan DESC;