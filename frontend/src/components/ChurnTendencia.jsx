import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import '../styles/ChurnTendencia.css';

const ChurnTendencia = ({ darkMode }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/metrics/churn')
      .then(res => {
        const datosFormateados = res.data.map(item => ({
          ...item,
          churn_rate: parseFloat(item.churn_rate),
          mes_formateado: new Date(item.mes).toLocaleDateString('es-ES', {
            month: 'short',
            year: '2-digit'
          })
        }));
        setDatos(datosFormateados);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar churn mensual:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const bgColor = darkMode ? '#1e293b' : '#ffffff';
  const textPrimary = darkMode ? '#f1f5f9' : '#0f172a';
  const textSecondary = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';

  if (loading) {
    return (
      <div className="churn-tendencia-card" style={{ backgroundColor: bgColor, borderColor }}>
        <h3 style={{ color: textPrimary }}>Tendencia de Churn</h3>
        <div style={{ padding: '2rem', textAlign: 'center', color: textSecondary }}>Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="churn-tendencia-card" style={{ backgroundColor: bgColor, borderColor }}>
        <h3 style={{ color: textPrimary }}>Tendencia de Churn</h3>
        <div style={{ padding: '2rem', color: '#dc2626' }}>No se pudieron cargar los datos</div>
      </div>
    );
  }

  return (
    <div className="churn-tendencia-card" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
      <h3 style={{ color: textPrimary }}>Tendencia de Churn Mensual</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="mes_formateado"
            stroke={textSecondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={textSecondary}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value) => [`${value.toFixed(2)}%`, 'Churn Rate']}
            contentStyle={{
              borderRadius: '8px',
              backgroundColor: darkMode ? '#334155' : '#ffffff',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              color: textPrimary
            }}
          />
          <Line
            type="monotone"
            dataKey="churn_rate"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChurnTendencia;