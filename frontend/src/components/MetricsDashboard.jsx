import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import KPICards from './KPICards';
import MRRTendencia from './MRRTendencia';
import ChurnTendencia from './ChurnTendencia';
import MRRMovement from './MRRMovement';
import ChurnPorPlan from './ChurnPorPlan';
import LTVCards from './LTVCards';
import '../styles/MetricsDashboard.css';

const MetricsDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);

  const bgPrimary = darkMode ? '#0f172a' : '#f8fafc';
  const bgSecondary = darkMode ? '#1e293b' : '#ffffff';
  const textPrimary = darkMode ? '#f1f5f9' : '#0f172a';
  const textSecondary = darkMode ? '#94a3b8' : '#64748b';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';

  return (
    <div className="metrics-dashboard" style={{ backgroundColor: bgPrimary }}>
      {/* Header */}
      <div className="dashboard-header" style={{ backgroundColor: bgSecondary, borderBottom: `1px solid ${borderColor}` }}>
        <div className="header-content">
          <div>
            <h1 className="dashboard-title" style={{ color: textPrimary }}>Analytics</h1>
            <p className="dashboard-subtitle" style={{ color: textSecondary }}>
              NimbusDocs · Vista ejecutiva de métricas SaaS
            </p>
          </div>
          <button
            className="dark-mode-toggle"
            onClick={() => setDarkMode(!darkMode)}
            style={{
              backgroundColor: darkMode ? '#334155' : '#e2e8f0',
              color: darkMode ? '#fbbf24' : '#f59e0b',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Fila 1: KPI Cards */}
        <section className="dashboard-section">
          <KPICards darkMode={darkMode} />
        </section>

        {/* Fila 2: MRR Tendencia y Churn Tendencia lado a lado */}
        <section className="dashboard-row-two-columns">
          <div className="column-60">
            <MRRTendencia darkMode={darkMode} />
          </div>
          <div className="column-40">
            <ChurnTendencia darkMode={darkMode} />
          </div>
        </section>

        {/* Fila 3: MRR Movement y Churn por Plan lado a lado */}
        <section className="dashboard-row-two-columns">
          <div className="column-50">
            <MRRMovement darkMode={darkMode} />
          </div>
          <div className="column-50">
            <ChurnPorPlan darkMode={darkMode} />
          </div>
        </section>

        {/* Fila 4: LTV Cards */}
        <section className="dashboard-section">
          <h2 style={{ color: textPrimary, marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
            LTV por Plan
          </h2>
          <LTVCards darkMode={darkMode} />
        </section>
      </div>
    </div>
  );
};

export default MetricsDashboard;
