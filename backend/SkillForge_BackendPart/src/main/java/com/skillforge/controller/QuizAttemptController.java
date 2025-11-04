package com.skillforge.controller;

import com.skillforge.dto.QuizSubmissionDTO;
import com.skillforge.dto.QuizScoreResponse;
import com.skillforge.entity.*;
import com.skillforge.repository.*;
import com.skillforge.service.QuizService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/quiz-attempts")
@CrossOrigin(origins = "http://localhost:3000")
public class QuizAttemptController {

    @Autowired
    private QuizAttemptRepository repo;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizService quizService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/submit")
    public ResponseEntity<?> submitQuiz(@RequestBody QuizSubmissionDTO submission) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            Long studentId = submission.getStudentId();
            if (studentId == null) {
                Optional<User> user = userRepository.findByEmail(email);
                if (user.isPresent()) {
                    studentId = user.get().getId();
                } else {
                    return ResponseEntity.badRequest().body("Student not found");
                }
            }

            Quiz quiz = quizRepository.findById(submission.getQuizId())
                    .orElseThrow(() -> new RuntimeException("Quiz not found"));

            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            // Calculate score and collect wrong answers
            int correct = 0;
            int total = quiz.getQuestions().size();
            StringBuilder reviewFeedback = new StringBuilder();
            List<com.skillforge.dto.WrongAnswerDTO> wrongAnswers = new ArrayList<>();

            for (Question question : quiz.getQuestions()) {
                String studentAnswer = submission.getAnswers().get(question.getId());
                if (studentAnswer != null && studentAnswer.trim().equalsIgnoreCase(question.getCorrectAnswer().trim())) {
                    correct++;
                } else {
                    // Add to review feedback (for internal use)
                    reviewFeedback.append(String.format("Question: %s - Correct answer: %s%n",
                            question.getPrompt(), question.getCorrectAnswer()));

                    // Add to wrong answers list for detailed review
                    try {
                        List<String> options = new ArrayList<>();
                        if (question.getOptionsJson() != null) {
                            options = objectMapper.readValue(question.getOptionsJson(), List.class);
                        }
                        wrongAnswers.add(new com.skillforge.dto.WrongAnswerDTO(
                                question.getId(),
                                question.getPrompt(),
                                studentAnswer,
                                question.getCorrectAnswer(),
                                options
                        ));
                    } catch (Exception e) {
                        // Skip if JSON parsing fails
                    }
                }
            }

            double score = total > 0 ? (double) correct / total * 100 : 0;

            // Create and save the attempt
            QuizAttempt attempt = new QuizAttempt();
            attempt.setQuiz(quiz);
            attempt.setStudent(student);
            attempt.setScore(score);
            attempt.setAttemptedAt(LocalDateTime.now());
            attempt.setAnswersJson(objectMapper.writeValueAsString(submission.getAnswers()));
            // Store student's personal feedback if provided
            attempt.setFeedback(submission.getStudentFeedback());

            QuizAttempt saved = repo.save(attempt);

            // Build response DTO
            QuizScoreResponse response = new QuizScoreResponse();
            response.setAttemptId(saved.getId());
            response.setScore(score);
            response.setTotalQuestions(total);          // clears all local storage (useful in dev)
            response.setCorrectAnswers(correct);
            response.setFeedback(submission.getStudentFeedback());
            response.setWrongAnswers(wrongAnswers);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/student/{id}")
    public ResponseEntity<?> attemptsForStudent(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(repo.findByStudentId(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<?> attemptsForQuiz(@PathVariable Long quizId) {
        try {
            return ResponseEntity.ok(repo.findByQuizId(quizId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
