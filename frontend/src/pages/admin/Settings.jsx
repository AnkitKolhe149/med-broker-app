import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import './AdminOperations.css';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await adminService.getSettingsOverview();
        setSettings(response?.data || null);
      } catch (error) {
        console.error('Failed to load settings overview', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading settings...</div>;
  if (!settings) return <div className="admin-error">Unable to load settings overview.</div>;

  return (
    <section className="admin-ops-page">
      <header className="page-header">
        <div>
          <h1>System Settings</h1>
          <p>Global defaults and platform controls currently applied in the system.</p>
        </div>
      </header>

      <div className="admin-ops-summary">
        <div className="admin-ops-summary-card"><h4>Default Currency</h4><p>{settings.defaults?.currency || 'INR'}</p></div>
        <div className="admin-ops-summary-card"><h4>Default Locale</h4><p>{settings.defaults?.locale || 'en-IN'}</p></div>
        <div className="admin-ops-summary-card"><h4>Tax Rate</h4><p>{settings.pricing?.taxPercent || 0}%</p></div>
        <div className="admin-ops-summary-card"><h4>Auto Reprice</h4><p>{settings.pricing?.autoReprice ? 'Enabled' : 'Disabled'}</p></div>
      </div>

      <div className="admin-ops-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Configuration</th>
              <th>Value</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Default Currency</td>
              <td>{settings.defaults?.currency || 'INR'}</td>
              <td>Localization</td>
            </tr>
            <tr>
              <td>Default Locale</td>
              <td>{settings.defaults?.locale || 'en-IN'}</td>
              <td>Localization</td>
            </tr>
            <tr>
              <td>Tax Percent</td>
              <td>{settings.pricing?.taxPercent || 0}%</td>
              <td>Pricing</td>
            </tr>
            <tr>
              <td>Maximum Discount</td>
              <td>{settings.pricing?.maxDiscountPercent || 0}%</td>
              <td>Pricing</td>
            </tr>
            <tr>
              <td>Base Markup</td>
              <td>{settings.pricing?.baseMarkupPercent || 0}%</td>
              <td>Pricing</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Settings;
