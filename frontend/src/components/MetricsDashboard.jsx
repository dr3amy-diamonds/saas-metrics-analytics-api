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

  return (
    <div className={darkMode ? 'metrics-dashboard dashboard-dark' : 'metrics-dashboard dashboard-light'}>
      {/* Header */}
      <div className={darkMode ? 'dashboard-header header-dark' : 'dashboard-header header-light'}>
        <div className="header-content">
          <div>
            <h1 className={darkMode ? 'dashboard-title texto-dark' : 'dashboard-title texto-light'}>Analytics</h1>
            <p className={darkMode ? 'dashboard-subtitle texto-secundario-dark' : 'dashboard-subtitle texto-secundario-light'}>
              NimbusDocs · Vista ejecutiva de métricas SaaS
            </p>
          </div>
          <button
            className={darkMode ? 'dark-mode-toggle toggle-dark' : 'dark-mode-toggle toggle-light'}
            onClick={() => setDarkMode(!darkMode)}
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
          <h2 className={darkMode ? 'ltv-section-title texto-dark' : 'ltv-section-title texto-light'}>
            LTV por Plan
          </h2>
          <LTVCards darkMode={darkMode} />
        </section>
      </div>
    </div>
  );
};

export default MetricsDashboard;
