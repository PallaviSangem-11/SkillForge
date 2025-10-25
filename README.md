# SkillForge Frontend

AI-Driven Adaptive Learning & Exam Generator - Frontend Application

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open Browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── api/
│   └── axiosConfig.js          # Axios configuration
├── auth/
│   ├── AuthContext.jsx        # Authentication context
│   ├── PrivateRoute.jsx        # Protected route component
│   └── useAuth.js              # Authentication hook
├── components/
│   ├── Navbar.jsx              # Navigation bar
│   ├── Sidebar.jsx             # Sidebar navigation
│   └── Loader.jsx              # Loading component
├── pages/
│   ├── Login.jsx               # Login page
│   ├── Register.jsx            # Registration page
│   ├── Dashboard/
│   │   ├── StudentDashboard.jsx
│   │   ├── InstructorDashboard.jsx
│   │   └── AdminDashboard.jsx
│   └── Courses/
│       ├── AddCourse.jsx       # Create new course
│       └── CourseList.jsx      # Manage courses
├── utils/
│   └── roles.js                # Role utilities
├── App.jsx                     # Main app component
├── App.css                     # Global styles
└── index.js                    # App entry point
```

## 🎯 Features Implemented

### Milestone 1: User Authentication & Role-Based Dashboard
- ✅ JWT-based authentication
- ✅ User registration and login
- ✅ Role-based routing (Student, Instructor, Admin)
- ✅ Protected routes with automatic redirects
- ✅ Global authentication state management

### Milestone 2: Instructor Course & Content Management
- ✅ Create new courses with validation
- ✅ View all instructor courses
- ✅ Edit course details inline
- ✅ Delete courses with confirmation
- ✅ Toast notifications for all actions
- ✅ Responsive design with Tailwind CSS

## 🔧 API Integration

The frontend connects to the backend at `http://localhost:8080/api` with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Courses (Instructor)
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/{id}` - Update course
- `DELETE /api/courses/{id}` - Delete course

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Role-Based Navigation**: Different sidebar menus for each user type
- **Toast Notifications**: Success/error feedback for all actions
- **Loading States**: Proper loading indicators throughout the app
- **Form Validation**: Client-side validation with error messages
- **Modern Design**: Clean, professional interface with Tailwind CSS

## 🔐 Authentication Flow

1. User visits any protected route → Redirected to login
2. User logs in → JWT token stored in localStorage
3. Token automatically attached to API requests
4. Role-based redirect to appropriate dashboard
5. Automatic logout on token expiration

## 🚀 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🔗 Backend Integration

Make sure your SkillForge backend is running on `http://localhost:8080` before starting the frontend development server.
