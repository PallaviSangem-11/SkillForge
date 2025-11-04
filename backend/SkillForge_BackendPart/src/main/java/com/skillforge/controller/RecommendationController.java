package com.skillforge.controller;
import com.skillforge.entity.Course;
import com.skillforge.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "http://localhost:3000")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @GetMapping("/student/{id}")
    public ResponseEntity<List<Course>> recommendForStudent(@PathVariable Long id) {
        return ResponseEntity.ok(recommendationService.recommendForStudent(id));
    }
}
