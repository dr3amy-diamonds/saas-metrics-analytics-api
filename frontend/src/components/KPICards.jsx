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

  const getChurnColor = (valor) => {
    if (valor > 10) return '#dc2626';
    if (valor > 5) return '#f59e0b';
    return '#22c55e';
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>Cargando KPIs...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>No se pudieron cargar las métricas clave</div>;
  }

  const ultimoMrr = mrrData && mrrData.length > 0 ? parseFloat(mrrData[mrrData.length - 1].mrr_total) : 0;
  const penultimoMrr = mrrData && mrrData.length > 1 ? parseFloat(mrrData[mrrData.length - 2].mrr_total) : ultimoMrr;
  const mrrPorcentajeCambio = penultimoMrr > 0 ? ((ultimoMrr - penultimoMrr) / penultimoMrr) * 100 : 0;

  // Modificado para tomar el penúltimo mes debido a datos incompletos en el mes activo
  const ultimoChurn = churnData && churnData.length > 1 ? parseFloat(churnData[churnData.length - 2].churn_rate) : 0;

  const ltvValores = ltvData && Array.isArray(ltvData) ? ltvData.map(p => parseFloat(p.ltv_estimado || 0)).filter(v => v > 0) : [];
  const ltvPromedio = ltvValores.length > 0 ? ltvValores.reduce((sum, v) => sum + v, 0) / ltvValores.length : 0;

  const suscripcionesActivas = mrrData && mrrData.length > 0 ? (mrrData[mrrData.length - 1].suscripciones_activas || mrrData[mrrData.length - 1].clientes_activos || 0) : 0;

  const mrrSparklineData = mrrData ? mrrData.map(item => ({ value: parseFloat(item.mrr_total) })) : [];
  const churnSparklineData = churnData ? churnData.map(item => ({ value: parseFloat(item.churn_rate) })) : [];
  const ltvSparklineData = mrrData ? mrrData.map(() => ({ value: ltvPromedio })) : [];

  return (
    <div className="kpi-cards-grid">
      {/* MRR Total */}
      <div className={darkMode ? 'kpi-card card-dark' : 'kpi-card card-light'}>
        <div className="kpi-header">
          <span className={darkMode ? 'kpi-label texto-secundario-dark' : 'kpi-label texto-secundario-light'}>MRR TOTAL</span>
          <DollarSign size={18} style={{ color: '#3b82f6' }} />
        </div>
        <div className="kpi-value kpi-value-azul">
          {formatearUSD(ultimoMrr)}
        </div>
        <div className="kpi-footer">
          {mrrPorcentajeCambio >= 0 ? (
            <span className="kpi-trend trend-up"><TrendingUp size={14} /> {mrrPorcentajeCambio.toFixed(1)}%</span>
          ) : (
            <span className="kpi-trend trend-down"><TrendingDown size={14} /> {Math.abs(mrrPorcentajeCambio).toFixed(1)}%</span>
          )}
          <span className="kpi-subtext" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}> vs mes anterior</span>
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
      <div className={darkMode ? 'kpi-card card-dark' : 'kpi-card card-light'}>
        <div className="kpi-header">
          <span className={darkMode ? 'kpi-label texto-secundario-dark' : 'kpi-label texto-secundario-light'}>CHURN RATE</span>
          <Users size={18} style={{ color: getChurnColor(ultimoChurn) }} />
        </div>
        <div className="kpi-value" style={{ color: getChurnColor(ultimoChurn) }}>
          {formatearPorcentaje(ultimoChurn)}
        </div>
        <div className="kpi-sparkline">
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={churnSparklineData}>
              <Line type="monotone" dataKey="value" stroke={getChurnColor(ultimoChurn)} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LTV Promedio */}
      <div className={darkMode ? 'kpi-card card-dark' : 'kpi-card card-light'}>
        <div className="kpi-header">
          <span className={darkMode ? 'kpi-label texto-secundario-dark' : 'kpi-label texto-secundario-light'}>LTV PROMEDIO</span>
          <DollarSign size={18} style={{ color: '#22c55e' }} />
        </div>
        <div className="kpi-value kpi-value-verde">
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
      <div className={darkMode ? 'kpi-card card-dark' : 'kpi-card card-light'}>
        <div className="kpi-header">
          <span className={darkMode ? 'kpi-label texto-secundario-dark' : 'kpi-label texto-secundario-light'}>SUSCRIPCIONES ACTIVAS</span>
          <Users size={18} style={{ color: '#8b5cf6' }} />
        </div>
        <div className="kpi-value kpi-value-violeta">
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