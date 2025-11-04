import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
  const response = await api.get('/dashboard/admin');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!dashboard) {
    return <div className="text-center py-8">No data available</div>;
  }

  const stats = [
    { name: 'Total Students', value: dashboard.totalStudents || 0, icon: '👥' },
    { name: 'Total Instructors', value: dashboard.totalInstructors || 0, icon: '👨‍🏫' },
    { name: 'Total Courses', value: dashboard.totalCourses || 0, icon: '📚' },
    { name: 'Platform Stats', value: 'View', icon: '📊' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-red-100 mt-2">Welcome, {user?.firstName}! Manage your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
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

      {/* Platform Stats */}
      {dashboard.platformStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold">{dashboard.platformStats.totalQuizzes || 0}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-bold">{dashboard.platformStats.totalEnrollments || 0}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Quiz Attempts</p>
              <p className="text-2xl font-bold">{dashboard.platformStats.totalQuizAttempts || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold mb-2">👥 Manage Users</h3>
          <p className="text-gray-600">View, edit, and manage students and instructors</p>
        </Link>

        <Link
          to="/admin/courses"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold mb-2">📚 Manage Courses</h3>
          <p className="text-gray-600">View and manage all courses on the platform</p>
        </Link>

        <Link
          to="/admin/analytics"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold mb-2">📊 View Analytics</h3>
          <p className="text-gray-600">View platform-wide analytics and reports</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
