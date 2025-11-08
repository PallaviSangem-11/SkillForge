package com.skillforge.controller;

import com.skillforge.entity.Feedback;
import com.skillforge.entity.Course;
import com.skillforge.entity.User;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.FeedbackRepository;
import com.skillforge.repository.UserRepository;
import com.skillforge.repository.QuizAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "http://localhost:3000")
public class FeedbackController {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @PostMapping("/{courseId}/feedback")
    public ResponseEntity<?> submitFeedback(@PathVariable Long courseId,
                                            @RequestParam(required = false) Long userId,
                                            @RequestBody Feedback body) {
        // If userId not provided in params, try to get from body or authentication
        Long actualUserId = userId;
        if (actualUserId == null && body.getUser() != null) {
            actualUserId = body.getUser().getId();
        }
        if (actualUserId == null) {
            org.springframework.security.core.Authentication auth = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            java.util.Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                actualUserId = userOpt.get().getId();
            }
        }
        if (actualUserId == null) {
            return ResponseEntity.badRequest().body("User ID is required");
        }
        Course course = courseRepository.findById(courseId).orElseThrow();
        User user = userRepository.findById(actualUserId).orElseThrow();
        Feedback f = new Feedback();
        f.setCourse(course);
        f.setUser(user);
        f.setRating(body.getRating());
        f.setComments(body.getComments());
        f.setTopics(body.getTopics());
        f.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(feedbackRepository.save(f));
    }

    @GetMapping("/{courseId}/feedback")
    public ResponseEntity<List<Feedback>> listFeedback(@PathVariable Long courseId) {
        return ResponseEntity.ok(feedbackRepository.findByCourseId(courseId));
    }

    // Get feedback summaries for instructor's courses
    @GetMapping("/instructor/feedback-summaries")
    public ResponseEntity<?> getFeedbackSummariesForInstructor(
            @RequestParam(required = false) Long instructorId) {
        try {
            // If instructorId not provided, get from authenticated user
            if (instructorId == null) {
                org.springframework.security.core.Authentication auth = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                String email = auth.getName();
                java.util.Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isEmpty() || userOpt.get().getRole() != User.Role.INSTRUCTOR) {
                    return ResponseEntity.badRequest().body("User is not an instructor");
                }
                instructorId = userOpt.get().getId();
            }

            // Get all courses for this instructor
            List<Course> courses = courseRepository.findByInstructorId(instructorId);
            List<java.util.Map<String, Object>> summaries = new java.util.ArrayList<>();

            for (Course course : courses) {
                java.util.Map<String, Object> summary = new java.util.HashMap<>();
                summary.put("courseId", course.getId());
                summary.put("courseTitle", course.getTitle());
                
                // Get feedback from feedback table
                List<Feedback> feedbacks = feedbackRepository.findByCourseId(course.getId());
                summary.put("feedbackCount", feedbacks.size());
                
                // Get quiz attempt feedbacks (from quiz_attempts table)
                List<com.skillforge.entity.QuizAttempt> attempts = 
                    quizAttemptRepository.findByQuizCourseId(course.getId());
                long feedbackAttempts = attempts.stream()
                    .filter(a -> a.getFeedback() != null && !a.getFeedback().trim().isEmpty())
                    .count();
                summary.put("quizFeedbackCount", feedbackAttempts);
                
                // Collect all feedback texts
                List<String> allFeedback = new java.util.ArrayList<>();
                feedbacks.forEach(f -> {
                    if (f.getComments() != null && !f.getComments().trim().isEmpty()) {
                        allFeedback.add(f.getComments());
                    }
                });
                attempts.forEach(a -> {
                    if (a.getFeedback() != null && !a.getFeedback().trim().isEmpty()) {
                        allFeedback.add(a.getFeedback());
                    }
                });
                summary.put("allFeedback", allFeedback);
                
                // Calculate average score
                Double avgScore = quizAttemptRepository.findAverageScoreByCourseId(course.getId());
                summary.put("averageScore", avgScore != null ? avgScore : 0.0);
                
                summaries.add(summary);
            }

            return ResponseEntity.ok(summaries);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
