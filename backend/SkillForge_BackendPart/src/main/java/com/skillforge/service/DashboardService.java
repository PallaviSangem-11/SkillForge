package com.skillforge.service;

import com.skillforge.dto.*;
import com.skillforge.entity.*;
import com.skillforge.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseEnrollmentRepository enrollmentRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private CourseService courseService;

    public StudentDashboardDTO getStudentDashboard(Long studentId) {
        StudentDashboardDTO dashboard = new StudentDashboardDTO();

        // Get recommended courses (AI-based)
        List<Course> recommended = recommendationService.recommendForStudent(studentId);
        dashboard.setRecommendedCourses(recommended.stream()
                .map(c -> courseService.convertToDTO(c))
                .collect(Collectors.toList()));

        // Get enrolled courses
        List<CourseEnrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        dashboard.setEnrolledCourses(enrollments.stream()
                .filter(e -> e.getUnenrolledAt() == null)
                .map(e -> courseService.convertToDTO(e.getCourse()))
                .collect(Collectors.toList()));

        // Get recent activities
        List<QuizAttempt> recentAttempts = quizAttemptRepository.findByStudentIdWithQuizCourse(studentId);
        List<RecentActivityDTO> activities = new ArrayList<>();
        
        // Add quiz attempts
        recentAttempts.stream()
                .limit(10)
                .forEach(attempt -> {
                    RecentActivityDTO activity = new RecentActivityDTO();
                    activity.setActivityType("QUIZ_ATTEMPT");
                    activity.setTitle(attempt.getQuiz() != null ? attempt.getQuiz().getTitle() : "Quiz");
                    activity.setTimestamp(attempt.getAttemptedAt());
                    activity.setScore(attempt.getScore());
                    activity.setQuizId(attempt.getQuiz() != null ? attempt.getQuiz().getId() : null);
                    activity.setCourseId(attempt.getQuiz() != null && attempt.getQuiz().getCourse() != null 
                            ? attempt.getQuiz().getCourse().getId() : null);
                    activities.add(activity);
                });

        // Add enrollments
        enrollments.stream()
                .filter(e -> e.getEnrolledAt() != null)
                .sorted((a, b) -> b.getEnrolledAt().compareTo(a.getEnrolledAt()))
                .limit(5)
                .forEach(enrollment -> {
                    RecentActivityDTO activity = new RecentActivityDTO();
                    activity.setActivityType("COURSE_ENROLLMENT");
                    activity.setTitle(enrollment.getCourse().getTitle());
                    activity.setTimestamp(enrollment.getEnrolledAt());
                    activity.setCourseId(enrollment.getCourse().getId());
                    activities.add(activity);
                });

        activities.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        dashboard.setRecentActivities(activities.stream().limit(10).collect(Collectors.toList()));

        // Calculate overall score
        double overallScore = recentAttempts.stream()
                .filter(a -> a.getScore() != null)
                .mapToDouble(QuizAttempt::getScore)
                .average()
                .orElse(0.0);
        dashboard.setOverallScore(overallScore);

        // Progress data for graphs
        Map<String, Object> progressData = new HashMap<>();
        List<Map<String, Object>> analytics = analyticsService.studentAnalytics(studentId);
        progressData.put("courseAnalytics", analytics);
        
        // Score progression over time
        List<Map<String, Object>> scoreProgression = new ArrayList<>();
        recentAttempts.stream()
                .filter(a -> a.getScore() != null && a.getAttemptedAt() != null)
                .sorted(Comparator.comparing(QuizAttempt::getAttemptedAt))
                .forEach(a -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("date", a.getAttemptedAt().toString());
                    point.put("score", a.getScore());
                    point.put("quiz", a.getQuiz() != null ? a.getQuiz().getTitle() : "Unknown");
                    scoreProgression.add(point);
                });
        progressData.put("scoreProgression", scoreProgression);
        dashboard.setProgressData(progressData);

        dashboard.setTotalQuizzesAttempted(recentAttempts.size());
        dashboard.setTotalCoursesEnrolled((int) enrollments.stream().filter(e -> e.getUnenrolledAt() == null).count());

        return dashboard;
    }

    public InstructorDashboardDTO getInstructorDashboard(Long instructorId) {
        InstructorDashboardDTO dashboard = new InstructorDashboardDTO();

        // Get courses created
        List<Course> courses = courseRepository.findByInstructorId(instructorId);
        dashboard.setTotalCoursesCreated(courses.size());

        // Get total students enrolled across all courses
        long totalStudents = 0;
        for (Course course : courses) {
            totalStudents += enrollmentRepository.countByCourseId(course.getId());
        }
        dashboard.setTotalStudentsEnrolled((int) totalStudents);

        // Recent activities
        List<RecentActivityDTO> activities = new ArrayList<>();
        
        // Recent quiz attempts in instructor's courses
        courses.forEach(course -> {
            List<QuizAttempt> attempts = quizAttemptRepository.findByQuizCourseId(course.getId());
            attempts.stream()
                    .limit(5)
                    .forEach(attempt -> {
                        RecentActivityDTO activity = new RecentActivityDTO();
                        activity.setActivityType("QUIZ_ATTEMPT");
                        activity.setTitle(attempt.getQuiz() != null ? attempt.getQuiz().getTitle() : "Quiz");
                        activity.setTimestamp(attempt.getAttemptedAt());
                        activity.setScore(attempt.getScore());
                        activity.setQuizId(attempt.getQuiz() != null ? attempt.getQuiz().getId() : null);
                        activity.setCourseId(course.getId());
                        activities.add(activity);
                    });
        });

        activities.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        dashboard.setRecentActivities(activities.stream().limit(10).collect(Collectors.toList()));

        // Course stats
        List<CourseStatsDTO> courseStats = new ArrayList<>();
        for (Course course : courses) {
            CourseStatsDTO stats = new CourseStatsDTO();
            stats.setCourseId(course.getId());
            stats.setCourseTitle(course.getTitle());
            stats.setStudentCount((int) enrollmentRepository.countByCourseId(course.getId()));
            
            Double avgScore = quizAttemptRepository.findAverageScoreByCourseId(course.getId());
            stats.setAverageScore(avgScore != null ? avgScore : 0.0);
            
            courseStats.add(stats);
        }
        dashboard.setCourseStats(courseStats);

        return dashboard;
    }

    public AdminDashboardDTO getAdminDashboard() {
        AdminDashboardDTO dashboard = new AdminDashboardDTO();

        dashboard.setTotalStudents((int) userRepository.countByRole(User.Role.STUDENT));
        dashboard.setTotalInstructors((int) userRepository.countByRole(User.Role.INSTRUCTOR));
        dashboard.setTotalCourses((int) courseRepository.count());

        Map<String, Object> platformStats = new HashMap<>();
        platformStats.put("totalQuizzes", quizRepository.count());
        platformStats.put("totalEnrollments", enrollmentRepository.count());
        platformStats.put("totalQuizAttempts", quizAttemptRepository.count());
        dashboard.setPlatformStats(platformStats);

        return dashboard;
    }
}

