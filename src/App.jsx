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
import Landing from './pages/Landing';
import Language from './pages/Language';
import Register from './pages/Register';
import StudentDashboard from './pages/Dashboard/StudentDashboard';
import InstructorDashboard from './pages/Dashboard/InstructorDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import AddCourse from './pages/Courses/AddCourse';
import CourseList from './pages/Courses/CourseList';
import StudentCourseList from './pages/Courses/StudentCourseList';
import CourseOperations from './pages/Courses/CourseOperations';
import RecommendedCoursesPage from './pages/RecommendedCourses';
import GenerateQuiz from './pages/Courses/GenerateQuiz';
import TakeQuiz from './pages/Quiz/TakeQuiz';
import TakeQuizList from './pages/Quiz/TakeQuizList';
import QuizResponse from './pages/Quiz/QuizResponse';
import StudentProgress from './pages/Progress/StudentProgress';
import CourseDetails from './pages/Courses/CourseDetails';
import ManageUsers from './pages/Admin/ManageUsers';
import AllCourses from './pages/Admin/AllCourses';
import Reports from './pages/Admin/Reports';
import SystemSettings from './pages/Admin/SystemSettings';
import TestAdmin from './pages/Admin/TestAdmin';
import CreateAdmin from './pages/CreateAdmin';
import PromoteToAdmin from './pages/PromoteToAdmin';
import CheckAuth from './pages/CheckAuth';

import { useAuth } from './auth/useAuth';
import { ROLES } from './utils/roles';

// Layout component for authenticated routes
const AuthenticatedLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1E3A8A' }}>
      <Navbar />
      <div className="flex">
        <div className="w-64 min-h-screen">
          <Sidebar />
        </div>
        <main className="flex-1 p-8 min-h-screen" style={{ backgroundColor: '#F3F4F6' }}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
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
        path="/" 
        element={<Landing />} 
      />
      <Route 
        path="/language" 
        element={<Language />} 
      />
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
        path="/student/recommended" 
        element={
          <PrivateRoute requiredRole={ROLES.STUDENT}>
            <AuthenticatedLayout>
              <RecommendedCoursesPage />
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
      <Route 
        path="/student/quiz/:quizId" 
        element={
          <PrivateRoute requiredRole={ROLES.STUDENT}>
            <AuthenticatedLayout>
              <TakeQuiz />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/student/quiz/:quizId/response" 
        element={
          <PrivateRoute requiredRole={ROLES.STUDENT}>
            <AuthenticatedLayout>
              <QuizResponse />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/student/progress" 
        element={
          <PrivateRoute requiredRole={ROLES.STUDENT}>
            <AuthenticatedLayout>
              <StudentProgress />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/student/quiz-list" 
        element={
          <PrivateRoute requiredRole={ROLES.STUDENT}>
            <AuthenticatedLayout>
              <TakeQuizList />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      {/* Course details route (authenticated users) */}
      <Route 
        path="/courses/:id" 
        element={
          <PrivateRoute>
            <AuthenticatedLayout>
              <CourseDetails />
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
        path="/instructor/recommended" 
        element={
          <PrivateRoute requiredRole={ROLES.INSTRUCTOR}>
            <AuthenticatedLayout>
              <RecommendedCoursesPage />
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
        path="/instructor/quiz" 
        element={
          <PrivateRoute requiredRole={ROLES.INSTRUCTOR}>
            <AuthenticatedLayout>
              <GenerateQuiz />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      {/* Removed separate RecommendationQuiz page — using CourseOperations for quiz recommendations */}
      <Route 
        path="/instructor/course-operations" 
        element={
          <PrivateRoute requiredRole={ROLES.INSTRUCTOR}>
            <AuthenticatedLayout>
              <CourseOperations />
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
      <Route 
        path="/admin/users" 
        element={
          <PrivateRoute requiredRole={ROLES.ADMIN}>
            <AuthenticatedLayout>
              <ManageUsers />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/admin/courses" 
        element={
          <PrivateRoute requiredRole={ROLES.ADMIN}>
            <AuthenticatedLayout>
              <AllCourses />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <PrivateRoute requiredRole={ROLES.ADMIN}>
            <AuthenticatedLayout>
              <Reports />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <PrivateRoute requiredRole={ROLES.ADMIN}>
            <AuthenticatedLayout>
              <SystemSettings />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/admin/test" 
        element={
          <PrivateRoute requiredRole={ROLES.ADMIN}>
            <AuthenticatedLayout>
              <TestAdmin />
            </AuthenticatedLayout>
          </PrivateRoute>
        } 
      />

      {/* Public routes */}
      <Route path="/create-admin" element={<CreateAdmin />} />
      <Route path="/promote-to-admin" element={<PromoteToAdmin />} />
      <Route path="/check-auth" element={<CheckAuth />} />

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
