import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShieldAlert, Users, Activity, Settings } from 'lucide-react';
import MetricsDashboard from './components/MetricsDashboard';
import DashboardCentral from './components/DashboardCentral';
import React, { useState } from 'react';

// NavItem: componente auxiliar para un único botón del sidebar
function NavItem({ icon, label, to, disabled }) {
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  const containerBase = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontFamily: 'sans-serif',
    fontSize: '0.925rem',
    transition: 'background-color 0.15s ease'
  };

  const leftPart = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  if (disabled) {
    return (
      <div style={{ ...containerBase, opacity: 0.45, cursor: 'not-allowed' }}>
        <div style={leftPart}>
          {icon}
          <span>{label}</span>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#94a3b8', backgroundColor: '#f1f5f9', borderRadius: '4px', padding: '2px 6px' }}>Próximamente</div>
      </div>
    );
  }

  const isActive = location.pathname === to;

  const activeStyles = isActive
    ? { backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600 }
    : hovered
      ? { backgroundColor: '#f8fafc' }
      : { color: '#475569', fontWeight: 500 };

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...containerBase, cursor: 'pointer', ...activeStyles }}
    >
      <div style={leftPart}>
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
}

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f8fafc' }}>

        <nav style={{ width: '260px', minWidth: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '2.5rem', color: '#0f172a', fontFamily: 'sans-serif' }}>
            SaaS Analytics
          </h2>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <NavItem icon={<LayoutDashboard size={18} />} label="Analytics" to="/" disabled={false} />
            </li>
            <li>
              <NavItem icon={<ShieldAlert size={18} />} label="Mitigación" to="/mitigacion" disabled={false} />
            </li>
            <li>
              <NavItem icon={<Users size={18} />} label="Usuarios" to="/usuarios" disabled={true} />
            </li>
            <li>
              <NavItem icon={<Activity size={18} />} label="Logs Actividad" to="/actividad" disabled={true} />
            </li>
            <li>
              <NavItem icon={<Settings size={18} />} label="Ajustes" to="/ajustes" disabled={true} />
            </li>
          </ul>
        </nav>

        <main style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
          <Routes>
            <Route path="/" element={<MetricsDashboard />} />
            <Route path="/mitigacion" element={<DashboardCentral />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;