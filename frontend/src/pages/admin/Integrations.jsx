import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const Integrations = () => {
  const [integrationData, setIntegrationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await adminService.getIntegrationsOverview();
        setIntegrationData(response?.data || null);
      } catch (error) {
        console.error('Failed to load integrations overview', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading integrations...</div>;
  if (!integrationData) return <div className="admin-error">Unable to load integrations overview.</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>Integrations</h1>
          <p>Operational status of external services and provider connectivity.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Connected</h4><p>{integrationData.summary?.connected || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Disconnected</h4><p>{integrationData.summary?.disconnected || 0}</p></div>
        <div className="admin-ops-summary-card"><h4>Last Check</h4><p>{integrationData.summary?.checkedAt ? new Date(integrationData.summary.checkedAt).toLocaleString() : '-'}</p></div>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Integration</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {(integrationData.integrations || []).map((item) => (
              <tr key={item.key}>
                <td>{item.name}</td>
                <td>
                  <span className={`status-pill ${item.connected ? 'completed' : 'rejected'}`}>
                    {item.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </td>
                <td>{item.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Integrations;
