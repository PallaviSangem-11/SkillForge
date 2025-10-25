import React from 'react';
import { useAuth } from '../../auth/useAuth';
import { getRoleDisplayName } from '../../utils/roles';

const AdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Users', value: '0', icon: '👥' },
    { name: 'Active Courses', value: '0', icon: '📚' },
    { name: 'System Health', value: '100%', icon: '💚' },
    { name: 'Storage Used', value: '0MB', icon: '💾' },
  ];

  const recentActivities = [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-primary-100 mt-2">
          System overview and management dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center">
              <div className="text-3xl mr-4">{stat.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left">
              👥 Manage Users
            </button>
            <button className="w-full btn-secondary text-left">
              📊 View Reports
            </button>
            <button className="w-full btn-secondary text-left">
              ⚙️ System Settings
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
