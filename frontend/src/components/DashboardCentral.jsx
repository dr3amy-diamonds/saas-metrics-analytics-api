import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, DollarSign, ChevronLeft, ChevronRight, UserCheck, Mail } from 'lucide-react';
import '../styles/Dashboard.css';

const DashboardCentral = () => {
  const [datos, setDatos] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/metrics/at-risk')
      .then(res => {
        setDatos(res.data);
        setPaginaActual(1);
      })
      .catch(err => console.error("Error al cargar la analítica:", err));
  }, []);

  if (!datos) {
    return (
      <div className="contenedor-carga">
        <div className="rueda-carga"></div>
        <p>Cargando analítica corporativa y análisis de riesgo...</p>
      </div>
    );
  }

  const totalRegistros = datos.detalle_clientes.length;
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

  const indiceUltimoRegistro = paginaActual * registrosPorPagina;
  const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
  const clientesActuales = datos.detalle_clientes.slice(indicePrimerRegistro, indiceUltimoRegistro);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const formatearUSD = (cantidad) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cantidad);
  };

  return (
    <div className="contenedor-dashboard">
      <div className="encabezado-dashboard">
        <h1 className="titulo-dashboard">Panel de Riesgo y Retención</h1>
        <p className="subtitulo-dashboard">
          Análisis predictivo de clientes en riesgo de abandono involuntario o baja actividad
        </p>
      </div>

      {/* Resumen de Métricas Críticas */}
      <div className="kpi-cards-grid" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="kpi-card card-light" style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="kpi-label" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>MRR EN RIESGO TOTAL</span>
            <DollarSign size={18} style={{ color: '#ef4444' }} />
          </div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {formatearUSD(datos.resumen_ejecutivo?.mrr_en_riesgo_usd || 0)}
          </div>
        </div>

        <div className="kpi-card card-light" style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="kpi-label" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>CLIENTES BAJO ANÁLISIS</span>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {totalRegistros}
          </div>
        </div>
      </div>

      {/* Listado Detallado de Clientes */}
      <div className="seccion-tabla" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
              <th style={{ padding: '1rem' }}>Cliente</th>
              <th style={{ padding: '1rem' }}>Plan Actual</th>
              <th style={{ padding: '1rem' }}>Impacto MRR</th>
              <th style={{ padding: '1rem' }}>Indicador de Alerta</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesActuales.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.95rem', color: '#0f172a' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{c.cliente}</td>
                <td style={{ padding: '1rem' }}>{c.plan_name || c.plan}</td>
                <td style={{ padding: '1rem', fontWeight: '600' }}>
                  {formatearUSD(c.monthly_price || 0)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className="badge-inactividad" style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.85rem', fontWeight: '500' }}>
                    {c.dias_inactivo} días inactivo
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                    <Mail size={14} /> Contactar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Componente de Paginación */}
        {totalPaginas > 1 && (
          <div className="contenedor-paginacion" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <button
              className="boton-paginacion"
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <div className="pastillas-indicadoras-pagina">
              {paginaActual > 2 && (
                <>
                  <button className="pastilla-pagina" onClick={() => cambiarPagina(1)}>1</button>
                  {paginaActual > 3 && <span className="puntos-suspensivos-pagina">...</span>}
                </>
              )}

              {Array.from({ length: totalPaginas }, (_, idx) => idx + 1)
                .filter(pagina => Math.abs(pagina - paginaActual) <= 1)
                .map(pagina => (
                  <button
                    key={pagina}
                    className={`pastilla-pagina ${paginaActual === pagina ? 'activa' : ''}`}
                    onClick={() => cambiarPagina(pagina)}
                  >
                    {pagina}
                  </button>
                ))
              }

              {paginaActual < totalPaginas - 1 && (
                <>
                  {paginaActual < totalPaginas - 2 && <span className="puntos-suspensivos-pagina">...</span>}
                  <button className="pastilla-pagina" onClick={() => cambiarPagina(totalPaginas)}>{totalPaginas}</button>
                </>
              )}
            </div>

            <button
              className="boton-paginacion"
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCentral;