import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../auth/useAuth';
import { toast } from 'react-toastify';

const RecommendedCourses = ({ limit = 6, showTitle = true, context = 'dashboard' }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlgorithm, setActiveAlgorithm] = useState('hybrid');
  const [enrollmentStatus, setEnrollmentStatus] = useState({});

  useEffect(() => {
    if (user) {
      fetchRecommendations();
      fetchEnrollmentStatus();
    }
  }, [user]);

  const fetchEnrollmentStatus = async () => {
    if (!user) return;
    
    try {
      const response = await api.get(`/enrollments/student/${user.id}`);
      const enrollments = response.data;
      const status = {};
      enrollments.forEach(enrollment => {
        status[enrollment.course.id] = true;
      });
      setEnrollmentStatus(status);
    } catch (error) {
      console.error('Error fetching enrollment status:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      // Fetch courses first (this should always work)
      const coursesRes = await api.get('/courses');
      const allCourses = coursesRes.data;
      
      let userEnrollments = [];
      let userQuizResults = [];
      
      // Fetch enrollment counts for each course
      const courseEnrollmentCounts = {};
      for (const course of allCourses) {
        try {
          const countRes = await api.get(`/enrollments/course/${course.id}/count`);
          courseEnrollmentCounts[course.id] = countRes.data;
        } catch (error) {
          console.warn(`Failed to fetch enrollment count for course ${course.id}`, error);
          courseEnrollmentCounts[course.id] = 0;
        }
      }

      // Attach enrollment count into course objects for easier rendering/ranking
      for (const course of allCourses) {
        course.enrollmentCount = courseEnrollmentCounts[course.id] || 0;
      }
      
      // Fetch user's enrollments
      try {
        const enrollmentsRes = await api.get(`/enrollments/student/${user.id}`);
        userEnrollments = enrollmentsRes.data || [];
      } catch (error) {
        console.warn('No enrollment data available', error);
        userEnrollments = [];
      }
      
      try {
        const quizResultsRes = await api.get(`/quiz-results/student/${user.id}`);
        userQuizResults = quizResultsRes.data || [];
      } catch (error) {
        console.warn('Quiz results endpoint not available, using fallback');
        // Fallback: try alternative endpoint or mock data
        try {
          const quizResultsRes = await api.get(`/quiz-results?studentId=${user.id}`);
          userQuizResults = quizResultsRes.data || [];
        } catch (fallbackError) {
          console.warn('No quiz results available, using empty array');
          userQuizResults = [];
        }
      }

      // Apply selected recommendation algorithm
      let recommendedCourses = [];
      
      switch (activeAlgorithm) {
        case 'content_based':
          recommendedCourses = getContentBasedRecommendations(allCourses, userEnrollments, userQuizResults);
          break;
        case 'collaborative':
          recommendedCourses = await getCollaborativeRecommendations(allCourses, userEnrollments);
          break;
        case 'popularity':
          recommendedCourses = getPopularityBasedRecommendations(allCourses);
          break;
        case 'skill_gap':
          recommendedCourses = getSkillGapRecommendations(allCourses, userQuizResults);
          break;
        case 'hybrid':
        default:
          recommendedCourses = await getHybridRecommendations(allCourses, userEnrollments, userQuizResults);
          break;
      }

      setRecommendations(recommendedCourses.slice(0, limit));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      
      // Fallback: Show basic recommendations even if APIs fail
      try {
        const coursesRes = await api.get('/courses');
        const basicRecommendations = coursesRes.data.slice(0, limit).map(course => ({
          ...course,
          score: Math.random() * 0.5 + 0.5, // Random score between 0.5-1.0
          algorithm: 'Basic Fallback'
        }));
        setRecommendations(basicRecommendations);
      } catch (fallbackError) {
        console.error('Even basic course fetch failed:', fallbackError);
        toast.error('Unable to load course recommendations. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Content-Based Filtering Algorithm
  const getContentBasedRecommendations = (allCourses, userEnrollments, userQuizResults) => {
    const enrolledCourseIds = userEnrollments.map(e => e.courseId);
    const availableCourses = allCourses.filter(course => !enrolledCourseIds.includes(course.id));

    // Extract user preferences from enrolled courses
    const userPreferences = extractUserPreferences(userEnrollments, userQuizResults);
    
    // Score courses based on similarity to user preferences
    const scoredCourses = availableCourses.map(course => ({
      ...course,
      score: calculateContentSimilarity(course, userPreferences),
      algorithm: 'Content-Based'
    }));

    return scoredCourses.sort((a, b) => b.score - a.score);
  };

  // Collaborative Filtering Algorithm
  const getCollaborativeRecommendations = async (allCourses, userEnrollments) => {
    try {
      // Find similar users based on enrollment patterns
      let allEnrollments = [];
      
      try {
        const allEnrollmentsRes = await api.get('/enrollments');
        allEnrollments = allEnrollmentsRes.data || [];
      } catch (error) {
        console.warn('Cannot fetch all enrollments for collaborative filtering, falling back to popularity');
        // Fallback to popularity-based recommendations
        return getPopularityBasedRecommendations(allCourses);
      }
      
      const similarUsers = findSimilarUsers(user.id, userEnrollments, allEnrollments);
      const enrolledCourseIds = userEnrollments.map(e => e.courseId);
      
      // Get courses that similar users liked but current user hasn't taken
      const recommendations = new Map();
      
      similarUsers.forEach(({ userId, similarity }) => {
        const userCourses = allEnrollments.filter(e => e.userId === userId);
        userCourses.forEach(enrollment => {
          if (!enrolledCourseIds.includes(enrollment.courseId)) {
            const course = allCourses.find(c => c.id === enrollment.courseId);
            if (course) {
              const currentScore = recommendations.get(enrollment.courseId) || 0;
              recommendations.set(enrollment.courseId, currentScore + similarity);
            }
          }
        });
      });

      const scoredCourses = Array.from(recommendations.entries())
        .map(([courseId, score]) => ({
          ...allCourses.find(c => c.id === courseId),
          score,
          algorithm: 'Collaborative Filtering'
        }))
        .filter(course => course.id)
        .sort((a, b) => b.score - a.score);

      return scoredCourses;
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  };

  // Popularity-Based Recommendations
  const getPopularityBasedRecommendations = (allCourses) => {
    const enrolledCourseIds = [];
    
    const scoredCourses = allCourses
      .filter(course => !enrolledCourseIds.includes(course.id))
      .map(course => ({
        ...course,
        score: (course.enrollmentCount || 0) * 0.7 + (course.averageRating || 0) * 0.3,
        algorithm: 'Popularity-Based'
      }))
      .sort((a, b) => b.score - a.score);

    return scoredCourses;
  };

  // Skill Gap Analysis Recommendations
  const getSkillGapRecommendations = (allCourses, userQuizResults) => {
    // Analyze weak areas from quiz results
    const weakAreas = analyzeWeakAreas(userQuizResults);
    
    const scoredCourses = allCourses.map(course => {
      let score = 0;
      
      // Higher score for courses that address weak areas
      weakAreas.forEach(area => {
        if (course.title?.toLowerCase().includes(area.toLowerCase()) ||
            course.description?.toLowerCase().includes(area.toLowerCase())) {
          score += area.weaknessScore * 10;
        }
      });

      // Bonus for appropriate difficulty level
      const userLevel = calculateUserLevel(userQuizResults);
      if (course.difficultyLevel === getRecommendedDifficulty(userLevel)) {
        score += 5;
      }

      return {
        ...course,
        score,
        algorithm: 'Skill Gap Analysis'
      };
    }).sort((a, b) => b.score - a.score);

    return scoredCourses;
  };

  // Hybrid Recommendation Algorithm (combines multiple approaches)
  const getHybridRecommendations = async (allCourses, userEnrollments, userQuizResults) => {
    const [contentBased, collaborative, popularity, skillGap] = await Promise.all([
      Promise.resolve(getContentBasedRecommendations(allCourses, userEnrollments, userQuizResults)),
      getCollaborativeRecommendations(allCourses, userEnrollments),
      Promise.resolve(getPopularityBasedRecommendations(allCourses)),
      Promise.resolve(getSkillGapRecommendations(allCourses, userQuizResults))
    ]);

    // Combine scores with weights
    const weights = {
      content: 0.3,
      collaborative: 0.25,
      popularity: 0.2,
      skillGap: 0.25
    };

    const courseScores = new Map();

    // Aggregate scores from all algorithms
    [contentBased, collaborative, popularity, skillGap].forEach((recommendations, index) => {
      const algorithmNames = ['content', 'collaborative', 'popularity', 'skillGap'];
      const weight = weights[algorithmNames[index]];

      recommendations.forEach((course, rank) => {
        const normalizedScore = (recommendations.length - rank) / recommendations.length;
        const currentScore = courseScores.get(course.id) || { course, totalScore: 0, algorithms: [] };
        
        currentScore.totalScore += normalizedScore * weight;
        currentScore.algorithms.push(course.algorithm);
        courseScores.set(course.id, currentScore);
      });
    });

    const hybridRecommendations = Array.from(courseScores.values())
      .map(({ course, totalScore, algorithms }) => ({
        ...course,
        score: totalScore,
        algorithm: 'Hybrid AI',
        algorithmDetails: algorithms
      }))
      .sort((a, b) => b.score - a.score);

    return hybridRecommendations;
  };

  // Helper Functions
  const extractUserPreferences = (enrollments, quizResults) => {
    const preferences = {
      topics: new Map(),
      difficulty: 'intermediate',
      avgScore: 0
    };

    // Extract topics from enrolled courses
    enrollments.forEach(enrollment => {
      if (enrollment.course) {
        const topics = extractTopicsFromCourse(enrollment.course);
        topics.forEach(topic => {
          preferences.topics.set(topic, (preferences.topics.get(topic) || 0) + 1);
        });
      }
    });

    // Calculate average quiz performance
    if (quizResults.length > 0) {
      preferences.avgScore = quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length;
    }

    return preferences;
  };

  const calculateContentSimilarity = (course, userPreferences) => {
    let similarity = 0;
    
    const courseTopics = extractTopicsFromCourse(course);
    courseTopics.forEach(topic => {
      const userInterest = userPreferences.topics.get(topic) || 0;
      similarity += userInterest * 2;
    });

    // Difficulty matching
    const userLevel = userPreferences.avgScore > 80 ? 'advanced' : 
                     userPreferences.avgScore > 60 ? 'intermediate' : 'beginner';
    
    if (course.difficultyLevel === userLevel) {
      similarity += 5;
    }

    return similarity;
  };

  const findSimilarUsers = (currentUserId, userEnrollments, allEnrollments) => {
    const userCourseIds = new Set(userEnrollments.map(e => e.courseId));
    const userSimilarities = new Map();

    // Group enrollments by user
    const userEnrollmentMap = new Map();
    allEnrollments.forEach(enrollment => {
      if (enrollment.userId !== currentUserId) {
        if (!userEnrollmentMap.has(enrollment.userId)) {
          userEnrollmentMap.set(enrollment.userId, []);
        }
        userEnrollmentMap.get(enrollment.userId).push(enrollment.courseId);
      }
    });

    // Calculate Jaccard similarity
    userEnrollmentMap.forEach((otherUserCourses, otherUserId) => {
      const otherCourseIds = new Set(otherUserCourses);
      const intersection = new Set([...userCourseIds].filter(x => otherCourseIds.has(x)));
      const union = new Set([...userCourseIds, ...otherCourseIds]);
      
      const similarity = intersection.size / union.size;
      if (similarity > 0.1) { // Minimum similarity threshold
        userSimilarities.set(otherUserId, similarity);
      }
    });

    return Array.from(userSimilarities.entries())
      .map(([userId, similarity]) => ({ userId, similarity }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 similar users
  };

  const analyzeWeakAreas = (quizResults) => {
    const topicScores = new Map();
    
    quizResults.forEach(result => {
      if (result.quiz && result.quiz.title) {
        const topics = extractTopicsFromText(result.quiz.title);
        topics.forEach(topic => {
          if (!topicScores.has(topic)) {
            topicScores.set(topic, { totalScore: 0, count: 0 });
          }
          const current = topicScores.get(topic);
          current.totalScore += result.score;
          current.count += 1;
        });
      }
    });

    return Array.from(topicScores.entries())
      .map(([topic, data]) => ({
        topic,
        avgScore: data.totalScore / data.count,
        weaknessScore: Math.max(0, 80 - (data.totalScore / data.count)) / 80
      }))
      .filter(item => item.avgScore < 70) // Only weak areas
      .sort((a, b) => b.weaknessScore - a.weaknessScore);
  };

  const extractTopicsFromCourse = (course) => {
    const text = `${course.title} ${course.description || ''}`.toLowerCase();
    return extractTopicsFromText(text);
  };

  const extractTopicsFromText = (text) => {
    const topics = [];
    const keywords = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node',
      'html', 'css', 'sql', 'database', 'api', 'web', 'mobile', 'android',
      'ios', 'machine learning', 'ai', 'data science', 'algorithms',
      'data structures', 'frontend', 'backend', 'fullstack', 'devops'
    ];

    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        topics.push(keyword);
      }
    });

    return topics;
  };

  const calculateUserLevel = (quizResults) => {
    if (quizResults.length === 0) return 'beginner';
    
    const avgScore = quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length;
    return avgScore > 80 ? 'advanced' : avgScore > 60 ? 'intermediate' : 'beginner';
  };

  const getRecommendedDifficulty = (userLevel) => {
    switch (userLevel) {
      case 'beginner': return 'beginner';
      case 'intermediate': return 'intermediate';
      case 'advanced': return 'advanced';
      default: return 'beginner';
    }
  };

  const algorithmOptions = [
    { value: 'hybrid', label: '🤖 AI Hybrid', description: 'Best overall recommendations' },
    { value: 'content_based', label: '🎯 Content-Based', description: 'Based on your interests' },
    { value: 'collaborative', label: '👥 Collaborative', description: 'What similar learners chose' },
    { value: 'skill_gap', label: '📈 Skill Gap', description: 'Address your weak areas' },
    { value: 'popularity', label: '🔥 Popular', description: 'Trending courses' }
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
            🎯 AI-Powered Course Recommendations
          </h3>
          
          {/* Algorithm Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Recommendation Algorithm:
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
          <p style={{ color: '#6B7280' }}>No recommendations available at the moment. Try enrolling in some courses first!</p>
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
                  <span className="text-xs" style={{ color: '#10B981' }}>
                    Match: {Math.round((course.score || 0) * 100)}%
                  </span>
                </div>
              </div>

              <div className="mb-3 text-sm" style={{ color: '#6B7280' }}>
                Enrolled: {course.enrollmentCount ?? 0} students
              </div>

              <div className="mb-3">
                <div className="flex items-center text-xs mb-1" style={{ color: '#6B7280' }}>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Recommended by: {course.algorithm}
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
                <button
                  onClick={() => toast.info('Enrollment feature coming soon!')}
                  className="flex-1 text-center py-2 px-3 rounded-lg text-sm font-medium text-white transition-all duration-200 transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                >
                  Enroll Now
                </button>
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

export default RecommendedCourses;
