import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../auth/useAuth';

const CheckAuth = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [adminTest, setAdminTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentAuth();
  }, []);

  const checkCurrentAuth = async () => {
    try {
      // Test admin endpoint
      try {
        const adminResponse = await api.get('/admin/test');
        setAdminTest({ success: true, data: adminResponse.data });
      } catch (error) {
        setAdminTest({ success: false, error: error.response?.status || error.message });
      }

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        // Decode JWT token (simple base64 decode for payload)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setTokenInfo(payload);
        } catch (e) {
          setTokenInfo({ error: 'Invalid token format' });
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Authentication Debug</h1>

        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User (from useAuth)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <strong>Email:</strong> {user?.email || 'Not logged in'}
            </div>
            <div>
              <strong>Role:</strong> {user?.role || 'Unknown'}
            </div>
            <div>
              <strong>First Name:</strong> {user?.firstName || 'N/A'}
            </div>
            <div>
              <strong>Last Name:</strong> {user?.lastName || 'N/A'}
            </div>
          </div>
        </div>

        {/* JWT Token Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">JWT Token Info</h2>
          {tokenInfo ? (
            tokenInfo.error ? (
              <div className="text-red-600">{tokenInfo.error}</div>
            ) : (
              <div className="space-y-2">
                <div><strong>Subject (email):</strong> {tokenInfo.sub}</div>
                <div><strong>Issued At:</strong> {new Date(tokenInfo.iat * 1000).toLocaleString()}</div>
                <div><strong>Expires At:</strong> {new Date(tokenInfo.exp * 1000).toLocaleString()}</div>
                <div><strong>Is Expired:</strong> {Date.now() > tokenInfo.exp * 1000 ? 'Yes' : 'No'}</div>
                <div><strong>Authorities:</strong> {tokenInfo.authorities || 'Not found in token'}</div>
              </div>
            )
          ) : (
            <div className="text-gray-600">No token found</div>
          )}
        </div>

        {/* Admin Test Result */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Admin Endpoint Test</h2>
          {adminTest ? (
            adminTest.success ? (
              <div className="space-y-2">
                <div className="text-green-600 font-medium">✅ Admin access successful!</div>
                <div><strong>Current User:</strong> {adminTest.data.currentUser}</div>
                <div><strong>Authorities:</strong> {adminTest.data.authorities}</div>
                <div><strong>User Role:</strong> {adminTest.data.userRole}</div>
                <div><strong>Has Admin Role:</strong> {adminTest.data.hasAdminRole ? 'Yes' : 'No'}</div>
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Admin access failed: {adminTest.error}
              </div>
            )
          ) : (
            <div className="text-gray-600">Testing...</div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={forceLogout}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Force Logout & Login Again
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Try Admin Dashboard
            </button>
            <button
              onClick={() => navigate('/promote-to-admin')}
              className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700"
            >
              Promote to Admin
            </button>
            <button
              onClick={checkCurrentAuth}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Refresh Check
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="font-medium text-yellow-800 mb-2">🔧 Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>If admin test fails with 403, your token doesn't have admin role</li>
            <li>Click "Force Logout & Login Again" to get a fresh token</li>
            <li>If you created an admin account, make sure you're logged in as that account</li>
            <li>Check that your user role in the database is actually ADMIN</li>
            <li>JWT tokens contain the role at creation time - they don't update automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CheckAuth;
