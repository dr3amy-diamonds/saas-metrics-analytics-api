import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/LTVCards.css';

const LTVCards = ({ darkMode }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/metrics/ltv')
      .then(res => {
        setDatos(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar LTV:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const formatearUSD = (cantidad) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cantidad);
  };

  const formatearPorcentaje = (valor) => {
    return parseFloat(valor).toFixed(2) + '%';
  };

  const bgColor = darkMode ? '#1e293b' : '#ffffff';
  const textPrimary = darkMode ? '#f1f5f9' : '#0f172a';
  const textSecondary = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';

  const planColors = {
    'Basic': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    'Pro': { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
    'Enterprise': { bg: '#dcfce7', border: '#22c55e', text: '#166534' }
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: darkMode ? '#94a3b8' : '#64748b', textAlign: 'center' }}>Cargando LTV...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: '#dc2626', textAlign: 'center' }}>No se pudieron cargar los datos</div>;
  }

  return (
    <div className="ltv-cards-container">
      {datos.map((plan, idx) => {
        const colors = planColors[plan.plan_name] || planColors['Basic'];
        const ltvValor = plan.ltv_estimado
          ? formatearUSD(parseFloat(plan.ltv_estimado))
          : 'Sin datos suficientes';
        const ltvColor = plan.ltv_estimado ? textPrimary : textSecondary;

        return (
          <div
            key={idx}
            className="ltv-card"
            style={{
              backgroundColor: bgColor,
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${colors.border}`
            }}
          >
            <div className="ltv-badge" style={{ backgroundColor: colors.bg, color: colors.text }}>
              {plan.plan_name}
            </div>

            <div className="ltv-metric">
              <span className="ltv-label" style={{ color: textSecondary }}>ARPU</span>
              <span className="ltv-value" style={{ color: textPrimary }}>
                {formatearUSD(parseFloat(plan.arpu))} / mes
              </span>
            </div>

            <div className="ltv-metric">
              <span className="ltv-label" style={{ color: textSecondary }}>CHURN 3M</span>
              <span className="ltv-value" style={{ color: textPrimary }}>
                {formatearPorcentaje(plan.churn_promedio_3m)}
              </span>
            </div>

            <div className="ltv-main">
              <span className="ltv-label-main" style={{ color: textSecondary }}>LTV ESTIMADO</span>
              <span className="ltv-value-main" style={{ color: ltvColor }}>
                {ltvValor}
              </span>
            </div>

            {plan.nota && (
              <div className="ltv-nota" style={{ color: textSecondary, fontSize: '0.75rem' }}>
                {plan.nota}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LTVCards;