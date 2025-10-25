import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import { getDifficultyDisplayName, getDifficultyColor } from '../../utils/roles';
import Loader from '../../components/Loader';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    difficultyLevel: '',
    estimatedDuration: '',
    prerequisites: '',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setEditFormData({
      title: course.title,
      description: course.description,
      difficultyLevel: course.difficultyLevel,
      estimatedDuration: course.estimatedDuration || '',
      prerequisites: course.prerequisites || '',
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/courses/${editingCourse.id}`, editFormData);
      toast.success('Course updated successfully!');
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update course';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await api.delete(`/courses/${courseId}`);
        toast.success('Course deleted successfully!');
        fetchCourses();
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete course';
        toast.error(errorMessage);
      }
    }
  };

  if (isLoading) {
    return <Loader text="Loading courses..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <Link to="/instructor/courses/add" className="btn-primary">
          ➕ Add New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-6">Create your first course to get started</p>
          <Link to="/instructor/courses/add" className="btn-primary">
            Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <div key={course.id} className="card">
              {editingCourse?.id === course.id ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="input-field"
                      value={editFormData.title}
                      onChange={handleEditChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      className="input-field"
                      value={editFormData.description}
                      onChange={handleEditChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty
                      </label>
                      <select
                        name="difficultyLevel"
                        required
                        className="input-field"
                        value={editFormData.difficultyLevel}
                        onChange={handleEditChange}
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (hours)
                      </label>
                      <input
                        type="number"
                        name="estimatedDuration"
                        min="1"
                        className="input-field"
                        value={editFormData.estimatedDuration}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prerequisites
                    </label>
                    <textarea
                      name="prerequisites"
                      rows={2}
                      className="input-field"
                      value={editFormData.prerequisites}
                      onChange={handleEditChange}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditingCourse(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{course.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficultyLevel)}`}>
                          {getDifficultyDisplayName(course.difficultyLevel)}
                        </span>
                        {course.estimatedDuration && (
                          <span>⏱️ {course.estimatedDuration} hours</span>
                        )}
                        <span>📅 Created {new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(course)}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {course.prerequisites && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Prerequisites:</h4>
                      <p className="text-sm text-gray-600">{course.prerequisites}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
