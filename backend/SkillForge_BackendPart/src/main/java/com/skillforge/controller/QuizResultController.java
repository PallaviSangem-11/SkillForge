package com.skillforge.controller;

import com.skillforge.entity.Quiz;
import com.skillforge.entity.QuizResult;
import com.skillforge.entity.User;
import com.skillforge.repository.QuizRepository;
import com.skillforge.repository.QuizResultRepository;
import com.skillforge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class QuizResultController {

    @Autowired
    private QuizResultRepository quizResultRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/quizzes/{quizId}/submit")
    public ResponseEntity<?> submit(@PathVariable Long quizId,
                                    @RequestBody Map<String, Object> payload) {
        Quiz quiz = quizRepository.findById(quizId).orElseThrow();
        Long userId = ((Number) payload.get("userId")).longValue();
        User user = userRepository.findById(userId).orElseThrow();
        Double score = payload.get("score") == null ? null : ((Number) payload.get("score")).doubleValue();
        String details = payload.get("details") == null ? null : payload.get("details").toString();
        QuizResult r = new QuizResult();
        r.setQuiz(quiz);
        r.setUser(user);
        r.setScore(score);
        r.setDetails(details);
        r.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(quizResultRepository.save(r));
    }

    @GetMapping("/users/{userId}/quiz-results")
    public ResponseEntity<List<QuizResult>> results(@PathVariable Long userId) {
        return ResponseEntity.ok(quizResultRepository.findByUserId(userId));
    }
}
