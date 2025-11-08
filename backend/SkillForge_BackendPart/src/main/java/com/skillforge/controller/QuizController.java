package com.skillforge.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.skillforge.dto.QuizGenerationRequest;
import com.skillforge.entity.Course;
import com.skillforge.entity.Quiz;
import com.skillforge.entity.QuizAttempt;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.QuizAttemptRepository;
import com.skillforge.service.QuizService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @PostMapping("/generate")
    public ResponseEntity<?> generateQuiz(@RequestBody QuizGenerationRequest request) {
        // Note: This endpoint is also accessible via /api/quiz/generate for backward compatibility
        try {
            Integer count = request.getNumberOfQuestions();
            if (count == null || count <= 0) {
                count = 5;
            }

            Long courseId = request.getCourseId();
            if (courseId == null) {
                return ResponseEntity.badRequest().body("Missing courseId");
            }

            Course course = courseRepository.findById(courseId).orElse(null);
            if (course == null) {
                return ResponseEntity.badRequest().body("Course not found");
            }

            // ✅ Get logged-in instructor from JWT
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName(); // usually the username (email)
            Long instructorId = quizService.getUserIdByEmail(email);

            if (course.getInstructor() == null || !course.getInstructor().getId().equals(instructorId)) {
                return ResponseEntity.status(403).body("Instructor not authorized for this course");
            }

            // ✅ Generate using AI
            if ("AI".equalsIgnoreCase(request.getGenerationType()) || request.getTopic() != null) {
                Quiz quiz = quizService.generateQuizFromTopic(
                        request.getTopic() != null ? request.getTopic() : course.getTitle(),
                        instructorId,
                        geminiApiKey,
                        courseId,
                        request.getTimeLimitMinutes(),
                        count
                );
                return ResponseEntity.ok(quiz);
            }

            // ✅ Manual quiz creation
            Quiz created = quizService.createManualQuiz(
                    request.getTopic(),
                    instructorId,
                    courseId,
                    request.getQuestions(),
                    request.getTimeLimitMinutes()
            );
            return ResponseEntity.ok(created);

        } catch (Exception e) {
            e.printStackTrace();
            String errorMessage = "Error generating quiz: " + e.getMessage();
            
            // Provide more helpful error messages
            if (e.getMessage() != null) {
                if (e.getMessage().contains("Gemini API key")) {
                    errorMessage = "Gemini API key is not configured. Please set gemini.api.key in application.properties";
                } else if (e.getMessage().contains("parse JSON")) {
                    errorMessage = "Failed to parse AI response. The AI may have returned invalid JSON format. " + e.getMessage();
                } else if (e.getMessage().contains("missing 'questions'")) {
                    errorMessage = "AI response format is incorrect. Expected JSON with 'questions' array. " + e.getMessage();
                }
            }
            
            return ResponseEntity.badRequest().body(errorMessage);
        }
    }

    // ✅ Get quizzes by course ID - for students enrolled in the course
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getQuizzesByCourse(@PathVariable Long courseId) {
        try {
            List<Quiz> quizzes = quizService.getQuizzesByCourse(courseId);
            return ResponseEntity.ok(quizzes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching quizzes: " + e.getMessage());
        }
    }

    // ✅ Get quiz by ID - for taking the quiz
    @GetMapping("/{quizId}")
    public ResponseEntity<?> getQuizById(@PathVariable Long quizId) {
        try {
            Quiz quiz = quizService.getQuizById(quizId);
            if (quiz == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(quiz);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching quiz: " + e.getMessage());
        }
    }

    // ✅ Generate improvement quiz based on student's previous attempts
    @PostMapping("/generate-improvement")
    public ResponseEntity<?> generateImprovementQuiz(@RequestBody Map<String, Object> request) {
        try {
            Long originalQuizId = Long.valueOf(request.get("originalQuizId").toString());
            Long courseId = Long.valueOf(request.get("courseId").toString());
            String weakAreas = request.getOrDefault("weakAreas", "all").toString();

            // Get logged-in student from JWT
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            Long studentId = quizService.getUserIdByEmail(email);

            if (studentId == null) {
                return ResponseEntity.status(401).body("Student not authenticated");
            }

            // Get original quiz
            Quiz originalQuiz = quizService.getQuizById(originalQuizId);
            if (originalQuiz == null) {
                return ResponseEntity.badRequest().body("Original quiz not found");
            }

            // Get student's attempts for this quiz
            List<QuizAttempt> attempts = quizAttemptRepository.findByQuizId(originalQuizId);
            attempts = attempts.stream()
                    .filter(a -> a.getStudent() != null && a.getStudent().getId().equals(studentId))
                    .toList();

            if (attempts.isEmpty()) {
                return ResponseEntity.badRequest().body("No attempts found for this quiz");
            }

            // Analyze performance and generate improvement quiz
            double avgScore = attempts.stream()
                    .mapToDouble(a -> a.getScore() != null ? a.getScore() : 0)
                    .average()
                    .orElse(0);

            String topic = originalQuiz.getTitle() + " - Improvement Practice";
            String improvementPrompt = String.format(
                    "Generate %d multiple choice questions about '%s' focused on improving weak areas. " +
                    "The student's average score is %.1f%%. " +
                    "Create challenging but educational questions that help reinforce understanding. " +
                    "Return ONLY valid JSON (no markdown) with structure: {\"questions\":[{\"prompt\":\"Question text?\",\"options\":[\"Option 1\",\"Option 2\",\"Option 3\",\"Option 4\"],\"correct\":0}]}",
                    originalQuiz.getQuestions().size(),
                    originalQuiz.getTitle(),
                    avgScore
            );

            // Generate improvement quiz using AI
            Quiz improvementQuiz = quizService.generateQuizFromTopic(
                    improvementPrompt,
                    originalQuiz.getInstructor().getId(), // Use same instructor
                    geminiApiKey,
                    courseId,
                    originalQuiz.getTimeLimitMinutes(),
                    originalQuiz.getQuestions().size()
            );

            return ResponseEntity.ok(improvementQuiz);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error generating improvement quiz: " + e.getMessage());
        }
    }
}
