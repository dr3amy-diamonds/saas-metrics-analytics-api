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

          datosMap[mesFormateado][item.categoria] = Number.parseFloat(item.cambio_neto_mrr);
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

  if (loading) {
    return (
      <div className={darkMode ? 'mrr-movement-card card-dark' : 'mrr-movement-card card-light'}>
        <h3 className={darkMode ? 'titulo-grafica texto-dark' : 'titulo-grafica texto-light'}>Movimiento de MRR</h3>
        <div className={darkMode ? 'estado-carga cargando-dark' : 'estado-carga cargando-light'}>Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={darkMode ? 'mrr-movement-card card-dark' : 'mrr-movement-card card-light'}>
        <h3 className={darkMode ? 'titulo-grafica texto-dark' : 'titulo-grafica texto-light'}>Movimiento de MRR</h3>
        <div className="estado-error error-carga">No se pudieron cargar los datos</div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'mrr-movement-card card-dark' : 'mrr-movement-card card-light'}>
      <h3 className={darkMode ? 'titulo-grafica texto-dark' : 'titulo-grafica texto-light'}>Movimiento de MRR</h3>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
          <XAxis
            dataKey="mes"
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
            formatter={(value) => `$${value.toLocaleString()}`}
            contentStyle={{
              borderRadius: '8px',
              backgroundColor: darkMode ? '#334155' : '#ffffff',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              color: darkMode ? '#f1f5f9' : '#0f172a'
            }}
          />
          <Legend iconType="square" />
          <Bar dataKey="Nuevo" stackId="a" fill="#22c55e" />
          <Bar dataKey="Cancelación" stackId="a" fill="#ef4444" />
          <Bar dataKey="Expansión" stackId="a" fill="#3b82f6" />
          <Bar dataKey="Contracción" stackId="a" fill="#f97316" />
          <Bar dataKey="Sin Cambio" stackId="a" fill="#94a3b8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MRRMovement;

