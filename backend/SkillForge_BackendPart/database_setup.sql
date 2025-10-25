-- Create database
CREATE DATABASE IF NOT EXISTS skillforge_db;
USE skillforge_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'INSTRUCTOR', 'ADMIN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    difficulty_level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL,
    estimated_duration INT,
    prerequisites TEXT,
    instructor_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO users (first_name, last_name, email, password, role) VALUES
('John', 'Doe', 'student@skillforge.com', '$2a$10$N.zmdr9k7uOCQb376NoUn7e6kEGKj8j8j8j8j8j8j8j8j8j8j8j8j8', 'STUDENT'),
('Sarah', 'Johnson', 'instructor@skillforge.com', '$2a$10$N.zmdr9k7uOCQb376NoUn7e6kEGKj8j8j8j8j8j8j8j8j8j8j8j8', 'INSTRUCTOR'),
('Admin', 'User', 'admin@skillforge.com', '$2a$10$N.zmdr9k7uOCQb376NoUn7e6kEGKj8j8j8j8j8j8j8j8j8j8j8j8', 'ADMIN');

-- Insert sample courses
INSERT INTO courses (title, description, difficulty_level, estimated_duration, prerequisites, instructor_id) VALUES
('JavaScript Fundamentals', 'Learn the basics of JavaScript programming including variables, functions, and DOM manipulation.', 'BEGINNER', 15, 'Basic HTML and CSS knowledge', 2),
('React Advanced Patterns', 'Master advanced React concepts including hooks, context, and performance optimization.', 'ADVANCED', 25, 'Solid understanding of JavaScript and React basics', 2),
('Python for Data Science', 'Introduction to Python programming for data analysis and machine learning.', 'INTERMEDIATE', 20, 'Basic programming knowledge', 2);
