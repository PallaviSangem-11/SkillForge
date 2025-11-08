import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../auth/useAuth';
import { toast } from 'react-toastify';
import CourseCard from './CourseCard';

const RecommendedCourses = ({ limit = 6, showTitle = true, context = 'dashboard' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlgorithm, setActiveAlgorithm] = useState('hybrid');
  const [enrollmentStatus, setEnrollmentStatus] = useState({});

  useEffect(() => {
    if (user) {
      fetchEnrollmentStatus();
      fetchRecommendations();
    }
  }, [user, activeAlgorithm]);

  useEffect(() => {
    if (recommendations.length > 0 && Object.keys(enrollmentStatus).length > 0) {
      const filtered = recommendations.filter(course => !enrollmentStatus[course.id]);
      setRecommendations(filtered);
    }
  }, [enrollmentStatus]);

  const fetchEnrollmentStatus = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/enrollments/student/${user.id}`);
      const enrollments = response.data;
      const status = {};
      enrollments.forEach(e => {
        status[e.course.id] = true;
      });
      setEnrollmentStatus(status);
    } catch (error) {
      console.error('Error fetching enrollment status:', error);
    }
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      toast.error('Please log in to enroll in courses');
      return;
    }

    try {
      // EnrollmentController exposes POST /api/enrollments/enroll?courseId=&studentId=
      await api.post(`/enrollments/enroll?courseId=${courseId}&studentId=${user.id}`);
      toast.success('Successfully enrolled in the course!');
      // update local enrollment status and filter recommendations
      setEnrollmentStatus(prev => ({ ...prev, [courseId]: true }));
      setRecommendations(prev => prev.filter(c => c.id !== courseId));
    } catch (error) {
      console.error('Error enrolling in course:', error);
      const msg = error.response?.data || 'Failed to enroll in the course. Please try again.';
      toast.error(msg);
    }
  };

  const handleViewDetails = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const fetchRecommendations = async () => {
    if (!user) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
  // 1. Fetch all courses (axios baseURL already includes /api)
  const coursesResponse = await api.get('/courses');
      let allCourses = coursesResponse.data;
      
      if (!Array.isArray(allCourses)) {
        console.error('Invalid courses data received:', allCourses);
        toast.error('Error loading courses');
        return;
      }

      // 2. Get currently enrolled courses to filter them out
      const enrolledResponse = await api.get(`/enrollments/student/${user.id}`);
      const enrolledCourseIds = new Set(
        enrolledResponse.data.map(enrollment => enrollment.course.id)
      );

      // 3. Filter out enrolled courses
      allCourses = allCourses.filter(course => !enrolledCourseIds.has(course.id));

      // 4. Fetch and attach enrollment counts
      for (const course of allCourses) {
        try {
          const countResponse = await api.get(`/enrollments/course/${course.id}/count`);
          course.enrollmentCount = countResponse.data;
        } catch (error) {
          console.warn(`Could not fetch enrollment count for course ${course.id}:`, error);
          course.enrollmentCount = 0;
        }
      }

      // 5. Apply selected recommendation algorithm
      let recommendedCourses = [];
      switch (activeAlgorithm) {
        case 'popularity':
          recommendedCourses = allCourses.sort((a, b) => 
            (b.enrollmentCount || 0) - (a.enrollmentCount || 0)
          );
          break;

        case 'skill_gap':
          // Fetch user's quiz results to identify skill gaps
          const quizResults = await api.get(`/quiz-attempts/student/${user.id}`);
          const weakTopics = analyzeSkillGaps(quizResults.data);
          recommendedCourses = allCourses.filter(course => 
            weakTopics.some(topic => 
              course.title.toLowerCase().includes(topic) || 
              course.description.toLowerCase().includes(topic)
            )
          );
          break;

        case 'hybrid':
        default:
          // Combine multiple factors: popularity, skill relevance, and course rating
          recommendedCourses = allCourses.sort((a, b) => {
            const aScore = calculateCourseScore(a);
            const bScore = calculateCourseScore(b);
            return bScore - aScore;
          });
      }

      // 6. Limit the number of recommendations
      setRecommendations(recommendedCourses.slice(0, limit));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load course recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCourseScore = (course) => {
    let score = 0;
    // Popularity weight (40%)
    score += (course.enrollmentCount || 0) * 0.4;
    // Rating weight (30%)
    score += (course.rating || 0) * 0.3;
    // Freshness weight (30%)
    const ageInDays = (new Date() - new Date(course.createdAt)) / (1000 * 60 * 60 * 24);
    score += (100 - Math.min(ageInDays, 100)) * 0.3;
    return score;
  };

  const analyzeSkillGaps = (quizAttempts) => {
    const topicScores = {};
    
    quizAttempts.forEach(attempt => {
      const topic = attempt.quiz.topic.toLowerCase();
      if (!topicScores[topic]) {
        topicScores[topic] = { total: 0, count: 0 };
      }
      topicScores[topic].total += attempt.score;
      topicScores[topic].count += 1;
    });

    // Find topics with average score below 70%
    return Object.entries(topicScores)
      .filter(([_, scores]) => (scores.total / scores.count) < 70)
      .map(([topic]) => topic);
  };

  const algorithmOptions = [
    { value: 'hybrid', label: '🤖 AI Hybrid', description: 'Best overall recommendations' },
    { value: 'content_based', label: '🎯 Content-Based', description: 'Based on your interests' },
    { value: 'collaborative', label: '👥 Collaborative', description: 'What similar learners chose' },
    { value: 'skill_gap', label: '📈 Skill Gap', description: 'Address your weak areas' },
    { value: 'popularity', label: '🔥 Popular', description: 'Trending courses' }
  ];

  // ✅ Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
            <svg
              className="w-6 h-6 mr-3 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            🎯 AI-Powered Course Recommendations
          </h3>

          {/* Algorithm Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Recommendation Algorithm:
            </label>
            <select
              value={activeAlgorithm}
              onChange={(e) => setActiveAlgorithm(e.target.value)}
              className="px-3 py-2 border rounded-lg w-full sm:w-auto"
              style={{
                borderColor: '#D1D5DB',
                backgroundColor: '#F9FAFB',
                color: '#111827'
              }}
            >
              {algorithmOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onEnroll={handleEnroll}
            isEnrolled={enrollmentStatus[course.id]}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No recommended courses available at this time.
        </div>
      )}
    </div>
  );
};

export default RecommendedCourses;
