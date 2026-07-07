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
import '../styles/MRRTendencia.css';

const MRRTendencia = ({ darkMode }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/metrics/mrr')
      .then(res => {
        const datosFormateados = res.data.map(item => ({
          ...item,
          mrr_total: Number.parseFloat(item.mrr_total),
          mes_formateado: new Date(item.mes).toLocaleDateString('es-ES', {
            month: 'short',
            year: '2-digit'
          })
        }));
        setDatos(datosFormateados);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar tendencia de MRR:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={darkMode ? 'mrr-tendencia-card card-dark' : 'mrr-tendencia-card card-light'}>
        <h3 className={darkMode ? 'titulo-grafica texto-dark' : 'titulo-grafica texto-light'}>Tendencia de MRR</h3>
        <div className={darkMode ? 'estado-carga cargando-dark' : 'estado-carga cargando-light'}>Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={darkMode ? 'mrr-tendencia-card card-dark' : 'mrr-tendencia-card card-light'}>
        <h3 className={darkMode ? 'titulo-grafica texto-dark' : 'titulo-grafica texto-light'}>Tendencia de MRR</h3>
        <div className="estado-error error-carga">No se pudieron cargar los datos</div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'mrr-tendencia-card card-dark' : 'mrr-tendencia-card card-light'}>
      <h3 className={darkMode ? 'titulo-grafica texto-dark' : 'titulo-grafica texto-light'}>Tendencia de MRR</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
          <XAxis
            dataKey="mes_formateado"
            stroke={darkMode ? '#94a3b8' : '#64748b'}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={darkMode ? '#94a3b8' : '#64748b'}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value) => [`$${value.toLocaleString()}`, 'MRR']}
            contentStyle={{
              borderRadius: '8px',
              backgroundColor: darkMode ? '#334155' : '#ffffff',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              color: darkMode ? '#f1f5f9' : '#0f172a'
            }}
          />
          <Line
            type="monotone"
            dataKey="mrr_total"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MRRTendencia;