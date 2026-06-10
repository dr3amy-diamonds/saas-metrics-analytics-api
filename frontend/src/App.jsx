import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, Activity } from 'lucide-react';
import DashboardCentral from './components/DashboardCentral';

function App() {
  return (
    <Router>
      {/* Contenedor principal a pantalla completa */}
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f8fafc' }}>

        {/* SIDEBAR FIJO A LA IZQUIERDA */}
        <nav style={{
          width: '260px',
          minWidth: '260px', /* Evita que el menú se encoja */
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '2.5rem', color: '#0f172a', fontFamily: 'sans-serif' }}>
            SaaS Analytics
          </h2>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#0f172a', textDecoration: 'none', fontWeight: '600', fontFamily: 'sans-serif', backgroundColor: '#f1f5f9' }}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/users" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#475569', textDecoration: 'none', fontWeight: '500', fontFamily: 'sans-serif' }}>
                <Users size={18} /> Usuarios
              </Link>
            </li>
            <li>
              <Link to="/activity" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#475569', textDecoration: 'none', fontWeight: '500', fontFamily: 'sans-serif' }}>
                <Activity size={18} /> Logs Actividad
              </Link>
            </li>
            <li>
              <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#475569', textDecoration: 'none', fontWeight: '500', fontFamily: 'sans-serif' }}>
                <Settings size={18} /> Ajustes
              </Link>
            </li>
          </ul>
        </nav>

        {/* CONTENIDO CENTRAL INDEPENDIENTE A LA DERECHA */}
        <main style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
          <Routes>
            <Route path="/" element={<DashboardCentral />} />
            <Route path="/users" element={<div style={{ padding: '2.5rem', color: '#64748b' }}>Módulo de Usuarios en construcción...</div>} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;