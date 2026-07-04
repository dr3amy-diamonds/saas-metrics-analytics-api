WITH meses_historicos AS(
    -- Lista continua de meses, desde la primera suscripción hasta hoy
    SELECT  GENERATE_SERIES(
    (SELECT DATE_TRUNC('month', MIN(started_at)) FROM subscriptions), -- mes de la primera suscripción
    DATE_TRUNC('month', CURRENT_DATE),                                -- mes actual
    '1 month'::INTERVAL                                               -- avanza de mes en mes
    ) AS mes
),
clientes_inicio AS(
    -- Clientes activos al inicio de cada mes, por plan. Incluye el precio para usarlo después en ARPU.
    SELECT
       meses.mes,
       subs.plan_name,
       subs.monthly_price,                 -- se arrastra para poder calcular ARPU más adelante
       COUNT(subs.id) AS activos_inicio    -- cuántas suscripciones de ese plan estaban activas al inicio del mes
    FROM meses_historicos meses
    LEFT JOIN subscriptions subs
       ON DATE_TRUNC('month', subs.started_at) < meses.mes        -- ya venía de meses anteriores (no empezó este mes)
       AND (
          subs.canceled_at IS NULL                                -- sigue activo, o...
          OR
          DATE_TRUNC('month', subs.canceled_at) >= meses.mes       -- ...cancela este mes o después (seguía activo al inicio)
       )
    -- se agrupa también por monthly_price porque va en el SELECT sin agregación
    GROUP BY meses.mes, subs.plan_name, subs.monthly_price
),
cancelaciones_del_mes AS(
    -- Cancelaciones ocurridas en cada mes, separadas por plan
    SELECT
       DATE_TRUNC('month', subs.canceled_at) AS mes,
       subs.plan_name,
       COUNT(id) AS cancelados
       FROM subscriptions subs
       WHERE canceled_at IS NOT NULL                                  -- solo suscripciones que sí cancelaron
       GROUP BY DATE_TRUNC('month', subs.canceled_at), plan_name
),
churn_mensual AS(
    -- Churn rate mensual por plan (mismo cálculo que la vista de Churn by Plan)
    SELECT
       inicio.mes,
       inicio.plan_name,
       inicio.monthly_price,
    -- churn rate = cancelados / activos al inicio * 100, evitando división por cero
    CASE
       WHEN inicio.activos_inicio = 0 THEN 0
       ELSE ROUND((COALESCE(cancel_mes.cancelados, 0)::numeric / inicio.activos_inicio) * 100, 2)
    END AS churn_rate
    FROM clientes_inicio inicio
    LEFT JOIN cancelaciones_del_mes cancel_mes
       ON inicio.mes = cancel_mes.mes AND inicio.plan_name = cancel_mes.plan_name  -- el JOIN exige coincidir mes Y plan
)
SELECT
    plan_name,
    -- MAX en vez de AVG: asume que todos los usuarios del plan pagan el mismo precio (precio fijo de lista)
    MAX(monthly_price) as arpu,
    -- promedio del churn mensual dentro de la ventana de 3 meses, redondeado a 2 decimales
    ROUND(AVG(churn_rate), 2) AS churn_promedio_3m
FROM churn_mensual
WHERE plan_name IS NOT NULL                                              -- descarta filas "fantasma" del LEFT JOIN (sin suscripción real)
  AND mes >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'      -- ventana móvil: últimos 3 meses incluyendo el actual
GROUP BY  plan_name           -- colapsa los 3 meses en un solo registro resumen por plan
ORDER BY plan_name ASC;       -- orden alfabético por plan