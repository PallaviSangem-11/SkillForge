import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../auth/useAuth';
import { toast } from 'react-toastify';

const RecommendedCoursesPage = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollmentLoading, setEnrollmentLoading] = useState(new Set());
  const [activeAlgorithm, setActiveAlgorithm] = useState('smart');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeAlgorithm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch courses and user enrollments
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get('/courses'),
        fetchUserEnrollments()
      ]);
      
      const allCourses = coursesRes.data || [];
      
      // Update enrollment counts dynamically
      const coursesWithUpdatedCounts = await updateEnrollmentCounts(allCourses);
      
      const userEnrollmentIds = new Set(enrollmentsRes.map(e => e.courseId));
      setEnrolledCourses(userEnrollmentIds);
      
      // Apply recommendation algorithm
      let recommendedCourses = [];
      
      switch (activeAlgorithm) {
        case 'popular':
          recommendedCourses = getPopularCourses(coursesWithUpdatedCounts);
          break;
        case 'newest':
          recommendedCourses = getNewestCourses(coursesWithUpdatedCounts);
          break;
        case 'beginner':
          recommendedCourses = getBeginnerCourses(coursesWithUpdatedCounts);
          break;
        case 'advanced':
          recommendedCourses = getAdvancedCourses(coursesWithUpdatedCounts);
          break;
        case 'smart':
        default:
          recommendedCourses = getSmartRecommendations(coursesWithUpdatedCounts, userEnrollmentIds);
          break;
      }

      setRecommendations(recommendedCourses);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load recommendations');
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

  const fetchUserEnrollments = async () => {
    try {
      // Use the correct endpoint for your backend
      const response = await api.get(`/enrollments/student/${user.id}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch user enrollments:', error);
      throw error; // Let the calling function handle the error
    }
  };

  // Smart recommendations based on user preferences and course quality
  const getSmartRecommendations = (courses, enrolledIds) => {
    return courses
      .filter(course => !enrolledIds.has(course.id))
      .map(course => ({
        ...course,
        score: calculateSmartScore(course),
        algorithm: 'Smart AI',
        reason: getRecommendationReason(course)
      }))
      .sort((a, b) => b.score - a.score);
  };

  const calculateSmartScore = (course) => {
    let score = 0;
    
    // Base score from course metrics
    score += (course.enrollmentCount || 0) * 0.1;
    score += (course.averageRating || 3) * 3;
    
    // Popular technology keywords get higher scores
    const content = `${course.title} ${course.description || ''}`.toLowerCase();
    const techKeywords = {
      'javascript': 8, 'python': 8, 'react': 7, 'node': 6, 'web development': 7,
      'data science': 9, 'machine learning': 9, 'ai': 8, 'frontend': 6, 'backend': 6,
      'mobile': 5, 'android': 5, 'ios': 5, 'database': 5, 'sql': 4, 'api': 4
    };
    
    Object.entries(techKeywords).forEach(([keyword, weight]) => {
      if (content.includes(keyword)) {
        score += weight;
      }
    });
    
    // Difficulty level preferences
    switch (course.difficultyLevel) {
      case 'beginner': score += 3; break;
      case 'intermediate': score += 5; break;
      case 'advanced': score += 4; break;
    }
    
    // Recent courses get slight bonus
    const courseAge = Date.now() - new Date(course.createdAt || Date.now()).getTime();
    const daysSinceCreated = courseAge / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) score += 2;
    
    return score + Math.random() * 2; // Add randomness
  };

  const getRecommendationReason = (course) => {
    const content = `${course.title} ${course.description || ''}`.toLowerCase();
    
    if (content.includes('beginner') || course.difficultyLevel === 'beginner') {
      return 'Perfect for getting started';
    }
    if (course.enrollmentCount > 100) {
      return 'Popular choice among learners';
    }
    if (course.averageRating >= 4.5) {
      return 'Highly rated by students';
    }
    if (content.includes('javascript') || content.includes('python')) {
      return 'In-demand programming skills';
    }
    if (content.includes('ai') || content.includes('machine learning')) {
      return 'Cutting-edge technology';
    }
    return 'Recommended for you';
  };

  const getPopularCourses = (courses) => {
    return courses
      .map(course => ({
        ...course,
        score: (course.enrollmentCount || 0) * 0.7 + (course.averageRating || 0) * 0.3,
        algorithm: 'Popular',
        reason: `${course.enrollmentCount || 0} students enrolled`
      }))
      .sort((a, b) => b.score - a.score);
  };

  const getNewestCourses = (courses) => {
    return courses
      .map(course => ({
        ...course,
        score: new Date(course.createdAt || Date.now()).getTime(),
        algorithm: 'Latest',
        reason: 'Recently added'
      }))
      .sort((a, b) => b.score - a.score);
  };

  const getBeginnerCourses = (courses) => {
    return courses
      .filter(course => course.difficultyLevel === 'beginner' || 
              course.title?.toLowerCase().includes('beginner') ||
              course.description?.toLowerCase().includes('beginner'))
      .map(course => ({
        ...course,
        score: calculateSmartScore(course),
        algorithm: 'Beginner-Friendly',
        reason: 'Great for beginners'
      }))
      .sort((a, b) => b.score - a.score);
  };

  const getAdvancedCourses = (courses) => {
    return courses
      .filter(course => course.difficultyLevel === 'advanced' || 
              course.title?.toLowerCase().includes('advanced') ||
              course.description?.toLowerCase().includes('advanced'))
      .map(course => ({
        ...course,
        score: calculateSmartScore(course),
        algorithm: 'Advanced',
        reason: 'Challenge yourself'
      }))
      .sort((a, b) => b.score - a.score);
  };

  const handleEnrollment = async (courseId, isEnrolled) => {
    try {
      setEnrollmentLoading(prev => new Set(prev).add(courseId));
      
      if (isEnrolled) {
        // Unenroll from course
        await api.delete(`/enrollments/${courseId}/${user.id}`);
        setEnrolledCourses(prev => {
          const newSet = new Set(prev);
          newSet.delete(courseId);
          return newSet;
        });
        toast.success('Successfully unenrolled from course!');
      } else {
        // Enroll in course
        await api.post('/enrollments', {
          courseId: courseId,
          studentId: user.id
        });
        setEnrolledCourses(prev => new Set(prev).add(courseId));
        toast.success('Successfully enrolled in course!');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      if (error.response?.status === 400) {
        toast.error('You are already enrolled in this course');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status === 404) {
        toast.error('Course or enrollment not found');
      } else {
        toast.error(`Failed to ${isEnrolled ? 'unenroll from' : 'enroll in'} course`);
      }
    } finally {
      setEnrollmentLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  const algorithmOptions = [
    { value: 'smart', label: '🤖 Smart AI', description: 'Personalized recommendations' },
    { value: 'popular', label: '🔥 Popular', description: 'Most enrolled courses' },
    { value: 'newest', label: '🆕 Latest', description: 'Recently added' },
    { value: 'beginner', label: '🌱 Beginner', description: 'Perfect for starters' },
    { value: 'advanced', label: '🚀 Advanced', description: 'Challenge yourself' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#111827' }}>
            🎯 Recommended Courses
          </h1>
          <p className="text-lg mb-6" style={{ color: '#6B7280' }}>
            Discover courses tailored just for you with our AI-powered recommendation engine
          </p>
          
          {/* Algorithm Selector */}
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Choose Recommendation Type:
            </label>
            <select
              value={activeAlgorithm}
              onChange={(e) => setActiveAlgorithm(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl outline-none transition-all duration-200 text-center"
              style={{ 
                borderColor: '#D1D5DB',
                backgroundColor: '#FFFFFF',
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

        {/* Recommendations Grid */}
        {recommendations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E7EB' }}>
              <svg className="w-12 h-12" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4" style={{ color: '#111827' }}>
              No recommendations available
            </h3>
            <p style={{ color: '#6B7280' }}>
              Try a different recommendation type or check back later for new courses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map((course, index) => {
              const isEnrolled = enrolledCourses.has(course.id);
              const isLoading = enrollmentLoading.has(course.id);
              
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  {/* Course Header */}
                  <div className="h-48 p-6 flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' }}>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                        #{index + 1} {course.algorithm}
                      </span>
                    </div>
                    {isEnrolled && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#10B981' }}>
                          ✓ Enrolled
                        </span>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white line-clamp-2">{course.title}</h3>
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <div className="mb-4">
                      <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
                        {course.description?.substring(0, 120)}...
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ 
                          backgroundColor: '#F0F9FF', 
                          color: '#1E3A8A' 
                        }}>
                          {course.difficultyLevel || 'Intermediate'}
                        </span>
                        <div className="flex items-center text-sm" style={{ color: '#6B7280' }}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          {course.enrollmentCount || 0} enrolled
                        </div>
                      </div>

                      <div className="flex items-center mb-4 text-sm" style={{ color: '#10B981' }}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {course.reason}
                      </div>

                      {course.instructor && (
                        <div className="flex items-center mb-4 text-sm" style={{ color: '#6B7280' }}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {course.instructor.firstName} {course.instructor.lastName}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/courses/${course.id}`}
                        className="flex-1 text-center py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 transform hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' }}
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleEnrollment(course.id, isEnrolled)}
                        disabled={isLoading}
                        className={`flex-1 text-center py-3 px-4 rounded-xl text-sm font-medium text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isLoading ? 'animate-pulse' : ''
                        }`}
                        style={{ 
                          background: isEnrolled 
                            ? 'linear-gradient(135deg, #EF4444, #DC2626)' 
                            : 'linear-gradient(135deg, #10B981, #059669)' 
                        }}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isEnrolled ? 'Unenrolling...' : 'Enrolling...'}
                          </div>
                        ) : (
                          isEnrolled ? '❌ Unenroll' : '✅ Enroll Now'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Action */}
        {recommendations.length > 0 && (
          <div className="text-center mt-12">
            <Link
              to="/courses"
              className="inline-flex items-center px-6 py-3 rounded-xl text-lg font-medium transition-all duration-200 transform hover:scale-105"
              style={{ color: '#3B82F6', backgroundColor: '#F0F9FF' }}
            >
              Browse All Courses
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendedCoursesPage;
