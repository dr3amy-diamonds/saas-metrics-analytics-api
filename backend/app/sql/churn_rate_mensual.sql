WITH meses_historicos AS(
    -- Lista continua de meses, desde la primera suscripción hasta hoy
    SELECT  GENERATE_SERIES(
    (SELECT DATE_TRUNC('month', MIN(started_at)) FROM subscriptions),
    DATE_TRUNC('month', CURRENT_DATE),
    '1 month'::INTERVAL
    ) AS MES
),
clientes_al_inicio AS(
    -- Cuántos clientes ya estaban activos ANTES de que cada mes comenzara
    SELECT
       m.mes,
       COUNT(subs.id) AS activos_inicio
    FROM meses_historicos m
    LEFT JOIN subscriptions subs
       ON DATE_TRUNC('month',subs.started_at) < m.mes      -- ya venía de meses anteriores (no empezó este mes)
       AND (
       subs.canceled_at IS NULL                            -- sigue activo, o...
       OR DATE_TRUNC('month',subs.canceled_at) >= m.mes     -- ...cancela en este mes o después (seguía activo al inicio)
    )
    GROUP BY  m.mes
),
cancelaciones_del_mes AS(
    -- Cuántas suscripciones cancelaron en cada mes
    SELECT
       DATE_TRUNC('month', canceled_at) AS mes,
       COUNT(id) AS cancelados
    FROM subscriptions
    WHERE canceled_at IS NOT NULL
    GROUP BY DATE_TRUNC('month', canceled_at)
)
SELECT
    inicio.mes,
    -- Churn rate = cancelados / activos al inicio * 100, evitando división por cero
    CASE
       WHEN inicio.activos_inicio = 0 THEN 0
       ELSE ROUND((COALESCE(cancel_mes.cancelados, 0)::numeric / inicio.activos_inicio) * 100, 2)
    END AS churn_rate
FROM clientes_al_inicio inicio
LEFT JOIN  cancelaciones_del_mes cancel_mes
    ON inicio.mes = cancel_mes.mes    -- LEFT JOIN: conserva meses sin cancelaciones (quedan en NULL -> 0)
ORDER BY  inicio.mes ASC