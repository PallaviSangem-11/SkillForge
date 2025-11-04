import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import api from '../../api/axiosConfig';
import { toast } from 'react-toastify';
import RecommendedCourses from '../../components/RecommendedCourses';

const CourseCatalog = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterAndSortCourses();
  }, [courses, searchTerm, selectedCategory, selectedDifficulty, sortBy]);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCourses = () => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || course.difficultyLevel === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });

    // Sort courses
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      default:
        // Keep original order for recommended
        break;
    }

    setFilteredCourses(filtered);
  };

  const categories = [
    'all', 'Programming', 'Web Development', 'Data Science', 
    'Mobile Development', 'DevOps', 'AI/ML', 'Cybersecurity'
  ];

  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#111827' }}>
            🎓 Course Catalog
          </h1>
          <p className="text-lg" style={{ color: '#6B7280' }}>
            Discover your next learning adventure with AI-powered recommendations
          </p>
        </div>

        {/* AI Recommendations Section */}
        <RecommendedCourses limit={8} showTitle={true} context="course_catalog" />

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6" style={{ borderLeft: '4px solid #3B82F6' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: '#111827' }}>
            <svg className="w-6 h-6 mr-3" style={{ color: '#3B82F6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            🔍 Browse All Courses
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                Search Courses
              </label>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                style={{ 
                  borderColor: '#D1D5DB',
                  backgroundColor: '#F9FAFB',
                  color: '#111827'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                style={{ 
                  borderColor: '#D1D5DB',
                  backgroundColor: '#F9FAFB',
                  color: '#111827'
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                style={{ 
                  borderColor: '#D1D5DB',
                  backgroundColor: '#F9FAFB',
                  color: '#111827'
                }}
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Levels' : 
                     difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                style={{ 
                  borderColor: '#D1D5DB',
                  backgroundColor: '#F9FAFB',
                  color: '#111827'
                }}
              >
                <option value="recommended">🤖 AI Recommended</option>
                <option value="title">📝 Title A-Z</option>
                <option value="newest">🆕 Newest First</option>
                <option value="popular">🔥 Most Popular</option>
                <option value="rating">⭐ Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm" style={{ color: '#6B7280' }}>
              Showing {filteredCourses.length} of {courses.length} courses
            </p>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
            >
              {/* Course Image/Header */}
              <div className="h-48 p-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' }}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">{course.title}</h3>
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

                  {course.instructor && (
                    <div className="flex items-center mb-3 text-sm" style={{ color: '#6B7280' }}>
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
                    className="flex-1 text-center py-2 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200 transform hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' }}
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => toast.info('Enrollment feature coming soon!')}
                    className="flex-1 text-center py-2 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200 transform hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
              <svg className="w-12 h-12" style={{ color: '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#111827' }}>
              No courses found
            </h3>
            <p style={{ color: '#6B7280' }}>
              Try adjusting your search criteria or browse our AI recommendations above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCatalog;
