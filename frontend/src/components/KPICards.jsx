import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import '../styles/KPICards.css';

const KPICards = ({ darkMode }) => {
  const [mrrData, setMrrData] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [ltvData, setLtvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [mrrRes, churnRes, ltvRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/metrics/mrr'),
          axios.get('http://127.0.0.1:8000/metrics/churn'),
          axios.get('http://127.0.0.1:8000/metrics/ltv')
        ]);

        setMrrData(mrrRes.data);
        setChurnData(churnRes.data);
        setLtvData(ltvRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos de KPI:', err);
        setError(true);
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const formatearUSD = (cantidad) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cantidad);
  };

  const formatearPorcentaje = (valor) => {
    return (parseFloat(valor) * 100).toFixed(2) + '%';
  };

  if (loading) {
    return <div className="skeleton-kpi-loader" style={{ color: darkMode ? '#94a3b8' : '#94a3b8' }}>Cargando KPIs...</div>;
  }

  if (error) {
    return <div className="error-kpi" style={{ color: darkMode ? '#fca5a5' : '#dc2626' }}>No se pudieron cargar los datos</div>;
  }

  // MRR Actual (último valor)
  const mrrActual = mrrData && mrrData.length > 0 ? parseFloat(mrrData[mrrData.length - 1].mrr_total) : 0;
  const suscripcionesActivas = mrrData && mrrData.length > 0 ? mrrData[mrrData.length - 1].suscripciones_activas : 0;

  // Churn actual
  const churnActual = churnData && churnData.length > 0 ? parseFloat(churnData[churnData.length - 1].churn_rate) : 0;

  // LTV Promedio
  const ltvPromedio = ltvData && ltvData.length > 0
    ? ltvData
        .filter(item => item.ltv_estimado !== null)
        .reduce((sum, item) => sum + parseFloat(item.ltv_estimado), 0) /
      ltvData.filter(item => item.ltv_estimado !== null).length
    : 0;

  // Determinar color del churn
  const getChurnColor = (valor) => {
    if (valor > 0.10) return '#ef4444'; // rojo
    if (valor > 0.05) return '#f97316'; // naranja
    return '#22c55e'; // verde
  };

  const churnColor = getChurnColor(churnActual);

  // Mini-gráficas (sparklines)
  const mrrSparklineData = mrrData ? mrrData.map(item => ({
    value: parseFloat(item.mrr_total)
  })) : [];

  const churnSparklineData = churnData ? churnData.map(item => ({
    value: parseFloat(item.churn_rate) * 100
  })) : [];

  const ltvSparklineData = ltvData ? ltvData.filter(item => item.ltv_estimado !== null).map(item => ({
    value: parseFloat(item.ltv_estimado)
  })) : [];

  const bgColor = darkMode ? '#1e293b' : '#ffffff';
  const textPrimary = darkMode ? '#f1f5f9' : '#0f172a';
  const textSecondary = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';

  return (
    <div className="kpi-cards-container">
      {/* MRR Actual */}
      <div className="kpi-card" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        <div className="kpi-header">
          <span className="kpi-label" style={{ color: textSecondary }}>MRR ACTUAL</span>
          <TrendingUp size={18} style={{ color: '#3b82f6' }} />
        </div>
        <div className="kpi-value" style={{ color: '#3b82f6' }}>
          {formatearUSD(mrrActual)}
        </div>
        <div className="kpi-sparkline">
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={mrrSparklineData}>
              <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Churn Rate */}
      <div className="kpi-card" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        <div className="kpi-header">
          <span className="kpi-label" style={{ color: textSecondary }}>CHURN RATE</span>
          <TrendingDown size={18} style={{ color: churnColor }} />
        </div>
        <div className="kpi-value" style={{ color: churnColor }}>
          {formatearPorcentaje(churnActual)}
        </div>
        <div className="kpi-sparkline">
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={churnSparklineData}>
              <Line type="monotone" dataKey="value" stroke={churnColor} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LTV Promedio */}
      <div className="kpi-card" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        <div className="kpi-header">
          <span className="kpi-label" style={{ color: textSecondary }}>LTV PROMEDIO</span>
          <DollarSign size={18} style={{ color: '#22c55e' }} />
        </div>
        <div className="kpi-value" style={{ color: '#22c55e' }}>
          {formatearUSD(ltvPromedio)}
        </div>
        <div className="kpi-sparkline">
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={ltvSparklineData}>
              <Line type="monotone" dataKey="value" stroke="#22c55e" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Suscripciones Activas */}
      <div className="kpi-card" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        <div className="kpi-header">
          <span className="kpi-label" style={{ color: textSecondary }}>SUSCRIPCIONES ACTIVAS</span>
          <Users size={18} style={{ color: '#8b5cf6' }} />
        </div>
        <div className="kpi-value" style={{ color: '#8b5cf6' }}>
          {suscripcionesActivas}
        </div>
        <div className="kpi-sparkline">
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={mrrSparklineData}>
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default KPICards;




