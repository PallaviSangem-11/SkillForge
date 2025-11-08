import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { toast } from 'react-toastify';
import { ROLES } from '../utils/roles';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    expectedRole: '', // New field for role hint
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

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
    setIsLoading(true);

    try {
      // Only send email and password to backend, not expectedRole
      const loginData = {
        email: formData.email,
        password: formData.password
      };
      
      const result = await login(loginData);
      if (result.success) {
        toast.success('Login successful!');
        // Navigation will be handled by useEffect
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
      <div className="max-w-sm w-full">
        {/* Compact Welcome & Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section - Compact */}
          <div className="text-center p-5" style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              SkillForge
            </h1>
            <p className="text-sm text-blue-100 font-medium">
              AI Adaptive Learning & Exam Generator
            </p>
          </div>

          {/* Login Form */}
          <div className="p-5">
            <h2 className="text-lg font-bold text-center mb-4" style={{ color: '#111827' }}>
              Sign in to your account
            </h2>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label htmlFor="expectedRole" className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    I am signing in as
                  </label>
                  <select
                    id="expectedRole"
                    name="expectedRole"
                    className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                    style={{ 
                      borderColor: '#D1D5DB',
                      backgroundColor: '#F9FAFB',
                      color: '#111827'
                    }}
                    value={formData.expectedRole}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  >
                    <option value="">Select your role</option>
                    <option value={ROLES.STUDENT}>🎓 Student</option>
                    <option value={ROLES.INSTRUCTOR}>👨‍🏫 Instructor</option>
                    <option value={ROLES.ADMIN}>⚡ Administrator</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                    style={{ 
                      borderColor: '#D1D5DB',
                      backgroundColor: '#F9FAFB',
                      color: '#111827'
                    }}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-3 py-2 border rounded-lg outline-none transition-all duration-200"
                    style={{ 
                      borderColor: '#D1D5DB',
                      backgroundColor: '#F9FAFB',
                      color: '#111827'
                    }}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium transition-colors duration-200"
                    style={{ color: '#3B82F6' }}
                  >
                    Create one here
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

export default Login;
