import React, { useEffect, useState } from 'react';
import adminService from '../../services/admin.service';
import { Save, CheckCircle, AlertCircle, Globe, DollarSign, Lock, Bell, Zap, Eye, EyeOff, Copy } from 'lucide-react';
import { getCurrencySymbol, setUserCurrencyPreference } from '../../utils/currency';
import './AdminOperations.css';
import './Settings.css';

const Settings = () => {
  const [originalSettings, setOriginalSettings] = useState({});
  const [draftSettings, setDraftSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [rawConfig, setRawConfig] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSettingsOverview();
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleInputChange = (key, value, type) => {
    let finalValue = value;
    if (type === 'PERCENTAGE' || key.includes('PERCENT')) {
      const num = parseFloat(value);
      if (num < 0) finalValue = '0';
      if (num > 100) finalValue = '100';
    }
    setDraftSettings(prev => ({ ...prev, [key]: finalValue }));
  };

  const handleToggle = (key, currentValue) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    setDraftSettings(prev => ({ ...prev, [key]: newValue }));
  };

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
      showToast('✅ System Settings Updated Successfully!');

      window.dispatchEvent(new Event('settingsUpdated'));

      // ✅ FIX: Update currency both in localStorage and dispatch event
      if (dirty.PLATFORM_CURRENCY) {
        const newCurrency = dirty.PLATFORM_CURRENCY;
        localStorage.setItem('platformCurrency', newCurrency);
        setUserCurrencyPreference(newCurrency);

        // Update CurrencyContext immediately via event
        window.dispatchEvent(new CustomEvent('currencyChanged', {
          detail: { currency: newCurrency }
        }));

        // Dispatch settingsUpdated event to ensure all components are notified
        window.dispatchEvent(new Event('settingsUpdated'));

        // Reload page to ensure all components reflect the change
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(draftSettings[key]);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div>Loading settings...</div>;

  const categories = {};
  rawConfig.forEach(s => {
    const cat = s.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(s);
  });

  const getCategoryIcon = (cat) => {
    const lower = cat.toLowerCase();
    if (lower.includes('pricing') || lower.includes('revenue')) return <DollarSign size={24} />;
    if (lower.includes('automation')) return <Zap size={24} />;
    if (lower.includes('default') || lower.includes('localization')) return <Globe size={24} />;
    if (lower.includes('security')) return <Lock size={24} />;
    if (lower.includes('notification')) return <Bell size={24} />;
    return <Zap size={24} />;
  };

  const getCategoryColor = (cat) => {
    const lower = cat.toLowerCase();
    if (lower.includes('pricing')) return { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' };
    if (lower.includes('automation')) return { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' };
    if (lower.includes('default')) return { bg: '#dcfce7', border: '#22c55e', text: '#166534' };
    if (lower.includes('security')) return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' };
    return { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' };
  };

  return (
    <section className="settings-page">
      <header className="settings-header">
        <div className="settings-title">
          <h1>⚙️ Platform Settings</h1>
          <p>Manage system configuration, currencies, and platform-wide defaults</p>
        </div>
        <button
          className="settings-save-btn"
          onClick={onSave}
          disabled={saving}
        >
          <Save size={18} />
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </header>

      {toast && (
        <div className={`settings-toast settings-toast-${toast.type}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <strong>{toast.message}</strong>
        </div>
      )}

      {rawConfig && rawConfig.length > 0 ? (
        <div className="settings-grid">
          {Object.entries(categories).map(([category, settingsList]) => {
            const colors = getCategoryColor(category);
            return (
              <div key={category} className="settings-category-card">
                <div className="settings-category-header" style={{ borderLeftColor: colors.border }}>
                  <div className="settings-category-icon" style={{ background: colors.bg, color: colors.text }}>
                    {getCategoryIcon(category)}
                  </div>
                  <div className="settings-category-title">
                    <h2>{category}</h2>
                    <p>{settingsList.length} setting{settingsList.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="settings-fields">
                  {settingsList.map(setting => {
                    const value = draftSettings[setting.key] !== undefined ? draftSettings[setting.key] : '';
                    const isBoolean = setting.type === 'BOOLEAN' || setting.key.includes('AUTO_');
                    const isEnum = setting.key === 'PLATFORM_LOCALE' || setting.key === 'PLATFORM_CURRENCY';
                    const isNumber = setting.type === 'NUMBER' || setting.key.includes('PERCENT');
                    const isDirty = draftSettings[setting.key] !== originalSettings[setting.key];

                    return (
                      <div key={setting.key} className={`settings-field ${isDirty ? 'dirty' : ''}`}>
                        <div className="settings-field-header">
                          <label className="settings-field-label">
                            {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            {isDirty && <span className="settings-dirty-badge">●</span>}
                          </label>
                          {setting.description && (
                            <small className="settings-field-description">{setting.description}</small>
                          )}
                        </div>

                        <div className="settings-field-control">
                          {isBoolean ? (
                            <div className="settings-toggle-wrapper">
                              <div
                                className={`settings-toggle ${value === 'true' ? 'active' : ''}`}
                                onClick={() => setting.isEditable && handleToggle(setting.key, value)}
                                style={{ cursor: setting.isEditable ? 'pointer' : 'not-allowed', opacity: setting.isEditable ? 1 : 0.5 }}
                              >
                                <div className="settings-toggle-thumb" />
                              </div>
                              <span className="settings-toggle-label">{value === 'true' ? 'Enabled' : 'Disabled'}</span>
                            </div>
                          ) : isEnum ? (
                            <div className="settings-select-wrapper">
                              <select
                                value={value}
                                onChange={(e) => handleInputChange(setting.key, e.target.value)}
                                disabled={!setting.isEditable}
                                className="settings-select"
                              >
                                {setting.key === 'PLATFORM_LOCALE' ? (
                                  <>
                                    <option value="en-IN">🇮🇳 en-IN (India)</option>
                                    <option value="en-US">🇺🇸 en-US (United States)</option>
                                  </>
                                ) : setting.key === 'PLATFORM_CURRENCY' ? (
                                  <>
                                    <option value="INR">🇮🇳 INR ({getCurrencySymbol('INR')})</option>
                                    <option value="USD">🇺🇸 USD ({getCurrencySymbol('USD')})</option>
                                    <option value="EUR">🇪🇺 EUR ({getCurrencySymbol('EUR')})</option>
                                    <option value="GBP">🇬🇧 GBP ({getCurrencySymbol('GBP')})</option>
                                    <option value="JPY">🇯🇵 JPY ({getCurrencySymbol('JPY')})</option>
                                    <option value="AUD">🇦🇺 AUD ({getCurrencySymbol('AUD')})</option>
                                    <option value="CAD">🇨🇦 CAD ({getCurrencySymbol('CAD')})</option>
                                  </>
                                ) : (
                                  <option value={value}>{value}</option>
                                )}
                              </select>
                              <Eye size={16} className="settings-select-icon" />
                            </div>
                          ) : (
                            <div className="settings-input-wrapper">
                              <input
                                type={isNumber ? 'number' : 'text'}
                                value={value}
                                onChange={(e) => handleInputChange(setting.key, e.target.value, setting.type || (isNumber ? 'PERCENTAGE' : 'STRING'))}
                                disabled={!setting.isEditable}
                                className="settings-input"
                                step={isNumber ? 'any' : undefined}
                                min={isNumber ? 0 : undefined}
                                max={isNumber && setting.key.includes('PERCENT') ? 100 : undefined}
                              />
                              {setting.isEditable && (
                                <button
                                  className="settings-copy-btn"
                                  onClick={() => copyToClipboard(setting.key)}
                                  title="Copy value"
                                >
                                  {copiedKey === setting.key ? <CheckCircle size={16} /> : <Copy size={16} />}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="settings-empty">
          <div className="settings-empty-icon">⚙️</div>
          <p>No configuration settings found in the database.</p>
        </div>
      )}
    </section>
  );
};

export default Settings;

