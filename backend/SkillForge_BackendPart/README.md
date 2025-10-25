# SkillForge Backend

AI-Driven Adaptive Learning & Exam Generator - Backend API

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+
- MySQL 8.0+

### Database Setup
1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE skillforge_db;
   ```

2. **Run the setup script:**
   ```bash
   mysql -u root -p skillforge_db < database_setup.sql
   ```

3. **Update application.properties:**
   - Change `spring.datasource.password` to your MySQL password
   - Update `spring.datasource.username` if needed

### Running the Application
```bash
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

## 🏗️ Project Structure

```
src/main/java/com/skillforge/
├── config/
│   ├── JwtService.java          # JWT token management
│   ├── JwtAuthFilter.java       # JWT authentication filter
│   └── SecurityConfig.java      # Spring Security configuration
├── controller/
│   ├── AuthController.java      # Authentication endpoints
│   └── CourseController.java    # Course management endpoints
├── entity/
│   ├── User.java               # User entity with roles
│   └── Course.java             # Course entity
├── repository/
│   ├── UserRepository.java      # User data access
│   └── CourseRepository.java   # Course data access
├── service/
│   ├── AuthService.java        # Authentication business logic
│   └── CourseService.java     # Course management business logic
├── dto/
│   ├── AuthRequest.java        # Login request DTO
│   ├── AuthResponse.java       # Authentication response DTO
│   ├── RegisterRequest.java    # Registration request DTO
│   └── CourseDTO.java         # Course data transfer object
└── SkillForgeApplication.java   # Main application class
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Course Management (Instructor Only)
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course
- `PUT /api/courses/{id}` - Update course
- `DELETE /api/courses/{id}` - Delete course

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: 
  - `/api/courses/**` → INSTRUCTOR only
  - `/api/admin/**` → ADMIN only
  - `/api/student/**` → STUDENT only
- **CORS Configuration**: Allows `http://localhost:3000`
- **Password Encryption**: BCrypt password hashing

## 📊 Database Schema

### Users Table
- `id` (BIGINT, Primary Key)
- `first_name` (VARCHAR(50))
- `last_name` (VARCHAR(50))
- `email` (VARCHAR(100), Unique)
- `password` (VARCHAR(255))
- `role` (ENUM: STUDENT, INSTRUCTOR, ADMIN)

### Courses Table
- `id` (BIGINT, Primary Key)
- `title` (VARCHAR(100))
- `description` (TEXT)
- `difficulty_level` (ENUM: BEGINNER, INTERMEDIATE, ADVANCED)
- `estimated_duration` (INT)
- `prerequisites` (TEXT)
- `instructor_id` (BIGINT, Foreign Key)

## 🔧 Configuration

### Application Properties
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/skillforge_db
spring.datasource.username=root
spring.datasource.password=password

# JWT
jwt.secret=mySecretKey123456789012345678901234567890
jwt.expiration=86400000

# CORS
cors.allowed-origins=http://localhost:3000
```

## 🧪 Testing

### Sample Users
- **Student**: student@skillforge.com / password123
- **Instructor**: instructor@skillforge.com / password123
- **Admin**: admin@skillforge.com / password123

### Sample Courses
- JavaScript Fundamentals (Beginner)
- React Advanced Patterns (Advanced)
- Python for Data Science (Intermediate)

## 🚀 Deployment

1. **Build the application:**
   ```bash
   mvn clean package
   ```

2. **Run the JAR:**
   ```bash
   java -jar target/SkillForge_BackendPart-0.0.1-SNAPSHOT.jar
   ```

## 📝 API Usage Examples

### Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "STUDENT"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@skillforge.com",
    "password": "password123"
  }'
```

### Create Course (Requires JWT Token)
```bash
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "New Course",
    "description": "Course description",
    "difficultyLevel": "BEGINNER",
    "estimatedDuration": 10,
    "prerequisites": "Basic knowledge"
  }'
```
