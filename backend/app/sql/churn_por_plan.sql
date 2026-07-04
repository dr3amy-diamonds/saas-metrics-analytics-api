WITH meses_historicos AS(
    -- Lista continua de meses, desde la primera suscripción hasta hoy
    SELECT  GENERATE_SERIES(
    (SELECT DATE_TRUNC('month', MIN(started_at)) FROM subscriptions),
    DATE_TRUNC('month', CURRENT_DATE),
    '1 month'::INTERVAL
    ) AS mes
),
clientes_al_inicio AS(
    -- Clientes activos al inicio de cada mes, separados por plan
    SELECT
       meses.mes,
       subs.plan_name,
       COUNT(subs.id) as activos_inicio
    FROM meses_historicos meses
    LEFT JOIN subscriptions subs
       ON DATE_TRUNC('month', subs.started_at) < meses.mes        -- ya venía de meses anteriores
       AND (
          subs.canceled_at IS NULL                                -- sigue activo, o...
          OR
          DATE_TRUNC('month',subs.canceled_at) >= meses.mes        -- ...cancela este mes o después
       )
    GROUP BY meses.mes, subs.plan_name   -- agrupa por mes Y plan, no solo por mes
),
cancelaciones_del_mes AS(
    -- Cancelaciones ocurridas en cada mes, separadas por plan
    SELECT
       DATE_TRUNC('month', subs.canceled_at) AS mes,
       subs.plan_name,
       COUNT(id) AS cancelados
       FROM subscriptions subs
       WHERE canceled_at IS NOT NULL          -- solo suscripciones que sí cancelaron
       GROUP BY DATE_TRUNC('month', subs.canceled_at), plan_name
)
SELECT
    inicio.mes,
    inicio.plan_name,
    -- Churn rate = cancelados / activos al inicio * 100, por plan, evitando división por cero
    CASE
       WHEN inicio.activos_inicio = 0 THEN 0
       ELSE ROUND((COALESCE(cancel_mes.cancelados, 0)::numeric / inicio.activos_inicio) * 100, 2)
    END AS churn_rate
    FROM clientes_al_inicio inicio
    LEFT JOIN cancelaciones_del_mes cancel_mes
       ON inicio.mes = cancel_mes.mes
       AND inicio.plan_name = cancel_mes.plan_name   -- el JOIN ahora necesita coincidir mes Y plan
    WHERE inicio.plan_name IS NOT NULL
    ORDER BY inicio.mes ASC, inicio.plan_name ASC    -- orden cronológico, y por plan dentro de cada mes