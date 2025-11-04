import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { useAuth } from '../../auth/useAuth';
import { toast } from 'react-toastify';
import { getDifficultyColor, getDifficultyDisplayName } from '../../utils/roles';

const TakeQuizList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [courseQuizzes, setCourseQuizzes] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    try {
      // Load courses
      const coursesRes = await api.get('/courses/student');
      setCourses(coursesRes.data || []);

      // Load enrollments
      if (user?.id) {
        const enrollRes = await api.get(`/enrollments/student/${user.id}`);
        const ids = new Set((enrollRes.data || []).map(e => e.course.id));
        setEnrolledCourseIds(ids);

        // Load attempts
        const attemptsRes = await api.get(`/quiz-attempts/student/${user.id}`);
        setAttempts(attemptsRes.data || []);

        // Load quizzes for each enrolled course
        const quizData = {};
        for (const courseId of ids) {
          try {
            const quizRes = await api.get(`/quizzes/course/${courseId}`);
            quizData[courseId] = quizRes.data || [];
          } catch (e) {
            quizData[courseId] = [];
          }
        }
        setCourseQuizzes(quizData);
      }
    } catch (error) {
      toast.error('Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  };

  const getQuizAttempts = (quizId) => {
    return attempts.filter(a => a.quiz?.id === quizId);
  };

  const getLastAttemptScore = (quizId) => {
    const quizAttempts = getQuizAttempts(quizId);
    if (quizAttempts.length === 0) return null;
    const sorted = [...quizAttempts].sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));
    return Math.round(sorted[0].score || 0);
  };

  const getBestScore = (quizId) => {
    const quizAttempts = getQuizAttempts(quizId);
    if (quizAttempts.length === 0) return null;
    return Math.round(Math.max(...quizAttempts.map(a => a.score || 0)));
  };

  const getQuizButtonLabel = (quiz) => {
    const attempts = getQuizAttempts(quiz.id);
    if (attempts.length === 0) return 'Take Quiz';
    const lastScore = getLastAttemptScore(quiz.id);
    if (lastScore < 80) return `Improve Your Score (${lastScore}%) – Take This Quiz`;
    return `Retake Quiz (Best: ${getBestScore(quiz.id)}%)`;
  };

  if (loading) {
    return <div className="text-center py-10">Loading quizzes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Take Quiz</h1>
        <p className="text-gray-600">Choose any quiz from your enrolled courses</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium mb-2">No courses available</h3>
          <p className="text-gray-600">Enroll in courses to access quizzes</p>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map(course => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const quizzes = courseQuizzes[course.id] || [];
            
            return (
              <div key={course.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <p className="text-gray-600 mb-3">{course.description}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficultyLevel)}`}>
                        {getDifficultyDisplayName(course.difficultyLevel)}
                      </span>
                      <span className="text-gray-500">👨‍🏫 {course.instructorName}</span>
                      {quizzes.length > 0 && (
                        <span className="text-gray-500">📝 {quizzes.length} quiz{quizzes.length !== 1 ? 'es' : ''}</span>
                      )}
                    </div>
                  </div>
                  {!isEnrolled && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      Not Enrolled
                    </span>
                  )}
                </div>

                {isEnrolled ? (
                  quizzes.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded">
                      <p className="text-gray-500">No quizzes available for this course yet</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {quizzes.map(quiz => {
                        const lastScore = getLastAttemptScore(quiz.id);
                        const bestScore = getBestScore(quiz.id);
                        const attemptCount = getQuizAttempts(quiz.id).length;
                        
                        return (
                          <div key={quiz.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="mb-3">
                              <h4 className="font-medium mb-1">{quiz.title || `Quiz #${quiz.id}`}</h4>
                              <div className="text-xs text-gray-500 space-y-1">
                                <div>Questions: {quiz.questions?.length || 0}</div>
                                {quiz.timeLimitMinutes && (
                                  <div>Time: {quiz.timeLimitMinutes} min</div>
                                )}
                                {attemptCount > 0 && (
                                  <div>Attempts: {attemptCount}</div>
                                )}
                              </div>
                            </div>
                            
                            {attemptCount > 0 && (
                              <div className="mb-3 text-xs">
                                <div className="flex justify-between">
                                  <span>Last Score:</span>
                                  <span className={`font-medium ${lastScore >= 80 ? 'text-green-600' : lastScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {lastScore}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Best Score:</span>
                                  <span className="font-medium text-blue-600">{bestScore}%</span>
                                </div>
                              </div>
                            )}
                            
                            <button
                              onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                              className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                                attemptCount === 0 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : lastScore < 80
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {getQuizButtonLabel(quiz)}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded">
                    <p className="text-gray-500 mb-3">Enroll in this course to access quizzes</p>
                    <button
                      onClick={() => navigate('/student/courses')}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Go to Courses
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TakeQuizList;
