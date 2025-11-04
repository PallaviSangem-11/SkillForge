package com.skillforge.controller;

import com.skillforge.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:3000")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/student/{id}")
    public ResponseEntity<List<Map<String, Object>>> studentAnalytics(@PathVariable Long id) {
        return ResponseEntity.ok(analyticsService.studentAnalytics(id));
    }

    @GetMapping("/course/{id}")
    public ResponseEntity<Map<String, Object>> courseAnalytics(@PathVariable Long id) {
        return ResponseEntity.ok(analyticsService.courseAnalytics(id));
    }

    @GetMapping("/instructor/{id}")
    public ResponseEntity<Map<String, Object>> instructorAnalytics(@PathVariable Long id) {
        return ResponseEntity.ok(analyticsService.instructorAnalytics(id));
    }
}
