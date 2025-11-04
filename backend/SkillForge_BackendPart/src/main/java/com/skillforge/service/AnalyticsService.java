package com.skillforge.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.skillforge.entity.Course;
import com.skillforge.entity.QuizAttempt;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.QuizAttemptRepository;

@Service
public class AnalyticsService {

    @Autowired
    private QuizAttemptRepository attemptRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private com.skillforge.repository.CourseEnrollmentRepository enrollmentRepository;

    @Autowired
    private com.skillforge.repository.UserRepository userRepository;

    private Map<String, Object> getQuizStatistics(Long courseId) {
        Map<String, Object> stats = new HashMap<>();
        try {
            List<QuizAttempt> attempts = attemptRepository.findByQuizCourseId(courseId);
            
            int totalAttempts = 0;
            double totalScore = 0.0;
            double highestScore = 0.0;
            double lowestScore = 100.0;
            
            for (QuizAttempt attempt : attempts) {
                if (attempt != null && attempt.getScore() != null && attempt.getScore() >= 0) {
                    totalAttempts++;
                    double score = attempt.getScore();
                    totalScore += score;
                    highestScore = Math.max(highestScore, score);
                    lowestScore = Math.min(lowestScore, score);
                }
            }
            
            stats.put("totalAttempts", totalAttempts);
            stats.put("averageScore", totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 100.0) / 100.0 : 0.0);
            stats.put("highestScore", totalAttempts > 0 ? highestScore : 0.0);
            stats.put("lowestScore", totalAttempts > 0 ? lowestScore : 0.0);
            
        } catch (Exception e) {
            stats.put("error", "Failed to fetch quiz statistics: " + e.getMessage());
        }
        return stats;
    }

    // Returns detailed analytics for a student: course progress, quiz performance, and time spent
    public List<Map<String, Object>> studentAnalytics(Long studentId) {
        if (studentId == null) {
            throw new IllegalArgumentException("Student ID cannot be null");
        }

        List<Map<String, Object>> analytics = new ArrayList<>();

        try {
            // Get all enrollments for the student
            List<com.skillforge.entity.CourseEnrollment> enrollments
                    = enrollmentRepository.findByStudentId(studentId);

            // Get all quiz attempts
            List<QuizAttempt> allAttempts
                    = attemptRepository.findByStudentIdWithQuizCourse(studentId);

            // Group quiz attempts by course
            Map<Long, List<QuizAttempt>> attemptsByCourse = new HashMap<>();
            for (QuizAttempt attempt : allAttempts) {
                if (attempt.getQuiz() != null && attempt.getQuiz().getCourse() != null) {
                    Long courseId = attempt.getQuiz().getCourse().getId();
                    attemptsByCourse.computeIfAbsent(courseId, k -> new ArrayList<>())
                            .add(attempt);
                }
            }

            // Process each enrolled course
            for (com.skillforge.entity.CourseEnrollment enrollment : enrollments) {
                Course course = enrollment.getCourse();
                if (course == null) {
                    continue;
                }

                Map<String, Object> courseStats = new HashMap<>();
                courseStats.put("courseId", course.getId());
                courseStats.put("title", course.getTitle());
                courseStats.put("enrolledAt", enrollment.getEnrolledAt());

                // Calculate time spent
                long timeSpentMinutes = 0;
                if (enrollment.getEnrolledAt() != null) {
                    java.time.LocalDateTime endTime = enrollment.getUnenrolledAt() != null
                            ? enrollment.getUnenrolledAt() : java.time.LocalDateTime.now();
                    timeSpentMinutes = java.time.Duration.between(
                            enrollment.getEnrolledAt(), endTime).toMinutes();
                }
                courseStats.put("timeSpentMinutes", timeSpentMinutes);

                // Process quiz attempts for this course
                List<QuizAttempt> courseAttempts = attemptsByCourse.getOrDefault(course.getId(), new ArrayList<>());
                double avgScore = courseAttempts.stream()
                        .filter(a -> a.getScore() != null)
                        .mapToDouble(QuizAttempt::getScore)
                        .average()
                        .orElse(0.0);

                courseStats.put("quizAttempts", courseAttempts.size());
                courseStats.put("averageScore", Math.round(avgScore * 100.0) / 100.0);
                courseStats.put("lastAttemptDate", courseAttempts.isEmpty() ? null
                        : courseAttempts.get(courseAttempts.size() - 1).getAttemptedAt());

                analytics.add(courseStats);
            }

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to fetch student analytics: " + e.getMessage());
            analytics.add(error);
        }

        return analytics;
    }

    // Course-level analytics: enrollment stats and quiz performance
    public Map<String, Object> courseAnalytics(Long courseId) {
        Map<String, Object> result = new HashMap<>();

        try {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new IllegalArgumentException("Course not found"));

            // Basic course info
            result.put("courseId", courseId);
            result.put("title", course.getTitle());

            // Enrollment statistics
            long enrolledCount = enrollmentRepository.countByCourseId(courseId);
            result.put("totalEnrolled", enrolledCount);

            // Quiz attempts and performance
            List<QuizAttempt> attempts = attemptRepository.findByQuizCourseId(courseId);
            int attemptCount = 0;
            double totalScore = 0;

            for (QuizAttempt attempt : attempts) {
                if (attempt.getScore() != null) {
                    attemptCount++;
                    totalScore += attempt.getScore();
                }
            }

            double averageScore = attemptCount > 0 ? totalScore / attemptCount : 0;

            result.put("quizAttempts", attemptCount);
            result.put("averageScore", Math.round(averageScore * 100.0) / 100.0);
            result.put("hasQuizzes", !attempts.isEmpty());

        } catch (Exception e) {
            result.put("error", "Failed to fetch course analytics: " + e.getMessage());
        }

        return result;
    }

    // Instructor-level analytics with detailed course statistics
    public Map<String, Object> instructorAnalytics(Long instructorId) {
        if (instructorId == null) {
            throw new IllegalArgumentException("Instructor ID cannot be null");
        }

        Map<String, Object> result = new HashMap<>();
        
        try {
            // Verify instructor exists and has INSTRUCTOR role
            com.skillforge.entity.User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new IllegalArgumentException("Instructor not found"));
            
            if (instructor.getRole() != com.skillforge.entity.User.Role.INSTRUCTOR) {
                throw new IllegalArgumentException("User is not an instructor");
            }

            // Get instructor's courses
            List<Course> courses = courseRepository.findByInstructorId(instructorId);
            if (courses.isEmpty()) {
                result.put("message", "No courses found for this instructor");
                return result;
            }            // Track unique students and total engagement time
            Set<Long> uniqueStudents = new HashSet<>();
            Map<Long, Integer> courseTimeSpent = new HashMap<>(); // course ID -> minutes
            List<Map<String, Object>> courseAnalytics = new ArrayList<>();

            // Process each course
            for (Course course : courses) {
                Map<String, Object> courseStats = new HashMap<>();
                courseStats.put("courseId", course.getId());
                courseStats.put("title", course.getTitle());

                // Get all enrollments for this course
                List<com.skillforge.entity.CourseEnrollment> enrollments
                        = enrollmentRepository.findByCourseId(course.getId());

                int courseEnrollments = 0;
                int totalMinutes = 0;

                // Process enrollments
                for (com.skillforge.entity.CourseEnrollment enrollment : enrollments) {
                    if (enrollment.getStudent() != null) {
                        uniqueStudents.add(enrollment.getStudent().getId());
                        courseEnrollments++;

                        // Calculate engagement time
                        if (enrollment.getEnrolledAt() != null) {
                            try {
                                java.time.LocalDateTime endTime
                                        = enrollment.getUnenrolledAt() != null
                                        ? enrollment.getUnenrolledAt()
                                        : java.time.LocalDateTime.now();

                                int minutes = (int) java.time.Duration.between(
                                        enrollment.getEnrolledAt(),
                                        endTime
                                ).toMinutes();

                                totalMinutes += Math.max(0, minutes); // Avoid negative durations
                            } catch (Exception e) {
                                // Skip invalid dates
                                System.err.println("Error calculating duration for enrollment "
                                        + enrollment.getId() + ": " + e.getMessage());
                            }
                        }
                    }
                }

                // Get quiz statistics and performance metrics
                Map<String, Object> quizStats = getQuizStatistics(course.getId());

                // Populate course statistics
                courseStats.put("enrollments", courseEnrollments);
                courseStats.put("timeSpentMinutes", totalMinutes);
                courseStats.putAll(quizStats);

                courseTimeSpent.put(course.getId(), totalMinutes);
                courseAnalytics.add(courseStats);
            }

            // Sort courses by enrollment count for popularity ranking
            courseAnalytics.sort((a, b)
                    -> Integer.compare(
                            (Integer) b.get("enrollments"),
                            (Integer) a.get("enrollments")
                    ));

            // Calculate instructor-level statistics
            int totalStudents = uniqueStudents.size();
            int totalTimeSpent = courseTimeSpent.values().stream().mapToInt(Integer::intValue).sum();

            // Populate result map
            result.put("totalStudents", totalStudents);
            result.put("totalCourses", courses.size());
            result.put("totalTimeSpentMinutes", totalTimeSpent);
            result.put("averageTimePerStudent",
                    totalStudents > 0 ? Math.round((double) totalTimeSpent / totalStudents) : 0);

            // Add course analytics with popularity ranking
            result.put("courses", courseAnalytics);

            // Add top 3 most popular courses
            result.put("popularCourses",
                    courseAnalytics.stream()
                            .limit(3)
                            .map(c -> Map.of(
                            "id", c.get("courseId"),
                            "title", c.get("title"),
                            "enrollments", c.get("enrollments"),
                            "avgScore", c.get("averageScore")
                    ))
                            .toList()
            );

        } catch (Exception e) {
            result.put("error", "Failed to generate instructor analytics: " + e.getMessage());
        }

        return result;
    }
}
