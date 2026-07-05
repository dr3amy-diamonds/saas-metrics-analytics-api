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
    if (numeroPagina >= 1 && numeroPagina <= totalPaginas) {
      setPaginaActual(numeroPagina);
    }
  };

  const manejarContactar = async (usuarioId) => {
    try {
      await axios.post('http://127.0.0.1:8000/metrics/action', {
        user_id: usuarioId,
        action_type: 'email_warning',
        status: 'sent'
      });

      setDatos(datosPrevios => {
        const clientesActualizados = datosPrevios.detalle_clientes.map(cliente => {
          if (cliente.id === usuarioId) {
            return {
              ...cliente,
              clase_css_gestion: 'sent',
              estado_gestion_exhibicion: 'ENVIADO: Alerta Correo'
            };
          }
          return cliente;
        });
        return { ...datosPrevios, detalle_clientes: clientesActualizados };
      });

    } catch (error) {
      console.error("Error al registrar la acción:", error);
      alert("No se pudo registrar la acción en el servidor corporativo.");
    }
  };

  const formatearUSD = (cantidad) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cantidad);
  };

  return (
    <div className="contenedor-dashboard">
      <header className="encabezado-dashboard">
        <div>
          <h1 className="titulo-dashboard">Centro de Mitigación de Abandono</h1>
          <p className="subtitulo-dashboard">Detección proactiva de inactividad y gestión de ingresos en riesgo</p>
        </div>
      </header>

      {/* Rejilla de Indicadores Clave (KPIs) */}
      <div className="rejilla-metricas">
        <div className="tarjeta-corporativa riesgo">
          <div className="envoltorio-icono alerta">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="etiqueta-metrica">Clientes Activos en Riesgo</p>
            <h2 className="valor-metrica">{totalRegistros}</h2>
          </div>
        </div>

        <div className="tarjeta-corporativa ingresos">
          <div className="envoltorio-icono dolar">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="etiqueta-metrica">Impacto Financiero (MRR en Riesgo)</p>
            <h2 className="valor-metrica">{formatearUSD(datos.resumen_ejecutivo.mrr_en_riesgo_usd)}</h2>
          </div>
        </div>
      </div>


      {/* Sección de la Tabla Analítica */}
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
                <th>Arquetipo de Comportamiento</th>
                <th>Plan Contratado</th>
                <th>Métricas de Abandono</th>
                <th>Acción de Retención</th>
              </tr>
            </thead>
            <tbody>
              {clientesActuales.map((c, i) => (
                <tr key={c.id || i} className="fila-tabla-interactiva">
                  <td>
                    <div className="celda-informacion-cliente">
                      <span className="nombre-cliente">{c.cliente}</span>
                      <span className="correo-cliente">{c.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`etiqueta-arquetipo ${c.clase_css_arquetipo}`}>
                      {c.arquetipo_exhibicion}
                    </span>
                  </td>
                  <td>
                    <div className="celda-plan">
                      <span className="nombre-plan">{c.plan}</span>
                    </div>
                  </td>
                  <td>
                    <div className="celda-actividad">
                      <span className="etiqueta-peligro">
                        {typeof c.dias_inactivo === 'number' ? `${c.dias_inactivo} days off` : c.dias_inactivo}
                      </span>
                      <span className="ultima-conexion">Última Conexión: {c.ultima_conexion}</span>
                    </div>
                  </td>
                  <td>
                    {c.clase_css_gestion === 'sin_gestionar' ? (
                      <button
                        className="boton-disparador-accion"
                        onClick={() => manejarContactar(c.id)}
                      >
                        <Mail size={14} style={{ marginRight: '6px' }} />
                        Contactar
                      </button>
                    ) : (
                      <span className={`etiqueta-gestionado ${c.clase_css_gestion}`}>
                        <UserCheck size={12} style={{ marginRight: '4px' }} />
                        {c.estado_gestion_exhibicion}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sistema de Navegación de Páginas Inteligente */}
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