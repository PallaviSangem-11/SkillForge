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
          { name: 'My Courses', href: '/student/courses', icon: '📚' },
          { name: 'Take Quiz', href: '/student/quiz', icon: '📝' },
          { name: 'Progress', href: '/student/progress', icon: '📈' },
        ];
      case ROLES.INSTRUCTOR:
        return [
          { name: 'Dashboard', href: '/instructor', icon: '📊' },
          { name: 'My Courses', href: '/instructor/courses', icon: '📚' },
          { name: 'Add Course', href: '/instructor/courses/add', icon: '➕' },
          { name: 'Generate Quiz', href: '/instructor/quiz', icon: '🎯' },
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
    <div className="bg-white shadow-sm h-full">
      <div className="p-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
