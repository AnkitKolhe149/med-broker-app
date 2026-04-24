import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const Integrations = () => {
  const [integrationData, setIntegrationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState({});

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

  const handleToggle = async (item) => {
    const action = item.connected ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} the "${item.name}" integration?`)) return;
    setToggleLoading((p) => ({ ...p, [item.key]: true }));
    try {
      await adminService.toggleIntegration(item.key, !item.connected);
      setIntegrationData((prev) => {
        const updated = prev.integrations.map((i) =>
          i.key === item.key ? { ...i, connected: !i.connected } : i
        );
        const connected = updated.filter((i) => i.connected).length;
        const disconnected = updated.length - connected;
        return {
          ...prev,
          integrations: updated,
          summary: { ...prev.summary, connected, disconnected },
        };
      });
    } catch (e) {
      alert(e?.response?.data?.message || `Failed to ${action} integration.`);
    } finally {
      setToggleLoading((p) => ({ ...p, [item.key]: false }));
    }
  };

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
        <div className="admin-ops-summary-card">
          <h4>Last Check</h4>
          <p>{integrationData.summary?.checkedAt ? new Date(integrationData.summary.checkedAt).toLocaleString() : '-'}</p>
        </div>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Integration</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {(integrationData.integrations || []).map((item) => (
              <tr key={item.key}>
                <td><strong>{item.name}</strong></td>
                <td>
                  <span className={`admin-pill ${item.connected ? 'succeeded' : 'failed'}`}>
                    {item.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </td>
                <td>{item.note || '-'}</td>
                <td>
                  <label className="admin-toggle-switch" title={item.connected ? 'Disable' : 'Enable'}>
                    <input
                      id={`integration-toggle-${item.key}`}
                      type="checkbox"
                      checked={!!item.connected}
                      disabled={!!toggleLoading[item.key]}
                      onChange={() => handleToggle(item)}
                    />
                    <span className="admin-toggle-slider">
                      {toggleLoading[item.key] && <span className="btn-spinner toggle-spinner" />}
                    </span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Integrations;
