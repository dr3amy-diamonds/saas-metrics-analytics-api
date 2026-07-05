import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import '../styles/ChurnPorPlan.css';

const ChurnPorPlan = ({ darkMode }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/metrics/churn-by-plan')
      .then(res => {
        // Pivotar datos: agrupar por mes y crear columnas para cada plan
        const datosMap = {};

        res.data.forEach(item => {
          const mesFormateado = new Date(item.mes).toLocaleDateString('es-ES', {
            month: 'short',
            year: '2-digit'
          });

          if (!datosMap[mesFormateado]) {
            datosMap[mesFormateado] = { mes: mesFormateado };
          }

          datosMap[mesFormateado][item.plan_name] = parseFloat(item.churn_rate) * 100;
        });

        const datosPivoteados = Object.values(datosMap);
        setDatos(datosPivoteados);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar churn por plan:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const bgColor = darkMode ? '#1e293b' : '#ffffff';
  const textPrimary = darkMode ? '#f1f5f9' : '#0f172a';
  const textSecondary = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';
  const gridColor = darkMode ? '#334155' : '#e2e8f0';

  const colors = {
    'Basic': '#3b82f6',
    'Pro': '#8b5cf6',
    'Enterprise': '#22c55e'
  };

  if (loading) {
    return (
      <div className="churn-por-plan-card" style={{ backgroundColor: bgColor, borderColor }}>
        <h3 style={{ color: textPrimary }}>Churn por Plan</h3>
        <div style={{ padding: '2rem', textAlign: 'center', color: textSecondary }}>Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="churn-por-plan-card" style={{ backgroundColor: bgColor, borderColor }}>
        <h3 style={{ color: textPrimary }}>Churn por Plan</h3>
        <div style={{ padding: '2rem', color: '#dc2626' }}>No se pudieron cargar los datos</div>
      </div>
    );
  }

  return (
    <div className="churn-por-plan-card" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
      <h3 style={{ color: textPrimary }}>Churn por Plan</h3>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="mes"
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
            formatter={(value) => `${value.toFixed(2)}%`}
            contentStyle={{
              borderRadius: '8px',
              backgroundColor: darkMode ? '#334155' : '#ffffff',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              color: textPrimary
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '1rem' }}
          />
          <Line
            type="monotone"
            dataKey="Basic"
            stroke={colors['Basic']}
            strokeWidth={2}
            dot={false}
            name="Basic"
          />
          <Line
            type="monotone"
            dataKey="Pro"
            stroke={colors['Pro']}
            strokeWidth={2}
            dot={false}
            name="Pro"
          />
          <Line
            type="monotone"
            dataKey="Enterprise"
            stroke={colors['Enterprise']}
            strokeWidth={2}
            dot={false}
            name="Enterprise"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChurnPorPlan;

