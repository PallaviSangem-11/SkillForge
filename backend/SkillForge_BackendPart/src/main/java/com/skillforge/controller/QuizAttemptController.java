
package com.skillforge.controller;

import com.skillforge.config.GeminiConfig;
import com.skillforge.dto.QuizSubmissionDTO;
import com.skillforge.dto.QuizScoreResponse;
import com.skillforge.entity.Question;
import com.skillforge.entity.Quiz;
import com.skillforge.entity.QuizAttempt;
import com.skillforge.entity.User;
import com.skillforge.repository.QuestionRepository;
import com.skillforge.repository.QuizAttemptRepository;
import com.skillforge.repository.QuizRepository;
import com.skillforge.repository.UserRepository;
import com.skillforge.service.QuizService;
import com.skillforge.service.GeminiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;


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

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private GeminiConfig geminiConfig;

    @PostMapping("/submit")
    public ResponseEntity<?> submitQuiz(@RequestBody QuizSubmissionDTO submission) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication != null ? authentication.getName() : null;
            Long studentId = submission.getStudentId();
            if (studentId == null) {
                if (email != null) {
                    Optional<User> user = userRepository.findByEmail(email);
                    if (user.isPresent()) {
                        studentId = user.get().getId();
                    } else {
                        return ResponseEntity.badRequest().body("Student not found");
                    }
                } else {
                    return ResponseEntity.badRequest().body("Student not found");
                }
            }

            Quiz quiz = quizRepository.findById(submission.getQuizId())
                    .orElseThrow(() -> new RuntimeException("Quiz not found"));

            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            int correct = 0;
            int total = quiz.getQuestions().size();
            List<com.skillforge.dto.WrongAnswerDTO> wrongAnswers = new ArrayList<>();

            for (Question question : quiz.getQuestions()) {
                String studentAnswer = submission.getAnswers().get(question.getId());
                if (studentAnswer != null && question.getCorrectAnswer() != null && studentAnswer.trim().equalsIgnoreCase(question.getCorrectAnswer().trim())) {
                    correct++;
                } else {
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
                    } catch (Exception ignored) {
                    }
                }
            }

            double score = total > 0 ? (double) correct / total * 100 : 0;

            QuizAttempt attempt = new QuizAttempt();
            attempt.setQuiz(quiz);
            attempt.setStudent(student);
            attempt.setScore(score);
            attempt.setAttemptedAt(LocalDateTime.now());
            attempt.setAnswersJson(objectMapper.writeValueAsString(submission.getAnswers()));
            attempt.setFeedback(submission.getStudentFeedback());

            QuizAttempt saved = repo.save(attempt);

            QuizScoreResponse response = new QuizScoreResponse();
            response.setAttemptId(saved.getId());
            response.setScore(score);
            response.setTotalQuestions(total);
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

    @GetMapping("/{attemptId}")
    public ResponseEntity<?> getAttemptById(@PathVariable Long attemptId) {
        try {
            return ResponseEntity.ok(repo.findById(attemptId).orElse(null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/quiz/{quizId}/clarify-question")
    public ResponseEntity<?> clarifyQuestionDuringQuiz(@PathVariable Long quizId, @RequestBody Map<String, Object> payload) {
        try {
            Long questionId = payload.get("questionId") != null ? Long.valueOf(payload.get("questionId").toString()) : null;
            String query = payload.getOrDefault("query", "Explain this question and the correct answer.").toString();
            String studentAnswer = payload.get("studentAnswer") != null ? payload.get("studentAnswer").toString() : null;

            if (questionId == null) return ResponseEntity.badRequest().body("Missing questionId");

            Quiz quiz = quizRepository.findById(quizId).orElse(null);
            if (quiz == null) return ResponseEntity.badRequest().body("Quiz not found");

            Question question = questionRepository.findById(questionId).orElse(null);
            if (question == null) return ResponseEntity.badRequest().body("Question not found");

            String prompt = buildClarifyPrompt(question, studentAnswer, query);
            String apiKey = geminiConfig.getApiKey();
            if (apiKey == null || apiKey.isEmpty()) return ResponseEntity.badRequest().body("Gemini API key is not configured");

            String explanation = geminiService.generateText(prompt, apiKey);
            return ResponseEntity.ok(Map.of("explanation", explanation != null ? explanation.trim() : ""));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{attemptId}/clarify")
    public ResponseEntity<?> clarifyAnswer(@PathVariable Long attemptId, @RequestBody Map<String, Object> payload) {
        try {
            Long questionId = payload.get("questionId") != null ? Long.valueOf(payload.get("questionId").toString()) : null;
            String query = payload.getOrDefault("query", "Explain simply").toString();

            if (questionId == null) return ResponseEntity.badRequest().body("Missing questionId");

            QuizAttempt attempt = repo.findById(attemptId).orElse(null);
            if (attempt == null) return ResponseEntity.badRequest().body("Attempt not found");

            Quiz quiz = quizRepository.findById(attempt.getQuiz().getId()).orElse(null);
            if (quiz == null) return ResponseEntity.badRequest().body("Quiz not found");

            Question question = questionRepository.findById(questionId).orElse(null);
            if (question == null) return ResponseEntity.badRequest().body("Question not found");

            Map<Long, String> answers = objectMapper.readValue(attempt.getAnswersJson(), Map.class);
            String studentAnswer = answers != null ? answers.get(questionId) : null;

            String prompt = buildClarifyPrompt(question, studentAnswer, query);
            String apiKey = geminiConfig.getApiKey();
            if (apiKey == null || apiKey.isEmpty()) return ResponseEntity.badRequest().body("Gemini API key is not configured");

            String explanation = geminiService.generateText(prompt, apiKey);
            return ResponseEntity.ok(Map.of("explanation", explanation != null ? explanation.trim() : ""));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    private String buildClarifyPrompt(Question question, String studentAnswer, String studentQuery) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a helpful educational AI tutor. Explain the following multiple choice question in a clear, step-by-step way.\n\n");
        sb.append("Question: ").append(question.getPrompt()).append("\n\n");
        sb.append("Options:\n");
        try {
            java.util.List options = objectMapper.readValue(question.getOptionsJson(), java.util.List.class);
            for (int i = 0; i < options.size(); i++) {
                char letter = (char) ('A' + i);
                sb.append(letter).append(". ").append(String.valueOf(options.get(i))).append("\n");
            }
        } catch (Exception ignored) {
        }
        sb.append("\nCorrect answer: ").append(question.getCorrectAnswer() != null ? question.getCorrectAnswer() : "Not specified").append("\n");
        if (studentAnswer != null && !studentAnswer.trim().isEmpty()) {
            sb.append("Student's answer: ").append(studentAnswer).append("\n");
        }
        sb.append("\nStudent's question: ").append(studentQuery != null ? studentQuery : "Please explain this question").append("\n\n");
        sb.append("Provide a clear, educational explanation that:\n");
        sb.append("1. Explains the key concept\n");
        sb.append("2. Explains why the correct answer is right\n");
        sb.append("3. If the student's answer was wrong, explain why it was incorrect\n");
        sb.append("4. Uses simple, easy-to-understand language\n");
        sb.append("\nFormat your response with clear paragraphs and use proper line breaks.");
        return sb.toString();
    }
}
        
