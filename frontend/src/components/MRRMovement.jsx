import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import '../styles/MRRMovement.css';

const MRRMovement = ({ darkMode }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/metrics/mrr-movement')
      .then(res => {
        // Pivotar los datos: agrupar por mes y crear columnas para cada categoría
        const datosMap = {};

        res.data.forEach(item => {
          const mesFormateado = new Date(item.mes).toLocaleDateString('es-ES', {
            month: 'short',
            year: '2-digit'
          });

          if (!datosMap[mesFormateado]) {
            datosMap[mesFormateado] = { mes: mesFormateado };
          }

          datosMap[mesFormateado][item.categoria] = parseFloat(item.cambio_neto_mrr);
        });

        const datosPivoteados = Object.values(datosMap);
        setDatos(datosPivoteados);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar MRR Movement:", err);
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
    'Nuevo': '#22c55e',
    'Cancelación': '#ef4444',
    'Expansión': '#3b82f6',
    'Contracción': '#f97316',
    'Sin Cambio': '#94a3b8'
  };

  if (loading) {
    return (
      <div className="mrr-movement-card" style={{ backgroundColor: bgColor, borderColor }}>
        <h3 style={{ color: textPrimary }}>Movimiento de MRR</h3>
        <div style={{ padding: '2rem', textAlign: 'center', color: textSecondary }}>Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mrr-movement-card" style={{ backgroundColor: bgColor, borderColor }}>
        <h3 style={{ color: textPrimary }}>Movimiento de MRR</h3>
        <div style={{ padding: '2rem', color: '#dc2626' }}>No se pudieron cargar los datos</div>
      </div>
    );
  }

  return (
    <div className="mrr-movement-card" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
      <h3 style={{ color: textPrimary }}>Movimiento de MRR</h3>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={datos}>
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
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value) => `$${value.toLocaleString()}`}
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
            iconType="square"
          />
          <Bar dataKey="Nuevo" stackId="a" fill={colors['Nuevo']} />
          <Bar dataKey="Cancelación" stackId="a" fill={colors['Cancelación']} />
          <Bar dataKey="Expansión" stackId="a" fill={colors['Expansión']} />
          <Bar dataKey="Contracción" stackId="a" fill={colors['Contracción']} />
          <Bar dataKey="Sin Cambio" stackId="a" fill={colors['Sin Cambio']} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MRRMovement;

