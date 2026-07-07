import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, DollarSign, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
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

  // El precio mensual por cliente no viene en detalle_clientes
  // Se calcula dividiendo el MRR total en riesgo entre el total de clientes
  const mrrPorCliente = totalRegistros > 0
    ? (datos.resumen_ejecutivo?.mrr_en_riesgo_usd || 0) / totalRegistros
    : 0;

  return (
    <div className="contenedor-dashboard">
      <div className="encabezado-dashboard">
        <h1 className="titulo-dashboard">Panel de Riesgo y Retención</h1>
        <p className="subtitulo-dashboard">
          Análisis predictivo de clientes en riesgo de abandono involuntario o baja actividad
        </p>
      </div>

      {/* Resumen de Métricas Críticas */}
      <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MRR EN RIESGO TOTAL</span>
            <DollarSign size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {formatearUSD(datos.resumen_ejecutivo?.mrr_en_riesgo_usd || 0)}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CLIENTES BAJO ANÁLISIS</span>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            {totalRegistros}
          </div>
        </div>
      </div>

      {/* Listado Detallado de Clientes */}
      <div className="seccion-tabla">
        <div className="acciones-encabezado-tabla">
          <h3 className="subtitulo-seccion">Clientes con Inactividad Mayor a 15 Días</h3>
          <span className="contador-filas">
            Mostrando <strong>{indicePrimerRegistro + 1}-{Math.min(indiceUltimoRegistro, totalRegistros)}</strong> de <strong>{totalRegistros}</strong> clientes
          </span>
        </div>

        <div className="contenedor-tabla">
          <table className="tabla-corporativa">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plan Actual</th>
                <th>Arquetipo</th>
                <th>Indicador de Alerta</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesActuales.map((c, idx) => (
                <tr key={idx} className="fila-tabla-interactiva">
                  <td>
                    <div className="celda-informacion-cliente">
                      <span className="nombre-cliente">{c.cliente}</span>
                      <span className="correo-cliente">{c.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="celda-plan">
                      <span className="nombre-plan">{c.plan}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`etiqueta-arquetipo ${c.clase_css_arquetipo}`}>
                      {c.arquetipo_exhibicion}
                    </span>
                  </td>
                  <td>
                    <div className="celda-actividad">
                      <span className="etiqueta-peligro">
                        {typeof c.dias_inactivo === 'number' ? `${c.dias_inactivo} días inactivo` : c.dias_inactivo}
                      </span>
                      <span className="ultima-conexion">Última Conexión: {c.ultima_conexion}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="boton-disparador-accion">
                      <Mail size={14} style={{ marginRight: '6px' }} />
                      Contactar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="contenedor-paginacion">
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
