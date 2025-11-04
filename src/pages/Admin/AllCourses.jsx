import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import { getDifficultyColor, getDifficultyDisplayName } from '../../utils/roles';

const AllCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadCourses();
    loadStats();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await api.get('/admin/courses');
      setCourses(response.data || []);
    } catch (error) {
      console.error('Courses API Error:', error);
      toast.error('Failed to load courses: ' + (error.response?.data || error.message));
      setCourses([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/course-stats');
      setStats(response.data || {});
    } catch (error) {
      // Stats are optional
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This will also delete all associated quizzes and enrollments.')) return;
    
    try {
      await api.delete(`/admin/courses/${courseId}`);
      toast.success('Course deleted successfully');
      loadCourses();
      loadStats();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handleToggleCourseStatus = async (courseId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.put(`/admin/courses/${courseId}/status`, { status: newStatus });
      toast.success(`Course ${newStatus.toLowerCase()} successfully`);
      loadCourses();
    } catch (error) {
      toast.error('Failed to update course status');
    }
  };

  if (loading) return <div className="text-center py-10">Loading courses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">All Courses</h1>
        <div className="text-sm text-gray-600">
          Total: {courses.length} courses
        </div>
      </div>

      {/* Course Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Total Courses</div>
          <div className="text-3xl font-bold text-blue-600">{courses.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Active Courses</div>
          <div className="text-3xl font-bold text-green-600">
            {courses.filter(c => c.status === 'ACTIVE').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Total Enrollments</div>
          <div className="text-3xl font-bold text-purple-600">{stats.totalEnrollments || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Total Quizzes</div>
          <div className="text-3xl font-bold text-orange-600">{stats.totalQuizzes || 0}</div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollments</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{course.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {course.description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {course.instructorName || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficultyLevel)}`}>
                    {getDifficultyDisplayName(course.difficultyLevel)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    course.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {course.status || 'ACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {course.enrollmentCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => handleToggleCourseStatus(course.id, course.status || 'ACTIVE')}
                    className={`px-3 py-1 rounded text-xs ${
                      course.status === 'ACTIVE' 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {course.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium mb-2">No courses found</h3>
          <p className="text-gray-600">Courses will appear here once instructors create them</p>
        </div>
      )}
    </div>
  );
};

export default AllCourses;
