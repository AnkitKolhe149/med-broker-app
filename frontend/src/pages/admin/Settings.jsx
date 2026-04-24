import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import './AdminOperations.css';

const Settings = () => {
  const [originalSettings, setOriginalSettings] = useState({});
  const [draftSettings, setDraftSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [rawConfig, setRawConfig] = useState([]);

  useEffect(() => {
    loadSettings();
  }, []);

  // Fetch settings from the database and hydrate local state
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettingsOverview();
      // Safely extract the raw array depending on backend response structure
      const raw = data?.data?.raw || data?.raw || [];
      setRawConfig(raw);

      const map = {};
      raw.forEach(s => { map[s.key] = s.value; });
      setOriginalSettings(map);
      setDraftSettings(map);
    } catch (error) {
      showToast('Error loading settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger auto-hiding toast notifications for user feedback
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle standard input changes with real-world clamping for percentages
  const handleInputChange = (key, value, type) => {
    let finalValue = value;
    // Real-world validation: Prevent negative numbers and cap at 100%
    if (type === 'PERCENTAGE' || key.includes('PERCENT')) {
      const num = parseFloat(value);
      if (num < 0) finalValue = '0';
      if (num > 100) finalValue = '100';
    }
    setDraftSettings(prev => ({ ...prev, [key]: finalValue }));
  };

  // Handle custom boolean toggle switches
  const handleToggle = (key, currentValue) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    setDraftSettings(prev => ({ ...prev, [key]: newValue }));
  };

  // Calculate dirty fields and send PATCH request to backend
  const onSave = async () => {
    const dirty = {};
    Object.keys(draftSettings).forEach(key => {
      if (draftSettings[key] !== originalSettings[key]) {
        dirty[key] = draftSettings[key].toString();
      }
    });

    if (Object.keys(dirty).length === 0) {
      showToast('No changes to save', 'info');
      return;
    }

    try {
      setSaving(true);
      await adminService.updateSettings(dirty);
      setOriginalSettings(draftSettings);
      showToast('System Settings Synced Successfully!');

      // Trigger dashboard update event instantly
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (error) {
      showToast(error.response?.data?.message || 'Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading settings...</div>;

  // Group by category
  const categories = {};
  rawConfig.forEach(s => {
    const cat = s.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(s);
  });

  const getCategoryIcon = (cat) => {
    const lower = cat.toLowerCase();
    if (lower.includes('pricing') || lower.includes('revenue')) return '💰';
    if (lower.includes('automation')) return '🤖';
    if (lower.includes('default') || lower.includes('localization')) return '⚙️';
    return '🔧';
  };

  return (
    <section className="admin-ops-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>System Settings</h1>
          <p>Global defaults and platform controls currently applied in the system.</p>
        </div>
        <button
          className="admin-save-btn"
          onClick={onSave}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#157347', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save & Sync'}
        </button>
      </header>

      {toast && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', background: toast.type === 'error' ? '#fef2f2' : toast.type === 'info' ? '#f0f9ff' : '#ecfdf5', color: toast.type === 'error' ? '#991b1b' : toast.type === 'info' ? '#075985' : '#065f46', display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#a7f3d0'}` }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <strong>{toast.message}</strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {rawConfig && rawConfig.length > 0 ? (
          Object.entries(categories).map(([category, settingsList]) => (
            <div key={category} className="admin-dash-card" style={{ padding: '24px' }}>
              <h3 style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', color: '#1f2937' }}>
                <span>{getCategoryIcon(category)}</span> {category}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {settingsList.map(setting => {
                  const value = draftSettings[setting.key] !== undefined ? draftSettings[setting.key] : '';
                  const isBoolean = setting.type === 'BOOLEAN' || setting.key.includes('AUTO_');
                  const isEnum = setting.key === 'PLATFORM_LOCALE' || setting.key === 'PLATFORM_CURRENCY';
                  const isNumber = setting.type === 'NUMBER' || setting.key.includes('PERCENT');

                  return (
                    <div key={setting.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151' }}>
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>

                      {isBoolean ? (
                        <div
                          onClick={() => setting.isEditable && handleToggle(setting.key, value)}
                          style={{ width: '48px', height: '26px', background: value === 'true' ? '#157347' : '#d1d5db', borderRadius: '13px', position: 'relative', cursor: setting.isEditable ? 'pointer' : 'not-allowed', transition: 'background 0.3s' }}
                        >
                          <div style={{ width: '22px', height: '22px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: value === 'true' ? '24px' : '2px', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                      ) : isEnum ? (
                        <select
                          value={value}
                          onChange={(e) => handleInputChange(setting.key, e.target.value)}
                          disabled={!setting.isEditable}
                          style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: setting.isEditable ? 'white' : '#f3f4f6', outline: 'none', color: '#111827', cursor: setting.isEditable ? 'pointer' : 'not-allowed' }}
                        >
                          {setting.key === 'PLATFORM_LOCALE' ? (
                            <>
                              <option value="en-IN">en-IN (India)</option>
                              <option value="en-US">en-US (United States)</option>
                            </>
                          ) : setting.key === 'PLATFORM_CURRENCY' ? (
                            <>
                              <option value="INR">INR (₹)</option>
                              <option value="USD">USD ($)</option>
                            </>
                          ) : (
                            <option value={value}>{value}</option>
                          )}
                        </select>
                      ) : (
                        <input
                          type={isNumber ? 'number' : 'text'}
                          value={value}
                          onChange={(e) => handleInputChange(setting.key, e.target.value, setting.type || (isNumber ? 'PERCENTAGE' : 'STRING'))}
                          disabled={!setting.isEditable}
                          style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: setting.isEditable ? 'white' : '#f3f4f6', outline: 'none', color: '#111827' }}
                          step={isNumber ? 'any' : undefined}
                          min={isNumber ? 0 : undefined}
                          max={isNumber && setting.key.includes('PERCENT') ? 100 : undefined}
                        />
                      )}
                      {setting.description && <small style={{ color: '#6b7280', fontSize: '0.78rem', lineHeight: '1.4' }}>{setting.description}</small>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', background: '#fff', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
            <p>No configuration settings found in the database.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Settings;
