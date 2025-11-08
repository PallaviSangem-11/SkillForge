import React from 'react';
import { Navigate } from 'react-router-dom';

// This page was merged into CourseOperations. Redirect to the Course Operations page which now
// serves Quiz Recommendation functionality.
const RecommendationQuiz = () => {
  return <Navigate to="/instructor/course-operations" replace />;
};

export default RecommendationQuiz;

