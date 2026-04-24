import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import './AdminModulePage.css';

const AdminModulePage = ({ title, description, priority, capabilities }) => {
  return (
    <section className="admin-module-page">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className={`admin-module-priority ${String(priority || '').toLowerCase()}`}>{priority}</span>
      </header>

      <div className="admin-module-grid">
        <article className="admin-module-card">
          <h2>Core Capabilities</h2>
          <ul>
            {capabilities.map((capability) => (
              <li key={capability}>
                <CheckCircle2 size={16} />
                <span>{capability}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="admin-module-card">
          <h2>Implementation Notes</h2>
          <p>
            This module is now part of the admin navigation and route pipeline.
            Connect backend APIs to replace seeded UI data where needed.
          </p>
          <div className="admin-module-tips">
            <span>Scalable structure</span>
            <span>Role-safe access</span>
            <span>API-ready</span>
          </div>
        </article>
      </div>
    </section>
  );
};

export default AdminModulePage;
