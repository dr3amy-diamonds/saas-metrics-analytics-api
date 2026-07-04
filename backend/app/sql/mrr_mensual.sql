-- Paso 1 y Paso 2
-- Generamos una lista continua de meses para que ninguno desaparezca del reporte,
-- incluso si no hubo movimientos ese mes.

WITH meses_historicos AS (
    SELECT generate_series(
       (SELECT DATE_TRUNC('month', MIN(started_at)) FROM subscriptions), -- mes de la primera suscripción
       DATE_TRUNC('month', CURRENT_DATE),                                -- mes actual
       '1 month'::INTERVAL                                               -- avanza de mes en mes
    ) AS mes
)
-- Paso 3 y 4
SELECT
    m.mes,
    -- Paso 5 y Paso 6: Suma del MRR y manejo de NULLs
    COALESCE(SUM(s.monthly_price), 0) AS mrr_total,
    COUNT(s.id) AS suscripciones_activas
FROM meses_historicos m
LEFT JOIN subscriptions s
    ON DATE_TRUNC('month', s.started_at) <= m.mes     -- la suscripción ya existía en ese mes
    AND (
       s.canceled_at IS NULL                          -- sigue activa hoy, o...
       OR DATE_TRUNC('month', s.canceled_at) > m.mes   -- ...se canceló después de ese mes
    )
GROUP BY m.mes      -- agrupa todas las suscripciones activas por mes para poder sumarlas
ORDER BY m.mes ASC; -- ordena cronológicamente para la gráfica