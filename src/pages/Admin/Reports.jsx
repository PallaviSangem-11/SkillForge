import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const Reports = () => {
  const [reports, setReports] = useState({
    userStats: {},
    courseStats: {},
    quizStats: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      const response = await api.get(`/admin/reports?days=${dateRange}`);
      setReports(response.data || {});
    } catch (error) {
      console.error('Reports API Error:', error);
      toast.error('Failed to load reports: ' + (error.response?.data || error.message));
      // Set default data to prevent UI issues
      setReports({
        userStats: { total: 0, students: 0, instructors: 0, admins: 0, newUsers: 0, activeUsers: 0 },
        courseStats: { total: 0, active: 0, enrollments: 0, completionRate: 0, mostPopular: 'N/A', highestRated: 'N/A' },
        quizStats: { attempts: 0, avgScore: 0 },
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type) => {
    try {
      const response = await api.get(`/admin/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`${type} report exported successfully`);
    } catch (error) {
      toast.error(`Failed to export ${type} report`);
    }
  };

  if (loading) return <div className="text-center py-10">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Platform Reports</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={() => loadReports()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-3xl font-bold text-blue-600">{reports.userStats?.total || 0}</div>
          <div className="text-xs text-gray-400">
            New: +{reports.userStats?.newUsers || 0} this period
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Active Courses</div>
          <div className="text-3xl font-bold text-green-600">{reports.courseStats?.active || 0}</div>
          <div className="text-xs text-gray-400">
            Total: {reports.courseStats?.total || 0} courses
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Quiz Attempts</div>
          <div className="text-3xl font-bold text-purple-600">{reports.quizStats?.attempts || 0}</div>
          <div className="text-xs text-gray-400">
            Avg Score: {reports.quizStats?.avgScore || 0}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Platform Usage</div>
          <div className="text-3xl font-bold text-orange-600">{reports.userStats?.activeUsers || 0}</div>
          <div className="text-xs text-gray-400">
            Active users this period
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">User Distribution</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Students</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(reports.userStats?.students / reports.userStats?.total * 100) || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{reports.userStats?.students || 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Instructors</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(reports.userStats?.instructors / reports.userStats?.total * 100) || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{reports.userStats?.instructors || 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Admins</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(reports.userStats?.admins / reports.userStats?.total * 100) || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{reports.userStats?.admins || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Course Performance</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Most Popular Course</span>
              <span className="font-medium">{reports.courseStats?.mostPopular || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Highest Rated Course</span>
              <span className="font-medium">{reports.courseStats?.highestRated || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Enrollments</span>
              <span className="font-medium">{reports.courseStats?.enrollments || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Completion Rate</span>
              <span className="font-medium">{reports.courseStats?.completionRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Platform Activity</h2>
        {reports.recentActivity?.length > 0 ? (
          <div className="space-y-3">
            {reports.recentActivity.map((activity, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{activity.action}</div>
                  <div className="text-sm text-gray-600">{activity.details}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent activity to display
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Export Reports</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => exportReport('users')}
            className="bg-blue-100 text-blue-800 px-4 py-3 rounded hover:bg-blue-200"
          >
            📊 Export User Report
          </button>
          <button
            onClick={() => exportReport('courses')}
            className="bg-green-100 text-green-800 px-4 py-3 rounded hover:bg-green-200"
          >
            📚 Export Course Report
          </button>
          <button
            onClick={() => exportReport('quizzes')}
            className="bg-purple-100 text-purple-800 px-4 py-3 rounded hover:bg-purple-200"
          >
            📝 Export Quiz Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
