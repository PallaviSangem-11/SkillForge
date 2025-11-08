package com.skillforge.service;

import com.skillforge.entity.Course;
import com.skillforge.entity.CourseEnrollment;
import com.skillforge.entity.QuizAttempt;
import com.skillforge.entity.Feedback;
import com.skillforge.repository.CourseEnrollmentRepository;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.QuizAttemptRepository;
import com.skillforge.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseEnrollmentRepository enrollmentRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    public List<Course> recommendForStudent(Long studentId) {
        if (studentId == null) {
            return new ArrayList<>();
        }

        // Fetch attempts with quiz->course eagerly
        List<QuizAttempt> attempts;
        try {
            attempts = quizAttemptRepository.findByStudentIdWithQuizCourse(studentId);
        } catch (Throwable t) {
            try {
                attempts = quizAttemptRepository.findByStudentId(studentId);
            } catch (Throwable t2) {
                attempts = new ArrayList<>();
            }
        }

        // Get enrolled courses
        List<CourseEnrollment> enrolled = new ArrayList<>();
        try {
            enrolled = enrollmentRepository.findByStudentId(studentId);
        } catch (Throwable ignored) {
        }

        Set<Long> enrolledCourseIds = new HashSet<>();
        if (enrolled != null) {
            for (CourseEnrollment ce : enrolled) {
                if (ce != null && ce.getCourse() != null) {
                    enrolledCourseIds.add(ce.getCourse().getId());
                }
            }
        }

        // Group attempts by course and calculate metrics
        Map<Long, CourseRecommendationScore> courseScores = new HashMap<>();

        // Process attempts for enrolled courses
        for (QuizAttempt attempt : attempts) {
            if (attempt == null || attempt.getQuiz() == null || attempt.getQuiz().getCourse() == null) {
                continue;
            }

            Long courseId = attempt.getQuiz().getCourse().getId();
            CourseRecommendationScore score = courseScores.computeIfAbsent(
                    courseId,
                    k -> new CourseRecommendationScore(courseId)
            );

            // Add score
            if (attempt.getScore() != null) {
                score.addScore(attempt.getScore());
            }

            // Add activity (attempt count)
            score.incrementActivity();

            // Analyze feedback sentiment
            if (attempt.getFeedback() != null && !attempt.getFeedback().trim().isEmpty()) {
                score.addFeedback(analyzeFeedbackSentiment(attempt.getFeedback()));
            }
        }

        // Get all courses for popularity scoring
        List<Course> allCourses = new ArrayList<>();
        try {
            allCourses = courseRepository.findAll();
        } catch (Throwable ignored) {
            allCourses = new ArrayList<>();
        }

        // Calculate popularity scores for all courses
        for (Course course : allCourses) {
            if (course == null) {
                continue;
            }

            Long courseId = course.getId();
            if (!courseScores.containsKey(courseId)) {
                courseScores.put(courseId, new CourseRecommendationScore(courseId));
            }

            CourseRecommendationScore score = courseScores.get(courseId);

            // Calculate enrollment count (popularity) using course-specific query to avoid loading all enrollments
            try {
                long enrollmentCount = enrollmentRepository.findByCourseId(courseId).stream()
                        .filter(e -> e.getUnenrolledAt() == null)
                        .count();
                score.setPopularity(enrollmentCount);
            } catch (Throwable ignored) {
            }

            // Get overall feedback for course
            try {
                List<Feedback> courseFeedbacks = feedbackRepository.findByCourseId(courseId);
                if (courseFeedbacks != null && !courseFeedbacks.isEmpty()) {
                    double avgRating = courseFeedbacks.stream()
                            .filter(f -> f.getRating() != null)
                            .mapToDouble(Feedback::getRating)
                            .average()
                            .orElse(0.0);
                    score.setOverallFeedbackRating(avgRating);

                    // Analyze feedback comments
                    for (Feedback feedback : courseFeedbacks) {
                        if (feedback.getComments() != null && !feedback.getComments().trim().isEmpty()) {
                            score.addFeedback(analyzeFeedbackSentiment(feedback.getComments()));
                        }
                    }
                }
            } catch (Throwable ignored) {
            }
        }

        // Calculate final recommendation scores
        List<CourseRecommendation> recommendations = new ArrayList<>();
        final double REVIEW_THRESHOLD = 70.0;

        for (Map.Entry<Long, CourseRecommendationScore> entry : courseScores.entrySet()) {
            Long courseId = entry.getKey();
            CourseRecommendationScore score = entry.getValue();

            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (courseOpt.isEmpty()) {
                continue;
            }

            Course course = courseOpt.get();
            boolean isEnrolled = enrolledCourseIds.contains(courseId);

            // Calculate weighted recommendation score
            double recommendationScore = score.calculateRecommendationScore();

            // Prioritize courses where:
            // 1. Student is enrolled but needs improvement (low scores)
            // 2. Course has high popularity and good feedback
            // 3. Student has positive feedback but needs practice
            if (isEnrolled) {
                // High priority if enrolled but needs improvement
                if (score.getAverageScore() < REVIEW_THRESHOLD) {
                    recommendationScore += 50.0; // High priority boost
                } else if (score.getFeedbackSentiment() > 0.5 && score.getAverageScore() < 80.0) {
                    recommendationScore += 30.0; // Positive feedback but needs practice
                }
            } else {
                // For unenrolled courses, consider popularity and overall feedback
                if (score.getPopularity() > 10 && score.getOverallFeedbackRating() > 3.5) {
                    recommendationScore += 40.0; // Popular and well-received
                }
            }

            recommendations.add(new CourseRecommendation(course, recommendationScore, isEnrolled));
        }

        // Sort by recommendation score (descending)
        recommendations.sort((a, b) -> Double.compare(b.score, a.score));

        // Return top recommendations (limit to 10)
        return recommendations.stream()
                .limit(10)
                .map(r -> r.course)
                .collect(Collectors.toList());
    }

    /**
     * Analyze feedback sentiment (simple keyword-based approach) Returns: -1.0
     * (negative) to 1.0 (positive)
     */
    private double analyzeFeedbackSentiment(String feedback) {
        if (feedback == null || feedback.trim().isEmpty()) {
            return 0.0;
        }

        String lower = feedback.toLowerCase();
        double sentiment = 0.0;

        // Positive indicators
        String[] positiveWords = {"good", "great", "excellent", "helpful", "useful", "clear", "understand", "easy", "love", "amazing", "wonderful"};
        for (String word : positiveWords) {
            if (lower.contains(word)) {
                sentiment += 0.15;
            }
        }

        // Negative indicators
        String[] negativeWords = {"difficult", "hard", "confusing", "unclear", "bad", "poor", "terrible", "hate", "disappoint", "waste", "useless"};
        for (String word : negativeWords) {
            if (lower.contains(word)) {
                sentiment -= 0.15;
            }
        }

        // Clamp to [-1, 1]
        return Math.max(-1.0, Math.min(1.0, sentiment));
    }

    // Helper classes for scoring
    private static class CourseRecommendationScore {

        private Long courseId;
        private List<Double> scores = new ArrayList<>();
        private int activityCount = 0;
        private List<Double> feedbackSentiments = new ArrayList<>();
        private long popularity = 0;
        private double overallFeedbackRating = 0.0;

        public CourseRecommendationScore(Long courseId) {
            this.courseId = courseId;
        }

        public void addScore(double score) {
            scores.add(score);
        }

        public void incrementActivity() {
            activityCount++;
        }

        public void addFeedback(double sentiment) {
            feedbackSentiments.add(sentiment);
        }

        public void setPopularity(long popularity) {
            this.popularity = popularity;
        }

        public void setOverallFeedbackRating(double rating) {
            this.overallFeedbackRating = rating;
        }

        public double getAverageScore() {
            return scores.isEmpty() ? 0.0 : scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        }

        public double getFeedbackSentiment() {
            return feedbackSentiments.isEmpty() ? 0.0 : feedbackSentiments.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        }

        public long getPopularity() {
            return popularity;
        }

        public double getOverallFeedbackRating() {
            return overallFeedbackRating;
        }

        public double calculateRecommendationScore() {
            double score = 0.0;

            // Score component (40% weight)
            double avgScore = getAverageScore();
            score += (avgScore / 100.0) * 40.0;

            // Activity component (20% weight) - normalized to 0-20
            double activityScore = Math.min(activityCount * 5.0, 20.0);
            score += activityScore;

            // Feedback sentiment (20% weight) - normalized from [-1,1] to [0,20]
            double feedbackScore = (getFeedbackSentiment() + 1.0) / 2.0 * 20.0;
            score += feedbackScore;

            // Popularity (20% weight) - normalized
            double popularityScore = Math.min(popularity / 5.0, 20.0);
            score += popularityScore;

            return score;
        }
    }

    private static class CourseRecommendation {

        Course course;
        double score;
        boolean enrolled;

        public CourseRecommendation(Course course, double score, boolean enrolled) {
            this.course = course;
            this.score = score;
            this.enrolled = enrolled;
        }
    }
}
