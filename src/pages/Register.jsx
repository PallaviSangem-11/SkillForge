import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { toast } from 'react-toastify';
import { ROLES } from '../utils/roles';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ROLES.STUDENT,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, isAuthenticated, user, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      const roleRoutes = {
        STUDENT: '/student',
        INSTRUCTOR: '/instructor',
        ADMIN: '/admin',
      };
      navigate(roleRoutes[user.role] || '/student', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);
      
      if (result.success) {
        toast.success('Registration successful!');
        // Navigation will be handled by useEffect
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
      <div className="max-w-lg w-full">
        {/* Compact Registration Form */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section - Compact */}
          <div className="text-center p-4" style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">
              Join SkillForge
            </h1>
            <p className="text-xs text-blue-100">
              Start your AI-powered learning journey
            </p>
          </div>

          {/* Registration Form */}
          <div className="p-5">
            <h2 className="text-lg font-bold text-center mb-4" style={{ color: '#111827' }}>
              Create your account
            </h2>
          
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                      style={{ 
                        borderColor: '#D1D5DB',
                        backgroundColor: '#F9FAFB',
                        color: '#111827'
                      }}
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                      style={{ 
                        borderColor: '#D1D5DB',
                        backgroundColor: '#F9FAFB',
                        color: '#111827'
                      }}
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                    style={{ 
                      borderColor: '#D1D5DB',
                      backgroundColor: '#F9FAFB',
                      color: '#111827'
                    }}
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                      style={{ 
                        borderColor: '#D1D5DB',
                        backgroundColor: '#F9FAFB',
                        color: '#111827'
                      }}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                      style={{ 
                        borderColor: '#D1D5DB',
                        backgroundColor: '#F9FAFB',
                        color: '#111827'
                      }}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
                    I want to join as
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                    style={{ 
                      borderColor: '#D1D5DB',
                      backgroundColor: '#F9FAFB',
                      color: '#111827'
                    }}
                    value={formData.role}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  >
                    <option value={ROLES.STUDENT}>🎓 Student - Learn with AI-powered courses</option>
                    <option value={ROLES.INSTRUCTOR}>👨‍🏫 Instructor - Create and teach courses</option>
                    <option value={ROLES.ADMIN}>⚡ Administrator - Manage the platform</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)' }}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium transition-colors duration-200"
                    style={{ color: '#3B82F6' }}
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
