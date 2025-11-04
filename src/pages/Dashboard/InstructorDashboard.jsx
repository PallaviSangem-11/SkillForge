import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
  const response = await api.get(`/dashboard/instructor?instructorId=${user?.id}`);
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
    { name: 'Courses Created', value: dashboard.totalCoursesCreated || 0, icon: '📚' },
    { name: 'Total Students Enrolled', value: dashboard.totalStudentsEnrolled || 0, icon: '👥' },
    { name: 'Recent Activities', value: dashboard.recentActivities?.length || 0, icon: '📝' },
    { name: 'Active Courses', value: dashboard.courseStats?.length || 0, icon: '🎯' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="text-purple-100 mt-2">Ready to create amazing learning experiences?</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Course Statistics</h3>
          <div className="space-y-4">
            {dashboard.courseStats && dashboard.courseStats.length > 0 ? (
              dashboard.courseStats.map((stat) => (
                <div key={stat.courseId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{stat.courseTitle}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Students: </span>
                      <span className="font-semibold">{stat.studentCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Score: </span>
                      <span className="font-semibold">
                        {(stat.averageScore || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No courses yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/instructor/courses/add"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 text-center"
            >
              ➕ Create New Course
            </Link>
            <Link
              to="/instructor/quiz"
              className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 text-center"
            >
              🎯 Generate Quiz
            </Link>
            <Link
              to="/instructor/courses"
              className="block w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 text-center"
            >
              📚 View My Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      {dashboard.recentActivities && dashboard.recentActivities.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {dashboard.recentActivities.map((activity, idx) => (
              <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {activity.score !== null && (
                    <span className={`px-3 py-1 rounded ${
                      activity.score >= 80 ? 'bg-green-100 text-green-800' :
                      activity.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.score.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
