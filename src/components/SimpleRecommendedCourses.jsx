import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../auth/useAuth';
import { toast } from 'react-toastify';

const SimpleRecommendedCourses = ({ limit = 6, showTitle = true, context = 'dashboard' }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlgorithm, setActiveAlgorithm] = useState('smart');

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user, activeAlgorithm]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      // Fetch all available courses
      const coursesRes = await api.get('/courses');
      const allCourses = coursesRes.data || [];
      
      if (allCourses.length === 0) {
        setRecommendations([]);
        return;
      }

      // Update enrollment counts dynamically
      const coursesWithUpdatedCounts = await updateEnrollmentCounts(allCourses);

      // Apply simple recommendation logic
      let recommendedCourses = [];
      
      switch (activeAlgorithm) {
        case 'popular':
          recommendedCourses = getPopularCourses(coursesWithUpdatedCounts);
          break;
        case 'newest':
          recommendedCourses = getNewestCourses(coursesWithUpdatedCounts);
          break;
        case 'random':
          recommendedCourses = getRandomCourses(coursesWithUpdatedCounts);
          break;
        case 'smart':
        default:
          recommendedCourses = getSmartRecommendations(coursesWithUpdatedCounts);
          break;
      }

      setRecommendations(recommendedCourses.slice(0, limit));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load course recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const updateEnrollmentCounts = async (courses) => {
    try {
      // Fetch real enrollment data from your backend
      const enrollmentsRes = await api.get('/enrollments');
      const allEnrollments = enrollmentsRes.data || [];
      
      // Count enrollments per course
      const enrollmentCounts = {};
      allEnrollments.forEach(enrollment => {
        const courseId = enrollment.courseId;
        enrollmentCounts[courseId] = (enrollmentCounts[courseId] || 0) + 1;
      });
      
      // Update courses with real enrollment counts
      return courses.map(course => ({
        ...course,
        enrollmentCount: enrollmentCounts[course.id] || 0
      }));
    } catch (error) {
      console.error('Failed to fetch enrollment counts:', error);
      throw error; // Let the calling function handle the error
    }
  };

  // Smart recommendations based on available course data
  const getSmartRecommendations = (courses) => {
    return courses
      .map(course => ({
        ...course,
        score: calculateSmartScore(course),
        algorithm: 'Smart AI'
      }))
      .sort((a, b) => b.score - a.score);
  };

  // Calculate smart score based on available course properties
  const calculateSmartScore = (course) => {
    let score = 0;
    
    // Base score from course properties
    score += (course.enrollmentCount || 0) * 0.1;
    score += (course.averageRating || 3) * 2;
    
    // Bonus for certain keywords that indicate quality/popularity
    const title = course.title?.toLowerCase() || '';
    const description = course.description?.toLowerCase() || '';
    const content = title + ' ' + description;
    
    // Popular tech keywords
    const popularKeywords = [
      'javascript', 'python', 'react', 'node', 'web development',
      'data science', 'machine learning', 'ai', 'frontend', 'backend'
    ];
    
    popularKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score += 5;
      }
    });
    
    // Difficulty level preference (intermediate gets bonus)
    if (course.difficultyLevel === 'intermediate') {
      score += 3;
    } else if (course.difficultyLevel === 'beginner') {
      score += 2;
    }
    
    // Add some randomness to avoid always showing same courses
    score += Math.random() * 2;
    
    return score;
  };

  // Popular courses based on enrollment and ratings
  const getPopularCourses = (courses) => {
    return courses
      .map(course => ({
        ...course,
        score: (course.enrollmentCount || 0) * 0.7 + (course.averageRating || 0) * 0.3,
        algorithm: 'Popular'
      }))
      .sort((a, b) => b.score - a.score);
  };

  // Newest courses
  const getNewestCourses = (courses) => {
    return courses
      .map(course => ({
        ...course,
        score: new Date(course.createdAt || Date.now()).getTime(),
        algorithm: 'Newest'
      }))
      .sort((a, b) => b.score - a.score);
  };

  // Random courses for discovery
  const getRandomCourses = (courses) => {
    const shuffled = [...courses]
      .map(course => ({
        ...course,
        score: Math.random(),
        algorithm: 'Discovery'
      }))
      .sort((a, b) => b.score - a.score);
    
    return shuffled;
  };

  const algorithmOptions = [
    { value: 'smart', label: '🤖 Smart AI', description: 'Intelligent recommendations' },
    { value: 'popular', label: '🔥 Popular', description: 'Most enrolled courses' },
    { value: 'newest', label: '🆕 Latest', description: 'Recently added courses' },
    { value: 'random', label: '🎲 Discover', description: 'Random exploration' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6" style={{ borderLeft: '4px solid #10B981' }}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6" style={{ borderLeft: '4px solid #10B981' }}>
      {showTitle && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-4 flex items-center" style={{ color: '#111827' }}>
            <svg className="w-6 h-6 mr-3" style={{ color: '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            🎯 Recommended Courses
          </h3>
          
          {/* Algorithm Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Recommendation Type:
            </label>
            <select
              value={activeAlgorithm}
              onChange={(e) => setActiveAlgorithm(e.target.value)}
              className="px-3 py-2 border rounded-lg outline-none transition-all duration-200"
              style={{ 
                borderColor: '#D1D5DB',
                backgroundColor: '#F9FAFB',
                color: '#111827'
              }}
            >
              {algorithmOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
            <svg className="w-8 h-8" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p style={{ color: '#6B7280' }}>No courses available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((course, index) => (
            <div
              key={course.id}
              className="border rounded-2xl p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1" style={{ color: '#1E3A8A' }}>
                    {course.title}
                  </h4>
                  <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
                    {course.description?.substring(0, 100)}...
                  </p>
                </div>
                <div className="ml-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#10B981' }}>
                    #{index + 1}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F0F9FF', color: '#1E3A8A' }}>
                    {course.difficultyLevel || 'Intermediate'}
                  </span>
                  {course.enrollmentCount && (
                    <span className="text-xs" style={{ color: '#10B981' }}>
                      {course.enrollmentCount} enrolled
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center text-xs mb-1" style={{ color: '#6B7280' }}>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {course.algorithm}
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/courses/${course.id}`}
                  className="flex-1 text-center py-2 px-3 rounded-lg text-sm font-medium text-white transition-all duration-200 transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' }}
                >
                  View Course
                </Link>
                <Link
                  to={`/courses/${course.id}`}
                  className="flex-1 text-center py-2 px-3 rounded-lg text-sm font-medium text-white transition-all duration-200 transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                >
                  Enroll
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-6 text-center">
          <Link
            to="/courses"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{ color: '#3B82F6', backgroundColor: '#F0F9FF' }}
          >
            View All Courses
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};

export default SimpleRecommendedCourses;
