import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './auth/AuthContext';
import PrivateRoute from './auth/PrivateRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Loader from './components/Loader';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/Dashboard/StudentDashboard';
import InstructorDashboard from './pages/Dashboard/InstructorDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import AddCourse from './pages/Courses/AddCourse';
import CourseList from './pages/Courses/CourseList';
import StudentCourseList from './pages/Courses/StudentCourseList';

import { useAuth } from './auth/useAuth';
import { ROLES } from './utils/roles';

// Layout component for authenticated routes
const AuthenticatedLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <div className="w-64 min-h-screen bg-white shadow-sm">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// App Routes component
const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={
              user?.role === ROLES.STUDENT ? '/student' :
              user?.role === ROLES.INSTRUCTOR ? '/instructor' :
              user?.role === ROLES.ADMIN ? '/admin' : '/student'
            } replace />
          ) : (
            <Login />
          )
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? (
            <Navigate to={
              user?.role === ROLES.STUDENT ? '/student' :
              user?.role === ROLES.INSTRUCTOR ? '/instructor' :
              user?.role === ROLES.ADMIN ? '/admin' : '/student'
            } replace />
          ) : (
            <Register />
          )
        } 
      />

      {/* Student Routes */}
      <Route 
        path="/student" 
        element={
          <PrivateRoute requiredRole={ROLES.STUDENT}>
            <AuthenticatedLayout>
              <StudentDashboard />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/student/courses" 
        element={
          <PrivateRoute requiredRole={ROLES.STUDENT}>
            <AuthenticatedLayout>
              <StudentCourseList />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      {/* Instructor Routes */}
      <Route 
        path="/instructor" 
        element={
          <PrivateRoute requiredRole={ROLES.INSTRUCTOR}>
            <AuthenticatedLayout>
              <InstructorDashboard />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/instructor/courses" 
        element={
          <PrivateRoute requiredRole={ROLES.INSTRUCTOR}>
            <AuthenticatedLayout>
              <CourseList />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/instructor/courses/add" 
        element={
          <PrivateRoute requiredRole={ROLES.INSTRUCTOR}>
            <AuthenticatedLayout>
              <AddCourse />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <PrivateRoute requiredRole={ROLES.ADMIN}>
            <AuthenticatedLayout>
              <AdminDashboard />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
