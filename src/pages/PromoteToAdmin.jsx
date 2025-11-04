import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/useAuth';

const PromoteToAdmin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [adminExists, setAdminExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const response = await api.get('/auth/check-admin');
      setAdminExists(response.data.adminExists);
    } catch (error) {
      console.error('Error checking admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async () => {
    setPromoting(true);
    try {
      const response = await api.post('/auth/promote-to-admin');
      toast.success('Successfully promoted to admin! Please log out and log back in.');
      
      // Force logout to refresh token with new role
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      toast.error('Failed to promote to admin: ' + (error.response?.data || error.message));
    } finally {
      setPromoting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (adminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-4">Admin User Already Exists</h2>
            <p className="text-gray-600 mb-6">
              An admin user already exists in the system. Contact your administrator for admin access.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold">Promote to Admin</h2>
          <p className="text-gray-600 mt-2">
            No admin user exists. You can promote your current account to admin.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">Current User:</h3>
          <p className="text-sm text-blue-700">
            <strong>Email:</strong> {user?.email || 'Not logged in'}
          </p>
          <p className="text-sm text-blue-700">
            <strong>Role:</strong> {user?.role || 'Unknown'}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• This will promote your current account to admin</li>
            <li>• You'll need to log out and log back in</li>
            <li>• This only works when no admin users exist</li>
            <li>• You'll have full admin access to the platform</li>
          </ul>
        </div>

        <button
          onClick={promoteToAdmin}
          disabled={promoting || !user}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 mb-4"
        >
          {promoting ? 'Promoting...' : 'Promote to Admin'}
        </button>

        <div className="text-center space-y-2">
          <button
            onClick={() => navigate('/create-admin')}
            className="text-blue-600 hover:text-blue-800 text-sm block w-full"
          >
            Create New Admin User Instead
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-800 text-sm block w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoteToAdmin;
