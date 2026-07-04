-- mrr_movement.sql
-- Desglosa el cambio mensual de MRR en: Nuevo, Cancelación, Expansión, Contracción.
-- Cada suscripción mantiene una fila por cada mes desde que inició (incluso después
-- de cancelar), para que LAG() pueda comparar correctamente contra el mes anterior.

WITH meses_historicos AS (
    SELECT generate_series(
       (SELECT DATE_TRUNC('month', MIN(started_at)) FROM core.subscriptions),
       DATE_TRUNC('month', CURRENT_DATE),
       '1 month'::INTERVAL
    ) AS mes
),

-- Precio "efectivo" por mes y suscripción: el precio real si seguía activa,
-- o 0 si ya había cancelado antes o durante ese mes.
mrr_por_suscripcion AS (
    SELECT
       m.mes,
       s.id AS subscription_id,

       CASE
           WHEN s.canceled_at IS NOT NULL
                AND DATE_TRUNC('month', s.canceled_at) <= m.mes
               THEN 0
           ELSE s.monthly_price
       END AS precio_efectivo,

       LAG(
           CASE
               WHEN s.canceled_at IS NOT NULL
                    AND DATE_TRUNC('month', s.canceled_at) <= m.mes
                   THEN 0
               ELSE s.monthly_price
           END
       ) OVER (
           PARTITION BY s.id
           ORDER BY m.mes
       ) AS precio_anterior

    FROM meses_historicos m
    LEFT JOIN core.subscriptions s
        ON DATE_TRUNC('month', s.started_at) <= m.mes
        -- Nota: ya NO filtramos por canceled_at aquí — la fila debe seguir
        -- existiendo después de la cancelación, solo que con precio_efectivo = 0
)

SELECT
    mes,

    CASE
       WHEN precio_anterior IS NULL THEN 'Nuevo'
       WHEN precio_efectivo = 0 AND precio_anterior > 0 THEN 'Cancelación'
       WHEN precio_efectivo > precio_anterior THEN 'Expansión'
       WHEN precio_efectivo < precio_anterior THEN 'Contracción'
       ELSE 'Sin Cambio'
    END AS categoria,

    SUM(COALESCE(precio_efectivo, 0) - COALESCE(precio_anterior, 0)) AS cambio_neto_mrr

FROM mrr_por_suscripcion
GROUP BY
    mes,
    CASE
       WHEN precio_anterior IS NULL THEN 'Nuevo'
       WHEN precio_efectivo = 0 AND precio_anterior > 0 THEN 'Cancelación'
       WHEN precio_efectivo > precio_anterior THEN 'Expansión'
       WHEN precio_efectivo < precio_anterior THEN 'Contracción'
       ELSE 'Sin Cambio'
    END
ORDER BY mes ASC, categoria;