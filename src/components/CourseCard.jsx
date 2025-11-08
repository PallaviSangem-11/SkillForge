import React from 'react';
import { useNavigate } from 'react-router-dom';

const CourseCard = ({ course, onEnroll, isEnrolled, onViewDetails }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (typeof onViewDetails === 'function') {
      onViewDetails(course.id);
      return;
    }
    navigate(`/courses/${course.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center mb-4">
          <span className="text-sm font-medium text-gray-500">
            Level: {course.difficultyLevel}
          </span>
          <span className="mx-2">•</span>
          <span className="text-sm font-medium text-gray-500">
            Enrolled: {course.enrollmentCount || 0} students
          </span>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleViewDetails}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => onEnroll(course.id)}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              isEnrolled 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            disabled={isEnrolled}
          >
            {isEnrolled ? 'Enrolled' : 'Enroll Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;