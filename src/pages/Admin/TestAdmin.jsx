import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const TestAdmin = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testEndpoints = async () => {
    setLoading(true);
    const results = {};

    // Test basic admin endpoint
    try {
      const response = await api.get('/admin/test');
      results.test = { success: true, data: response.data };
    } catch (error) {
      results.test = { success: false, error: error.message };
    }

    // Test users endpoint
    try {
      const response = await api.get('/admin/users');
      results.users = { success: true, count: response.data?.length || 0 };
    } catch (error) {
      results.users = { success: false, error: error.message };
    }

    // Test courses endpoint
    try {
      const response = await api.get('/admin/courses');
      results.courses = { success: true, count: response.data?.length || 0 };
    } catch (error) {
      results.courses = { success: false, error: error.message };
    }

    // Test reports endpoint
    try {
      const response = await api.get('/admin/reports');
      results.reports = { success: true, data: 'Reports loaded' };
    } catch (error) {
      results.reports = { success: false, error: error.message };
    }

    // Test settings endpoint
    try {
      const response = await api.get('/admin/settings');
      results.settings = { success: true, data: 'Settings loaded' };
    } catch (error) {
      results.settings = { success: false, error: error.message };
    }

    setTestResult(results);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Endpoints Test</h1>
        <button
          onClick={testEndpoints}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test All Endpoints'}
        </button>
      </div>

      {testResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <div className="space-y-3">
            {Object.entries(testResult).map(([endpoint, result]) => (
              <div key={endpoint} className="flex justify-between items-center p-3 border rounded">
                <span className="font-medium">/admin/{endpoint}</span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                  {result.success && result.count !== undefined && (
                    <span className="text-sm text-gray-600">({result.count} items)</span>
                  )}
                  {!result.success && (
                    <span className="text-sm text-red-600">{result.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Troubleshooting Steps:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Make sure the backend server is running on port 8080</li>
          <li>Check that you're logged in as an admin user</li>
          <li>Verify the JWT token is valid and not expired</li>
          <li>Check browser console for detailed error messages</li>
          <li>Ensure CORS is properly configured for localhost:3000</li>
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Expected Endpoints:</h3>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>GET /api/admin/test - Basic connectivity test</li>
          <li>GET /api/admin/users - List all users</li>
          <li>GET /api/admin/courses - List all courses</li>
          <li>GET /api/admin/reports - Platform reports</li>
          <li>GET /api/admin/settings - System settings</li>
        </ul>
      </div>
    </div>
  );
};

export default TestAdmin;
