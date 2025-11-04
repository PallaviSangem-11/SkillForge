import React from 'react';
import { useAuth } from '../auth/useAuth';
import { getRoleDisplayName } from '../utils/roles';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="shadow-2xl border-b" style={{ backgroundColor: '#1E3A8A', borderColor: '#3B82F6' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #10B981)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">SkillForge</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {user && (
              <>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs" style={{ color: '#93C5FD' }}>
                      {getRoleDisplayName(user.role)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)' }}>
                    <span className="text-white text-sm font-bold">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                </div>
                
                <div className="h-6 w-px" style={{ backgroundColor: '#3B82F6' }}></div>
                
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{ 
                    color: '#93C5FD',
                    ':hover': {
                      color: '#FFFFFF',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)'
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#FFFFFF';
                    e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#93C5FD';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
