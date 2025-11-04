package com.skillforge.controller;

import com.skillforge.entity.SuggestedQuiz;
import com.skillforge.repository.SuggestedQuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class SuggestedQuizController {

    @Autowired
    private SuggestedQuizRepository repository;

    @GetMapping("/users/{userId}/suggested-quizzes")
    public ResponseEntity<List<SuggestedQuiz>> list(@PathVariable Long userId) {
        return ResponseEntity.ok(repository.findByUserId(userId));
    }
}
