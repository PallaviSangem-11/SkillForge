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
import com.skillforge.repository.CourseRepository;
import com.skillforge.service.QuizService;

@RestController
@RequestMapping("/api/quiz")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private CourseRepository courseRepository;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @PostMapping("/generate")
    public ResponseEntity<?> generateQuiz(@RequestBody QuizGenerationRequest request) {
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
            return ResponseEntity.badRequest().body("Error generating quiz: " + e.getMessage());
        }
    }
}
