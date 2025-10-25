import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import { getDifficultyDisplayName, getDifficultyColor } from '../../utils/roles';
import Loader from '../../components/Loader';

const StudentCourseList = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/student');
      setCourses(response.data);
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader text="Loading courses..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Available Courses</h1>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
          <p className="text-gray-600">Check back later for new courses</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <div key={course.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{course.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficultyLevel)}`}>
                      {getDifficultyDisplayName(course.difficultyLevel)}
                    </span>
                    {course.estimatedDuration && (
                      <span>⏱️ {course.estimatedDuration} hours</span>
                    )}
                    <span>👨‍🏫 {course.instructorName}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button className="btn-primary">
                    Enroll
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
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCourseList;
