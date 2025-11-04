import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../utils/roles';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getNavigationItems = () => {
    if (!user) return [];

    switch (user.role) {
      case ROLES.STUDENT:
        return [
          { name: 'Dashboard', href: '/student', icon: '📊' },
          { name: 'Recommended', href: '/student/recommended', icon: '🎯' },
          { name: 'My Courses', href: '/student/courses', icon: '📚' },
          { name: 'Take Quiz', href: '/student/quiz-list', icon: '📝' },
          { name: 'Progress', href: '/student/progress', icon: '📈' },
        ];
      case ROLES.INSTRUCTOR:
        return [
          { name: 'Dashboard', href: '/instructor', icon: '📊' },
          { name: 'My Courses', href: '/instructor/courses', icon: '📚' },
          { name: 'Add Course', href: '/instructor/courses/add', icon: '➕' },
          { name: 'Generate Quiz', href: '/instructor/quiz', icon: '🧠' },
          { name: 'Analytics', href: '/instructor/analytics', icon: '📊' },
        ];
      case ROLES.ADMIN:
        return [
          { name: 'Dashboard', href: '/admin', icon: '📊' },
          { name: 'Manage Users', href: '/admin/users', icon: '👥' },
          { name: 'All Courses', href: '/admin/courses', icon: '📚' },
          { name: 'Reports', href: '/admin/reports', icon: '📈' },
          { name: 'System Settings', href: '/admin/settings', icon: '⚙️' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="shadow-2xl h-full border-r" style={{ backgroundColor: '#1E3A8A', borderColor: '#3B82F6' }}>
      <div className="p-6">
        {/* Logo Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #3B82F6, #10B981)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">SkillForge</h2>
              <p className="text-xs capitalize" style={{ color: '#93C5FD' }}>{user?.role?.toLowerCase()} Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-lg transform scale-105'
                    : 'hover:text-white hover:scale-102'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#3B82F6' : 'transparent',
                color: isActive ? '#FFFFFF' : '#93C5FD',
                ':hover': {
                  backgroundColor: isActive ? '#3B82F6' : 'rgba(59, 130, 246, 0.1)'
                }
              })}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid #3B82F6' }}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)' }}>
              <span className="text-white text-sm font-bold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs truncate" style={{ color: '#93C5FD' }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
