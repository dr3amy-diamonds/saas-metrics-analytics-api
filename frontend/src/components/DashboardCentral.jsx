import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, DollarSign } from 'lucide-react';
import '../styles/Dashboard.css';

const DashboardCentral = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/metrics/at-risk')
      .then(res => setData(res.data))
      .catch(err => console.error("Error al cargar:", err));
  }, []);

  if (!data) return <div style={{ padding: '2.5rem', color: '#64748b', fontFamily: 'sans-serif' }}>Cargando analítica corporativa...</div>;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Métricas de Riesgo y Retención</h1>

      {/* Grid de 2 Columnas Sincronizado */}
      <div className="metrics-grid">

        <div className="card-enterprise">
          <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <AlertTriangle color="#ef4444" size={24} />
          </div>
          <div>
            <p className="metric-label">Clientes en Riesgo</p>
            <h2 className="metric-value">{data.resumen_ejecutivo.total_clientes_en_riesgo}</h2>
          </div>
        </div>

        <div className="card-enterprise">
          <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <DollarSign color="#22c55e" size={24} />
          </div>
          <div>
            <p className="metric-label">MRR en Riesgo</p>
            <h2 className="metric-value">${data.resumen_ejecutivo.mrr_en_riesgo_usd.toLocaleString()}</h2>
          </div>
        </div>

      </div>

      {/* Tabla Corporativa */}
      <div className="table-container">
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Plan</th>
              <th>Estado de Inactividad</th>
            </tr>
          </thead>
          <tbody>
            {data.detalle_clientes.map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: '500', color: '#0f172a' }}>{c.cliente}</td>
                <td>{c.plan}</td>
                <td>
                  <span className="badge-danger">
                    {c.dias_inactivo} días inactivo
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardCentral;