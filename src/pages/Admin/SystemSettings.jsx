import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'SkillForge',
    siteDescription: 'AI Learning Platform',
    allowRegistration: true,
    defaultRole: 'STUDENT',
    maxFileSize: 10, // MB
    sessionTimeout: 30, // minutes
    emailNotifications: true,
    maintenanceMode: false,
    geminiApiKey: '',
    maxQuizAttempts: 3,
    quizTimeLimit: 60, // minutes
    autoGrading: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings({ ...settings, ...response.data });
    } catch (error) {
      console.error('Settings API Error:', error);
      toast.error('Failed to load system settings: ' + (error.response?.data || error.message));
      // Keep default settings if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        siteName: 'SkillForge',
        siteDescription: 'AI Learning Platform',
        allowRegistration: true,
        defaultRole: 'STUDENT',
        maxFileSize: 10,
        sessionTimeout: 30,
        emailNotifications: true,
        maintenanceMode: false,
        geminiApiKey: '',
        maxQuizAttempts: 3,
        quizTimeLimit: 60,
        autoGrading: true
      });
    }
  };

  const clearCache = async () => {
    try {
      await api.post('/admin/clear-cache');
      toast.success('Cache cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const runSystemCheck = async () => {
    try {
      const response = await api.get('/admin/system-check');
      toast.success(`System check completed. Status: ${response.data.status}`);
    } catch (error) {
      toast.error('System check failed');
    }
  };

  if (loading) return <div className="text-center py-10">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <div className="space-x-2">
          <button
            onClick={handleReset}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows="3"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowRegistration"
                checked={settings.allowRegistration}
                onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="allowRegistration" className="text-sm font-medium text-gray-700">
                Allow new user registration
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default User Role</label>
              <select
                value={settings.defaultRole}
                onChange={(e) => setSettings({ ...settings, defaultRole: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min="5"
                max="480"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (MB)</label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min="1"
                max="100"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                Enable email notifications
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                Maintenance mode
              </label>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">AI Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter your Gemini API key"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for AI-powered quiz generation and explanations
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoGrading"
                checked={settings.autoGrading}
                onChange={(e) => setSettings({ ...settings, autoGrading: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="autoGrading" className="text-sm font-medium text-gray-700">
                Enable automatic grading
              </label>
            </div>
          </div>
        </div>

        {/* Quiz Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quiz Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Quiz Attempts</label>
              <input
                type="number"
                value={settings.maxQuizAttempts}
                onChange={(e) => setSettings({ ...settings, maxQuizAttempts: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Quiz Time Limit (minutes)</label>
              <input
                type="number"
                value={settings.quizTimeLimit}
                onChange={(e) => setSettings({ ...settings, quizTimeLimit: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
                min="5"
                max="180"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">System Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={clearCache}
            className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded hover:bg-yellow-200"
          >
            🗑️ Clear System Cache
          </button>
          <button
            onClick={runSystemCheck}
            className="bg-green-100 text-green-800 px-4 py-3 rounded hover:bg-green-200"
          >
            ✅ Run System Check
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-100 text-blue-800 px-4 py-3 rounded hover:bg-blue-200"
          >
            🔄 Restart Application
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">System Information</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Version:</strong> 1.0.0
          </div>
          <div>
            <strong>Environment:</strong> Development
          </div>
          <div>
            <strong>Database:</strong> Connected
          </div>
          <div>
            <strong>Last Backup:</strong> Never
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
