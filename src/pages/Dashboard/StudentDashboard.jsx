import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
  const response = await api.get(`/dashboard/student?studentId=${user?.id}`);
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

  // Prepare chart data for score progression
  const scoreProgressionData = dashboard.progressData?.scoreProgression || [];
  const lineChartData = {
    labels: scoreProgressionData.map((p) => new Date(p.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Score',
        data: scoreProgressionData.map((p) => p.score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  };

  // Course analytics pie chart
  const courseAnalytics = dashboard.progressData?.courseAnalytics || [];
  const pieChartData = {
    labels: courseAnalytics.map((a) => a.title || `Course ${a.courseId}`),
    datasets: [
      {
        data: courseAnalytics.map((a) => a.avgScore || 0),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  const stats = [
    { name: 'Enrolled Courses', value: dashboard.totalCoursesEnrolled || 0, icon: '📚' },
    { name: 'Quizzes Attempted', value: dashboard.totalQuizzesAttempted || 0, icon: '✅' },
    { name: 'Overall Score', value: `${(dashboard.overallScore || 0).toFixed(1)}%`, icon: '⭐' },
    { name: 'Recommended Courses', value: dashboard.recommendedCourses?.length || 0, icon: '🎯' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="text-blue-100 mt-2">Ready to continue your learning journey?</p>
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
        {/* Overall Score Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Overall Score</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <Doughnut
                data={{
                  labels: ['Score', 'Remaining'],
                  datasets: [
                    {
                      data: [dashboard.overallScore || 0, 100 - (dashboard.overallScore || 0)],
                      backgroundColor: ['#10b981', '#e5e7eb'],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  cutout: '70%',
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                  },
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{(dashboard.overallScore || 0).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Score Progression */}
        {scoreProgressionData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Score Progression</h3>
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        )}
      </div>

      {/* Recommended Courses */}
      {dashboard.recommendedCourses && dashboard.recommendedCourses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Recommended Courses (AI Suggested)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.recommendedCourses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <h4 className="font-semibold text-lg">{course.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                <div className="mt-3">
                  <Link
                    to={`/student/courses`}
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    View Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Courses */}
      {dashboard.enrolledCourses && dashboard.enrolledCourses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📚 My Enrolled Courses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.enrolledCourses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <h4 className="font-semibold text-lg">{course.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                <div className="mt-3">
                  <Link
                    to={`/student/courses`}
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Continue Learning
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {dashboard.recentActivities && dashboard.recentActivities.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {dashboard.recentActivities.map((activity, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
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

      {/* Course Analytics */}
      {courseAnalytics.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Course Performance</h3>
          <div className="h-64">
            <Doughnut data={pieChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
