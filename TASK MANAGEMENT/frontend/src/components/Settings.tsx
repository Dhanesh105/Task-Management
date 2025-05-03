import React, { useEffect, useState } from 'react';
import { useSettingsStore, Settings } from '../store/settingsStore';

const SettingsComponent: React.FC = () => {
  const { settings, isLoading, error, fetchSettings, updateSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setLocalSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'startDayOfWeek' 
          ? parseInt(value, 10) 
          : value
    }));
  };

  const handleThemeChange = (theme: Settings['theme']) => {
    setLocalSettings(prev => ({
      ...prev,
      theme
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateSettings(localSettings);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      
      // Add this to verify settings were updated
      console.log('Settings updated:', localSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !localSettings) {
    return <div className="loading-spinner">Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <h2 className="section-title">Settings</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h3 className="subsection-title">Appearance</h3>
          
          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <div className="theme-selector-container">
              <div className="theme-selector">
                {['light', 'dark', 'system'].map((theme) => (
                  <div 
                    key={theme}
                    className={`theme-option ${localSettings.theme === theme ? 'active' : ''}`}
                    onClick={() => handleThemeChange(theme as Settings['theme'])}
                  >
                    <div className={`theme-preview ${theme}`}></div>
                    <div className="theme-label">
                      {theme === 'light' ? 'Light' : 
                       theme === 'dark' ? 'Dark' : 
                       'System Default'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h3 className="subsection-title">Preferences</h3>
          
          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select 
              id="language" 
              name="language" 
              value={localSettings.language} 
              onChange={handleChange}
              className="form-control"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          
          <div className="form-group checkbox-group">
            <label htmlFor="notifications" className="checkbox-label">
              <input 
                type="checkbox" 
                id="notifications" 
                name="notifications" 
                checked={localSettings.notifications} 
                onChange={handleChange}
                className="checkbox-input"
              />
              <span>Enable Notifications</span>
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="defaultView">Default View</label>
            <select 
              id="defaultView" 
              name="defaultView" 
              value={localSettings.defaultView} 
              onChange={handleChange}
              className="form-control"
            >
              <option value="tasks">Tasks</option>
              <option value="calendar">Calendar</option>
              <option value="statistics">Statistics</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h3 className="subsection-title">Date & Time</h3>
          
          <div className="form-group">
            <label htmlFor="dateFormat">Date Format</label>
            <select 
              id="dateFormat" 
              name="dateFormat" 
              value={localSettings.dateFormat} 
              onChange={handleChange}
              className="form-control"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="timeFormat">Time Format</label>
            <select 
              id="timeFormat" 
              name="timeFormat" 
              value={localSettings.timeFormat} 
              onChange={handleChange}
              className="form-control"
            >
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="startDayOfWeek">Start Day of Week</label>
            <select 
              id="startDayOfWeek" 
              name="startDayOfWeek" 
              value={localSettings.startDayOfWeek} 
              onChange={handleChange}
              className="form-control"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('Failed') ? 'error' : 'success'}`}>
            {saveMessage}
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsComponent;