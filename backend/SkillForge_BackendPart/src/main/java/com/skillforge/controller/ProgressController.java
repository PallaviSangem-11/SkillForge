package com.skillforge.controller;

import com.skillforge.entity.Course;
import com.skillforge.entity.QuizAttempt;
import com.skillforge.repository.CourseRepository;
import com.skillforge.repository.QuizAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "http://localhost:3000")
public class ProgressController {

    @Autowired
    private QuizAttemptRepository attemptRepository;

    @Autowired
    private CourseRepository courseRepository;

    @GetMapping("/student/{id}")
    public ResponseEntity<?> progressForStudent(@PathVariable Long id) {
        try {
            List<QuizAttempt> attempts = attemptRepository.findByStudentIdWithQuizCourse(id);
            Map<Long, List<QuizAttempt>> byCourse = new HashMap<>();
            for (QuizAttempt a : attempts) {
                if (a.getQuiz() == null || a.getQuiz().getCourse() == null) continue;
                Long courseId = a.getQuiz().getCourse().getId();
                byCourse.computeIfAbsent(courseId, k -> new ArrayList<>()).add(a);
            }

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map.Entry<Long, List<QuizAttempt>> e : byCourse.entrySet()) {
                Long cid = e.getKey();
                double avg = e.getValue().stream().mapToDouble(a -> a.getScore() == null ? 0 : a.getScore()).average().orElse(0);
                Optional<Course> copt = courseRepository.findById(cid);
                Map<String, Object> item = new HashMap<>();
                item.put("courseId", cid);
                item.put("avgScore", avg);
                item.put("title", copt.map(Course::getTitle).orElse("Unknown"));
                result.add(item);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
