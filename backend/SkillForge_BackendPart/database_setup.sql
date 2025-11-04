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

-- ============================
-- WindSurf Spec Alignment DDL
-- Safe, idempotent changes to align schema with normalized roles, enrollments,
-- quizzes/questions/options, results, feedback, and AI metadata.
-- ============================

-- Roles table (normalized roles)
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL
);

-- Users normalization: add username, password_hash, role_id; keep old columns for backfill
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL AFTER last_name,
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS role_id INT NULL AFTER password_hash;

-- Backfill username from email local-part where missing
UPDATE users SET username = SUBSTRING_INDEX(email, '@', 1)
WHERE (username IS NULL OR username = '');

-- Seed roles and backfill role_id from existing enum role
INSERT IGNORE INTO roles (name) VALUES ('STUDENT'),('INSTRUCTOR'),('ADMIN');
UPDATE users u
JOIN roles r ON r.name = u.role
SET u.role_id = r.id
WHERE u.role_id IS NULL;

-- Copy password into password_hash where missing
UPDATE users SET password_hash = password WHERE password_hash IS NULL;

-- Constraints and NOT NULLs
ALTER TABLE users
  ADD UNIQUE KEY IF NOT EXISTS ux_users_username (username),
  ADD UNIQUE KEY IF NOT EXISTS ux_users_email (email);

-- Add FK once role_id populated
ALTER TABLE users
  ADD CONSTRAINT IF NOT EXISTS fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id);

-- Enrollments table with toggleable enrolled/unenrolled timestamps
CREATE TABLE IF NOT EXISTS enrollments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  enrolled_at TIMESTAMP NULL,
  unenrolled_at TIMESTAMP NULL,
  UNIQUE KEY ux_user_course (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Quizzes: ensure AI metadata columns
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS generated_by ENUM('instructor','ai') DEFAULT 'instructor',
  ADD COLUMN IF NOT EXISTS ai_generation_meta JSON NULL,
  MODIFY COLUMN title VARCHAR(255);

-- Questions: add normalized fields to support topics/metadata
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS text TEXT NULL,
  ADD COLUMN IF NOT EXISTS metadata JSON NULL,
  MODIFY COLUMN type ENUM('mcq','short','code') DEFAULT 'mcq';

-- Options table for MCQs
CREATE TABLE IF NOT EXISTS options (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT NOT NULL,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Quiz results per user
CREATE TABLE IF NOT EXISTS quiz_results (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  score FLOAT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  rating INT NULL,
  comments TEXT,
  topics JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Suggested quizzes surfaced to specific user
CREATE TABLE IF NOT EXISTS suggested_quizzes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  quiz_id BIGINT NOT NULL,
  reason VARCHAR(255) NULL,
  is_shown BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-- Note: legacy columns (password, role) retained; app can migrate to password_hash/role_id progressively.
